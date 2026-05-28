import { useState } from "react";
import { useTranslation } from "react-i18next";

import { sendContact } from "../../api/contact";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";

type FieldErrors = { name?: string; email?: string; message?: string };

export default function ContactPage() {
  const { t } = useTranslation();
  useDocumentMeta({ title: t("contact.title") + " — Portföy", description: t("contact.description") });

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setServerError(null);

    try {
      await sendContact({ name, email, message });
      setSuccess(true);
      setName(""); setEmail(""); setMessage("");
    } catch (err: unknown) {
      const data = (err as { response?: { data?: FieldErrors & { detail?: string } } })?.response?.data;
      if (data?.detail) {
        setServerError(data.detail);
      } else if (data) {
        setFieldErrors({
          name:    data.name,
          email:   data.email,
          message: data.message,
        });
      } else {
        setServerError(t("contact.errorMessage"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full border rounded-xl bg-surface-container-lowest px-4 py-3 text-[15px] text-on-surface
     placeholder:text-on-surface-variant/40 outline-none transition-colors duration-150
     focus:ring-1 ${
       hasError
         ? "border-error focus:border-error focus:ring-error/30"
         : "border-outline-variant focus:border-primary focus:ring-primary/20"
     }`;

  return (
    <div className="pt-[100px] pb-24 px-4 sm:px-6 max-w-2xl mx-auto">

      {/* Başlık */}
      <header className="mb-12">
        <p
          className="text-[12px] font-semibold tracking-[0.12em] text-primary uppercase mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          // {t("contact.title").toLowerCase()}
        </p>
        <h1 className="text-[40px] sm:text-[48px] font-bold tracking-[-0.02em] text-on-surface leading-[1.1] mb-4">
          {t("contact.title")}
        </h1>
        <p className="text-[16px] text-on-surface-variant leading-relaxed">
          {t("contact.description")}
        </p>
      </header>

      {/* Başarı mesajı */}
      {success && (
        <div className="mb-8 flex items-start gap-3 px-5 py-4 rounded-xl border border-[#10b981]/20 bg-[#10b981]/08 text-[#10b981]">
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">check_circle</span>
          <div>
            <p className="text-[14px] font-semibold">{t("contact.successMessage")}</p>
          </div>
        </div>
      )}

      {/* Sunucu hatası */}
      {serverError && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl border border-error/20 bg-error/08 text-error text-[13px]">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* Ad */}
        <div>
          <label
            className="block text-[11px] font-semibold tracking-[0.06em] text-on-surface-variant uppercase mb-2"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {t("contact.name")}
          </label>
          <input
            type="text"
            autoComplete="name"
            placeholder={t("contact.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className={inputCls(!!fieldErrors.name)}
          />
          {fieldErrors.name && (
            <p className="mt-1.5 text-[12px] text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">error</span>
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* E-posta */}
        <div>
          <label
            className="block text-[11px] font-semibold tracking-[0.06em] text-on-surface-variant uppercase mb-2"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {t("contact.email")}
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder={t("contact.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className={inputCls(!!fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-[12px] text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">error</span>
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Mesaj */}
        <div>
          <label
            className="block text-[11px] font-semibold tracking-[0.06em] text-on-surface-variant uppercase mb-2 flex items-center justify-between"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span>{t("contact.message")}</span>
            <span className={message.length > 1800 ? "text-error" : "text-on-surface-variant/50"}>
              {message.length}/2000
            </span>
          </label>
          <textarea
            rows={6}
            placeholder={t("contact.messagePlaceholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            disabled={submitting}
            className={`${inputCls(!!fieldErrors.message)} resize-none`}
          />
          {fieldErrors.message && (
            <p className="mt-1.5 text-[12px] text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">error</span>
              {fieldErrors.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || success}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-on-primary text-[15px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity duration-150"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              {t("contact.sending")}
            </>
          ) : success ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check</span>
              {t("contact.sent")}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">send</span>
              {t("contact.send")}
            </>
          )}
        </button>
      </form>

      {/* Alternatif iletişim */}
      <div className="mt-16 pt-8 border-t border-outline-variant">
        <p
          className="text-[11px] font-semibold tracking-[0.08em] text-on-surface-variant uppercase mb-4"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {t("contact.orDirectly")}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary text-[13px] font-medium transition-colors duration-150"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            GitHub
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary text-[13px] font-medium transition-colors duration-150"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <span className="material-symbols-outlined text-[16px]">work</span>
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
