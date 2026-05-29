import { useEffect, useRef, useState } from "react";
import { getComments, postComment } from "../api/comments";
import type { Comment } from "../types";

interface Props {
  slug: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return "az önce";
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30)  return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

interface CommentItemProps {
  comment: Comment;
  onReply: (id: string, name: string) => void;
}

function CommentItem({ comment, onReply }: CommentItemProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[14px] font-semibold text-on-surface-variant">
          {comment.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[13px] font-semibold text-on-surface">{comment.name}</span>
            <span className="text-[11px] text-outline font-mono">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-[14px] text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words">
            {comment.body}
          </p>
          <button
            onClick={() => onReply(comment.id, comment.name)}
            className="mt-1.5 text-[11px] text-outline hover:text-primary font-mono transition-colors"
          >
            Yanıtla
          </button>
        </div>
      </div>

      {/* Yanıtlar */}
      {comment.replies.length > 0 && (
        <div className="ml-11 pl-3 border-l-2 border-outline-variant/40 flex flex-col gap-3">
          {comment.replies.map((r) => (
            <div key={r.id} className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-[12px] font-semibold text-on-surface-variant">
                {r.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[12px] font-semibold text-on-surface">{r.name}</span>
                  <span className="text-[10px] text-outline font-mono">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words">
                  {r.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ slug }: Props) {
  const [comments, setComments]     = useState<Comment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus]         = useState<"idle" | "success" | "error" | "rate_limit">("idle");

  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody]   = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getComments(slug)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleReply = (id: string, name: string) => {
    setReplyTo({ id, name });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !body.trim()) return;
    setSubmitting(true);
    setStatus("idle");
    try {
      await postComment(slug, {
        name: name.trim(),
        email: email.trim(),
        body: body.trim(),
        parent: replyTo?.id ?? null,
      });
      setStatus("success");
      setBody("");
      setReplyTo(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setStatus(status === 429 ? "rate_limit" : "error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section className="mt-16 pt-12 border-t border-outline-variant">
      {/* Başlık */}
      <h3 className="text-[20px] font-semibold text-on-surface mb-8 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          chat_bubble
        </span>
        Yorumlar
        {totalCount > 0 && (
          <span className="text-[14px] font-mono text-on-surface-variant ml-1">({totalCount})</span>
        )}
      </h3>

      {/* Yorum listesi */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-variant shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-surface-variant rounded w-1/4" />
                <div className="h-12 bg-surface-variant rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[14px] text-on-surface-variant mb-8">
          Henüz yorum yok. İlk yorumu sen yap!
        </p>
      ) : (
        <div className="space-y-6 mb-10">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} onReply={handleReply} />
          ))}
        </div>
      )}

      {/* Form */}
      <div ref={formRef} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        {/* Yanıt etiketi */}
        {replyTo && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/8 text-primary text-[12px]">
            <span className="material-symbols-outlined text-[14px]">reply</span>
            <span className="font-mono">{replyTo.name} adlı kişiye yanıt veriyorsunuz</span>
            <button
              onClick={() => setReplyTo(null)}
              className="ml-auto hover:opacity-70 transition-opacity"
              aria-label="İptal"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        <h4 className="text-[14px] font-semibold text-on-surface mb-4">
          {replyTo ? "Yanıt Yaz" : "Yorum Bırak"}
        </h4>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-on-surface-variant font-mono mb-1">
                İsim <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                placeholder="Adınız"
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-on-surface-variant font-mono mb-1">
                E-posta <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@mail.com"
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
              <p className="text-[10px] text-outline mt-0.5 font-mono">E-posta adresiniz yayımlanmaz.</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-on-surface-variant font-mono mb-1">
              Yorum <span className="text-primary">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              required
              rows={4}
              placeholder="Düşüncelerinizi paylaşın..."
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
            />
            <p className="text-[10px] text-outline mt-0.5 font-mono text-right">
              {body.length}/2000
            </p>
          </div>

          {/* Status mesajları */}
          {status === "success" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px]">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Yorumunuz moderasyon kuyruğuna alındı. Onaylandıktan sonra yayımlanacak.
            </div>
          )}
          {status === "rate_limit" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px]">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Çok fazla yorum denemesi. Lütfen bir süre bekleyin.
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
              <span className="material-symbols-outlined text-[14px]">error</span>
              Bir hata oluştu. Lütfen tekrar deneyin.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim() || !body.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-on-primary text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                Gönderiliyor...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[15px]">send</span>
                Yorum Gönder
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
