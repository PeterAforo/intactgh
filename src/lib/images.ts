/**
 * Pre-transform Cloudinary URLs so the Next image optimizer fetches a
 * right-sized, auto-format source instead of the full original.
 */
export function imgUrl(url: string | null | undefined, width = 1200): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
}
