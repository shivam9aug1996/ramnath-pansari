export function getProductTitleFromExtraData(
  extraData: unknown,
  fallback = "Product",
): string {
  if (!extraData) return fallback;

  try {
    const parsed =
      typeof extraData === "string" ? JSON.parse(extraData) : extraData;
    return parsed?.name || fallback;
  } catch {
    return fallback;
  }
}
