"""Service for forwarding detection results to SNS Agent Workbench Webhook."""
import asyncio
from typing import Optional
from urllib.parse import urlparse
import httpx
from app.config import settings
from app.schemas.models import SNSPayload
from app.utils.logger import logger


def _mask_url(url: str) -> str:
    """Mask sensitive tokens or query parameters in URLs for secure logging."""
    try:
        parsed = urlparse(url)
        masked_netloc = parsed.netloc
        path = parsed.path
        return f"{parsed.scheme}://{masked_netloc}{path}" + ("?***" if parsed.query else "")
    except Exception:
        return "URL_REDACTED"


class SNSService:
    """Handles asynchronous delivery of structured defect alerts to SNS Agent Workbench."""

    def __init__(
        self,
        webhook_url: Optional[str] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        self._webhook_url = webhook_url
        self._timeout = timeout
        self._max_retries = max_retries

    @property
    def webhook_url(self) -> Optional[str]:
        return self._webhook_url if self._webhook_url is not None else settings.SNS_WEBHOOK_URL

    @webhook_url.setter
    def webhook_url(self, value: Optional[str]) -> None:
        self._webhook_url = value

    @property
    def timeout(self) -> float:
        return self._timeout if self._timeout is not None else settings.SNS_TIMEOUT_SECONDS

    @timeout.setter
    def timeout(self, value: float) -> None:
        self._timeout = value

    @property
    def max_retries(self) -> int:
        return self._max_retries if self._max_retries is not None else settings.SNS_MAX_RETRIES

    @max_retries.setter
    def max_retries(self, value: int) -> None:
        self._max_retries = value


    async def forward_detection(self, payload: SNSPayload) -> str:
        """
        Deliver detection event JSON payload to SNS Agent Workbench webhook.
        Employs exponential backoff retries. Never raises unhandled exceptions.
        Returns a delivery status string.
        """
        if not self.webhook_url or not self.webhook_url.strip():
            logger.info("SNS_WEBHOOK_URL is not configured; skipping webhook delivery.")
            return "SKIPPED_NOT_CONFIGURED"

        safe_endpoint = _mask_url(self.webhook_url)
        payload_data = payload.model_dump()
        payload_data["highest_severity"] = payload.highest_severity.value
        payload_data["inspection_status"] = payload.inspection_status.value
        payload_data["defects"] = [
            {
                "type": d.type,
                "confidence": d.confidence,
                "severity": d.severity.value,
            }
            for d in payload.defects
        ]

        attempt = 0
        backoff_delay = 1.0  # seconds

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while attempt <= self.max_retries:
                attempt += 1
                try:
                    logger.info(
                        f"Delivering CV result for machine '{payload.machine_id}' to SNS ({safe_endpoint}), attempt {attempt}/{self.max_retries + 1}"
                    )
                    response = await client.post(
                        self.webhook_url,
                        json=payload_data,
                        headers={"Content-Type": "application/json", "User-Agent": "SmartShop-CV-API/1.0"}
                    )

                    if response.is_success:
                        logger.info(
                            f"Successfully delivered CV alert to SNS ({safe_endpoint}) - HTTP {response.status_code}"
                        )
                        return "DELIVERED"
                    else:
                        logger.warning(
                            f"SNS webhook responded with HTTP {response.status_code} on attempt {attempt}: {response.text[:200]}"
                        )

                except httpx.TimeoutException as exc:
                    logger.warning(
                        f"Timeout connecting to SNS webhook ({safe_endpoint}) on attempt {attempt}: {exc}"
                    )
                except httpx.RequestError as exc:
                    logger.warning(
                        f"Network request error connecting to SNS webhook ({safe_endpoint}) on attempt {attempt}: {exc}"
                    )
                except Exception as exc:
                    logger.error(
                        f"Unexpected error posting to SNS webhook ({safe_endpoint}) on attempt {attempt}: {exc}"
                    )

                if attempt <= self.max_retries:
                    logger.info(f"Retrying SNS delivery in {backoff_delay:.1f}s...")
                    await asyncio.sleep(backoff_delay)
                    backoff_delay *= 2.0

        logger.error(
            f"Failed to deliver CV result for machine '{payload.machine_id}' to SNS after {self.max_retries + 1} attempts."
        )
        return "FAILED_AFTER_RETRIES"


sns_service = SNSService()
