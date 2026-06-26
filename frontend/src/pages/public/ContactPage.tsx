import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, CheckCircle, AlertCircle, GitBranch, Link2, Loader2 } from "lucide-react";

import { sendContact } from "../../api/contact";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="pt-[100px] pb-24 px-4 sm:px-6 max-w-2xl mx-auto">

      {/* Başlık */}
      <header className="mb-12">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-primary uppercase mb-3 font-mono">
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
        <div className="mb-8 flex items-start gap-3 px-5 py-4 rounded-xl border border-tertiary/20 bg-tertiary/5 text-tertiary">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-[14px] font-semibold">{t("contact.successMessage")}</p>
        </div>
      )}

      {/* Sunucu hatası */}
      {serverError && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl border border-error/20 bg-error/5 text-error text-[13px]">
          <AlertCircle className="h-4 w-4" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* Ad */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-name" className="text-[11px] font-semibold tracking-[0.06em] text-on-surface-variant uppercase font-mono">
            {t("contact.name")}
          </Label>
          <Input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder={t("contact.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className={`h-12 text-[15px] bg-surface-container-lowest ${
              fieldErrors.name ? "border-error focus-visible:ring-error/30" : "border-outline-variant focus-visible:ring-primary/20"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-[12px] text-error flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* E-posta */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-email" className="text-[11px] font-semibold tracking-[0.06em] text-on-surface-variant uppercase font-mono">
            {t("contact.email")}
          </Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder={t("contact.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className={`h-12 text-[15px] bg-surface-container-lowest ${
              fieldErrors.email ? "border-error focus-visible:ring-error/30" : "border-outline-variant focus-visible:ring-primary/20"
            }`}
          />
          {fieldErrors.email && (
            <p className="text-[12px] text-error flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Mesaj */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="contact-message" className="text-[11px] font-semibold tracking-[0.06em] text-on-surface-variant uppercase font-mono">
              {t("contact.message")}
            </Label>
            <span className={`text-[11px] font-mono ${message.length > 1800 ? "text-error" : "text-on-surface-variant/50"}`}>
              {message.length}/2000
            </span>
          </div>
          <Textarea
            id="contact-message"
            rows={6}
            placeholder={t("contact.messagePlaceholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            disabled={submitting}
            className={`text-[15px] bg-surface-container-lowest ${
              fieldErrors.message ? "border-error focus-visible:ring-error/30" : "border-outline-variant focus-visible:ring-primary/20"
            }`}
          />
          {fieldErrors.message && (
            <p className="text-[12px] text-error flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {fieldErrors.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting || success}
          className="w-full h-12 text-[15px]"
          size="lg"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{t("contact.sending")}</>
          ) : success ? (
            <><CheckCircle className="h-4 w-4" />{t("contact.sent")}</>
          ) : (
            <><Send className="h-4 w-4" />{t("contact.send")}</>
          )}
        </Button>
      </form>

      {/* Alternatif iletişim */}
      <div className="mt-16 pt-8">
        <Separator className="mb-8 bg-outline-variant" />
        <p className="text-[11px] font-semibold tracking-[0.08em] text-on-surface-variant uppercase mb-4 font-mono">
          {t("contact.orDirectly")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild className="border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary font-mono text-[13px]">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <GitBranch className="h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button variant="outline" asChild className="border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary font-mono text-[13px]">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Link2 className="h-4 w-4" />
              LinkedIn
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
