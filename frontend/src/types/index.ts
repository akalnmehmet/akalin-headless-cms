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
  slug: string;
  description: string;
  post_count: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface BlogPostList {
  id: string;
  title: string;
  slug: string;
  summary: string;
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
  meta_title: string;
  meta_description: string;
  updated_at: string;
}

export interface BlogPostAdmin {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured_image: Media | null;
  featured_image_detail: Media | null;
  content_html: string;
  content_json: unknown;           // GrapesJS component tree (array) veya {} (boş)
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
  slug: string;
  description: string;
  tech_stack: string[];
  thumbnail: Media | null;
  gallery?: Media[];
  github_url: string;
  live_url: string;
  status: "ACTIVE" | "ARCHIVED" | "IN_PROGRESS";
  is_featured: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
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
