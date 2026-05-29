/**
 * Cloudinary URL dönüşüm yardımcısı
 *
 * Cloudinary URL'lerinde `/upload/` sonrasına otomatik olarak
 * f_auto (WebP/AVIF), q_auto ve boyut parametrelerini ekler.
 * Cloudinary dışı URL'lere dokunmaz.
 *
 * Kullanım:
 *   clImg(post.featured_image.file_url, "hero")
 *   clImg(project.thumbnail.file_url, "thumbnail")
 */

export type CloudinarySize =
  | "thumbnail"   // 640×360  — kart görselleri
  | "hero"        // 1200×630 — blog/proje kapağı
  | "avatar"      // 200×200  — profil fotoğrafı
  | "gallery"     // 1200px geniş — galeri/lightbox
  | "og";         // 1200×630 — og:image

/** Boyuta göre Cloudinary transform string'leri */
const TRANSFORMS: Record<CloudinarySize, string> = {
  thumbnail: "f_auto,q_auto,w_640,h_360,c_fill,g_auto",
  hero:      "f_auto,q_auto,w_1200,h_630,c_fill,g_auto",
  avatar:    "f_auto,q_auto,w_200,h_200,c_fill,g_face",
  gallery:   "f_auto,q_auto,w_1200",
  og:        "f_auto,q_auto,w_1200,h_630,c_fill,g_auto",
};

/**
 * Cloudinary URL'ine transform ekler; Cloudinary dışı URL'leri olduğu gibi döndürür.
 * @param url    - Orijinal file_url
 * @param size   - Ön tanımlı boyut (varsayılan: "thumbnail")
 */
export function clImg(
  url: string | undefined | null,
  size: CloudinarySize = "thumbnail",
): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  // Zaten transform içeren URL'leri tekrar dönüştürme
  if (url.includes(`/upload/${TRANSFORMS[size]}`)) return url;
  return url.replace("/upload/", `/upload/${TRANSFORMS[size]}/`);
}
