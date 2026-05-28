export interface Media {
  id: string;
  file_url: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  uploaded_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  description: string;
  description_en?: string | null;
  post_count: number;
}

export interface Tag {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  color: string;
}

export interface BlogPostList {
  id: string;
  title: string;
  title_en?: string | null;
  slug: string;
  summary: string;
  summary_en?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured_image: Media | null;
  categories: Category[];
  tags: Tag[];
  reading_time: number;
  view_count: number;
  created_at: string;
}

export interface BlogPostDetail extends BlogPostList {
  content_html: string;
  content_html_en?: string | null;
  meta_title: string;
  meta_description: string;
  updated_at: string;
}

export interface BlogPostAdmin {
  id: string;
  title: string;
  title_en?: string | null;
  slug: string;
  summary: string;
  summary_en?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publish_at: string | null;
  featured_image: Media | null;
  featured_image_detail: Media | null;
  content_html: string;
  content_html_en?: string | null;
  content_json: unknown;           // GrapesJS component tree (array) veya {} (boş)
  content_json_en?: unknown | null;
  categories: string[];            // UUID listesi — yazma için
  categories_detail: Category[];   // Tam nesneler — gösterim için
  tags: string[];                  // UUID listesi — yazma için
  tags_detail: Tag[];              // Tam nesneler — gösterim için
  meta_title: string;
  meta_description: string;
  reading_time: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  title_en?: string | null;
  slug: string;
  description: string;
  description_en?: string | null;
  tech_stack: string[];
  thumbnail: Media | null;
  /** Admin serializer'dan gelen tam Media nesnesi (okuma). */
  thumbnail_detail?: Media | null;
  gallery?: Media[];
  github_url: string;
  live_url: string;
  status: "ACTIVE" | "ARCHIVED" | "IN_PROGRESS";
  is_featured: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
}

export interface SiteSettings {
  id: number;
  owner_name: string;
  owner_image?: Media | null;
  owner_image_detail?: Media | null;
  owner_title: string;
  owner_title_en?: string | null;
  owner_bio: string;
  owner_bio_en?: string | null;
  about_bio?: string | null;
  about_bio_en?: string | null;
  status_text: string;
  status_text_en?: string | null;
  status_active: boolean;
  skills: string[];
  github_url: string;
  linkedin_url: string;
  cv_url: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export type CareerEntryType = "WORK" | "EDUCATION" | "VOLUNTEER";

export interface CareerEntry {
  id: string;
  company: string;
  company_en?: string | null;
  position: string;
  position_en?: string | null;
  location: string;
  location_en?: string | null;
  entry_type: CareerEntryType;
  description: string;
  description_en?: string | null;
  tech_stack: string[];
  start_date: string;         // "YYYY-MM-DD"
  end_date: string | null;
  is_current: boolean;
  sort_order: number;
}

