import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { subscribe } from "../api/newsletter";

type UIState = "idle" | "loading" | "success" | "error" | "duplicate";

/** URL param ?newsletter=confirmed|unsubscribed|invalid mesajlarını göster */
function useNewsletterParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("newsletter");

  useEffect(() => {
    if (param) {
      // Param'ı URL'den temizle (history replace)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("newsletter");
        return next;
      }, { replace: true });
    }
  }, [param, setSearchParams]);

  return param;
}

export default function NewsletterWidget() {
  const [email,    setEmail]   = useState("");
  const param    = useNewsletterParam();
  const [uiState,  setUiState] = useState<UIState>(
    param === "confirmed" ? "success" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || uiState === "loading") return;

    setUiState("loading");
    setErrorMsg("");

    try {
      await subscribe(email.trim());
      setUiState("success");
      setEmail("");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })
        ?.response?.status;
      if (status === 409) {
        setUiState("duplicate");
      } else {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Bir hata oluştu. Lütfen tekrar deneyin.";
        setErrorMsg(msg);
        setUiState("error");
      }
    }
  };

  /* ── Başarı durumu ── */
  if (uiState === "success") {
    return (
      <div className="rounded-2xl border border-[#00d4ff]/20 bg-[#003344]/30 p-6 flex items-start gap-4">
        <span
          className="material-symbols-outlined text-[28px] text-[#00d4ff] shrink-0 mt-0.5"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          mark_email_read
        </span>
        <div>
          <p className="text-[15px] font-semibold text-on-surface mb-1">
            Onay e-postası gönderildi!
          </p>
          <p className="text-[13px] text-on-surface-variant leading-relaxed">
            Gelen kutunuzu kontrol edin ve aboneliği onaylayın.
            Spam klasörünü de kontrol etmeyi unutmayın.
          </p>
        </div>
      </div>
    );
  }

  /* ── Zaten abone ── */
  if (uiState === "duplicate") {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container p-6 flex items-start gap-4">
        <span className="material-symbols-outlined text-[24px] text-on-surface-variant shrink-0 mt-0.5">
          info
        </span>
        <div>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            Bu e-posta zaten aktif olarak abone.
          </p>
          <button
            onClick={() => { setUiState("idle"); setEmail(""); }}
            className="mt-2 text-[12px] text-primary hover:underline"
          >
            Farklı bir e-posta dene
          </button>
        </div>
      </div>
    );
  }

  /* ── Ana form ── */
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-2">
        <span
          className="material-symbols-outlined text-[22px] text-[#00d4ff]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          mail
        </span>
        <h3 className="text-[17px] font-semibold text-on-surface">
          Newsletter
        </h3>
      </div>
      <p className="text-[13px] text-on-surface-variant leading-relaxed mb-5">
        Yeni blog yazısı yayınlandığında e-posta ile haber al.
        İstediğin zaman abonelikten çıkabilirsin.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          ref={inputRef}
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setUiState("idle"); }}
          placeholder="e-posta@adresin.com"
          disabled={uiState === "loading"}
          className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2.5
                     text-[13px] text-on-surface placeholder:text-outline
                     focus:outline-none focus:border-[#00d4ff]/60 focus:ring-1 focus:ring-[#00d4ff]/30
                     disabled:opacity-50 transition-colors"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        />
        <button
          type="submit"
          disabled={uiState === "loading" || !email.trim()}
          className="flex items-center justify-center gap-2 bg-[#00d4ff] text-[#0a0d14]
                     text-[13px] font-semibold px-5 py-2.5 rounded-xl
                     hover:opacity-90 active:opacity-80 disabled:opacity-40
                     transition-opacity shrink-0"
        >
          {uiState === "loading" ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
              Gönderiliyor...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">send</span>
              Abone Ol
            </>
          )}
        </button>
      </form>

      {/* Hata */}
      {uiState === "error" && (
        <p className="mt-3 text-[12px] text-error flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
