FROM python:3.11-slim

# Install system dependencies required by OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code and model weights
COPY . .

# Ensure upload and annotated artifact directories exist
RUN mkdir -p uploads annotated

EXPOSE 8000

# Production launch command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
