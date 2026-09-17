/**
 * Utility to check WebGL availability and system motion preferences.
 */
let _cachedWebGL = null;

export function isWebGLAvailable() {
  if (_cachedWebGL !== null) return _cachedWebGL;
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
      _cachedWebGL = false;
      return false;
    }
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    _cachedWebGL = !!gl;
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    return _cachedWebGL;
  } catch (e) {
    _cachedWebGL = false;
    return false;
  }
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function canRender3D() {
  return isWebGLAvailable() && !prefersReducedMotion();
}
