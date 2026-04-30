export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export function todayIsoDate(now = new Date()) {
  return now.toISOString().split("T")[0];
}

export function validateApplicationForm(formData, { now = new Date() } = {}) {
  const errors = {};
  const data = formData || {};
  if (!data.company) errors.company = "Company is required";
  if (!data.role) errors.role = "Role is required";
  if (!data.data) {
    errors.data = "Date is required";
  } else if (data.data > todayIsoDate(now)) {
    errors.data = "Date cannot be in the future";
  }
  return errors;
}

export function validateResumeFile(file) {
  if (!file) return { ok: false, error: "No file selected" };
  if (typeof file.size !== "number") return { ok: false, error: "Invalid file" };
  if (file.size === 0) return { ok: false, error: "File appears to be empty" };
  if (file.size > MAX_RESUME_BYTES) return { ok: false, error: "File must be under 5MB" };
  return { ok: true };
}

export function isImageFile(file) {
  if (!file || typeof file.type !== "string") return false;
  return file.type.startsWith("image/");
}

// Used for chat attachment uploads: must be an image AND non-empty.
export function validateChatImage(file) {
  if (!isImageFile(file)) return { ok: false, error: "Only image files are allowed" };
  if (typeof file.size !== "number") return { ok: false, error: "Invalid file" };
  if (file.size === 0) return { ok: false, error: "File appears to be empty" };
  return { ok: true };
}
