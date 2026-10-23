/** Opens a camera stream, preferring the rear camera but falling back to
 * whatever camera is actually available (desktop webcams have no "environment"
 * option, and treating that as a hard requirement would fail outright there). */
export async function openCameraStream(): Promise<MediaStream> {
  if (!window.isSecureContext) {
    throw new Error(
      "Camera access needs a secure connection (https://, or http://localhost). This page isn't loaded over one.",
    );
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser doesn't support camera access.");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1600 } },
    });
  } catch {
    return await navigator.mediaDevices.getUserMedia({ video: true });
  }
}

export function describeCameraError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotFoundError") return "No camera was found on this device.";
    if (err.name === "NotAllowedError") {
      return "Camera access was blocked. Allow camera permission for this site in your browser, then reload.";
    }
    if (err.name === "NotReadableError") return "Your camera is already in use by another app.";
    return err.message || err.name;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error.";
}
