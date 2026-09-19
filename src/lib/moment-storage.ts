const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const maxMomentBytes = 5 * 1024 * 1024;
export const momentBucket = "moments";

export function normalizeImageType(type: string) {
  const base = type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "image/jpg") return "image/jpeg";
  return allowedTypes[base] ? base : "";
}

export function extensionForImageType(type: string) {
  return allowedTypes[normalizeImageType(type)] ?? "";
}

export function momentObjectPath(
  patientId: string,
  authorId: string,
  momentId: string,
  type: string,
) {
  const extension = extensionForImageType(type);
  if (!extension) return null;
  return `${patientId}/${authorId}/${momentId}.${extension}`;
}
