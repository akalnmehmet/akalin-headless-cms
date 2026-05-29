import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { adminLogin, totpVerify } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";

type Step = "credentials" | "totp";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep]         = useState<Step>("credentials");
  const [sessionKey, setSessionKey] = useState("");
  const [totpCode, setTotpCode]  = useState("");
  const [error, setError]        = useState<string | null>(null);
  const [loading, setLoading]    = useState(false);
  const { setTokens }            = useAuthStore();
  const navigate                 = useNavigate();
  const totpRef                  = useRef<HTMLInputElement>(null);

  const inputCls =
    "w-full border border-outline-variant rounded-lg bg-surface-container-low px-3 py-2.5 text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-150";

  /* ── Adım 1: kullanıcı adı + şifre ── */
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await adminLogin(username, password);
      if (result.requires_2fa && result.session_key) {
        setSessionKey(result.session_key);
        setStep("totp");
        setTimeout(() => totpRef.current?.focus(), 100);
      } else if (result.access && result.refresh) {
        setTokens(result.access, result.refresh);
        navigate("/admin");
      }
    } catch {
      setError("Kullanıcı adı veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Adım 2: TOTP kodu ── */
  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await totpVerify(sessionKey, totpCode);
      setTokens(tokens.access, tokens.refresh);
      navigate("/admin");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Geçersiz kod. Lütfen tekrar deneyin.");
      setTotpCode("");
      totpRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Glow arka plan */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm">
        {/* ── Adım 1: Kimlik bilgileri ── */}
        {step === "credentials" && (
          <form
            onSubmit={handleCredentials}
            className="bg-surface border border-outline-variant rounded-2xl p-8 space-y-5 shadow-[0_0_40px_rgba(0,212,255,0.05)]"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                <span className="material-symbols-outlined text-primary text-[24px]">lock</span>
              </div>
              <h1 className="text-[24px] font-bold text-on-surface tracking-tight">Admin Girişi</h1>
              <p className="text-[13px] text-on-surface-variant mt-1">CMS Paneline erişim sağlayın</p>
            </div>

            {error && (
              <div className="bg-error-container border border-error/20 text-on-error-container text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                Kullanıcı Adı
              </label>
              <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="admin" required autoComplete="username" disabled={loading} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                Şifre
              </label>
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password" disabled={loading} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-semibold text-[14px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Giriş yapılıyor...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">login</span>Giriş Yap</>
              )}
            </button>
          </form>
        )}

        {/* ── Adım 2: TOTP kodu ── */}
        {step === "totp" && (
          <form
            onSubmit={handleTotp}
            className="bg-surface border border-outline-variant rounded-2xl p-8 space-y-5 shadow-[0_0_40px_rgba(0,212,255,0.05)]"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                <span className="material-symbols-outlined text-primary text-[24px]">phonelink_lock</span>
              </div>
              <h1 className="text-[24px] font-bold text-on-surface tracking-tight">İki Faktörlü Doğrulama</h1>
              <p className="text-[13px] text-on-surface-variant mt-1">
                Google Authenticator'dan 6 haneli kodu girin
              </p>
            </div>

            {error && (
              <div className="bg-error-container border border-error/20 text-on-error-container text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                Doğrulama Kodu
              </label>
              <input
                ref={totpRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={`${inputCls} tracking-[0.4em] text-center text-[20px] font-mono`}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                autoComplete="one-time-code"
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading || totpCode.length !== 6}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-semibold text-[14px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
              {loading ? (
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Doğrulanıyor...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">verified</span>Doğrula</>
              )}
            </button>

            <button type="button" onClick={() => { setStep("credentials"); setError(null); setTotpCode(""); }}
              className="w-full text-[13px] text-on-surface-variant hover:text-primary transition-colors">
              ← Geri dön
            </button>
          </form>
        )}

        <p className="text-center text-[12px] text-on-surface-variant mt-4">
          <a href="/" className="hover:text-primary transition-colors">← Siteye dön</a>
        </p>
      </div>
    </div>
  );
}
