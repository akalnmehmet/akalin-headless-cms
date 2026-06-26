import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Smartphone, LogIn, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";

import { adminLogin, totpVerify } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
          <Card className="border-outline-variant shadow-[0_0_40px_rgba(0,212,255,0.05)]">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-3 mx-auto">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl tracking-tight text-on-surface">Admin Girişi</CardTitle>
              <CardDescription>CMS Paneline erişim sağlayın</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCredentials} className="space-y-4">
                {error && (
                  <div className="bg-error-container border border-error/20 text-on-error-container text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase font-mono">
                    Kullanıcı Adı
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    autoComplete="username"
                    disabled={loading}
                    className="border-outline-variant bg-surface-container-low focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase font-mono">
                    Şifre
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="border-outline-variant bg-surface-container-low focus-visible:ring-primary"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Giriş yapılıyor...</>
                  ) : (
                    <><LogIn className="h-4 w-4" />Giriş Yap</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Adım 2: TOTP kodu ── */}
        {step === "totp" && (
          <Card className="border-outline-variant shadow-[0_0_40px_rgba(0,212,255,0.05)]">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-3 mx-auto">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl tracking-tight text-on-surface">İki Faktörlü Doğrulama</CardTitle>
              <CardDescription>Google Authenticator'dan 6 haneli kodu girin</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTotp} className="space-y-4">
                {error && (
                  <div className="bg-error-container border border-error/20 text-on-error-container text-[13px] rounded-lg px-4 py-2.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="totp" className="text-[11px] font-semibold tracking-[0.05em] text-on-surface-variant uppercase font-mono">
                    Doğrulama Kodu
                  </Label>
                  <Input
                    id="totp"
                    ref={totpRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    required
                    autoComplete="one-time-code"
                    disabled={loading}
                    className="tracking-[0.4em] text-center text-xl font-mono border-outline-variant bg-surface-container-low focus-visible:ring-primary"
                  />
                </div>

                <Button type="submit" disabled={loading || totpCode.length !== 6} className="w-full" size="lg">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Doğrulanıyor...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" />Doğrula</>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-on-surface-variant"
                  onClick={() => { setStep("credentials"); setError(null); setTotpCode(""); }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Geri dön
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-[12px] text-on-surface-variant mt-4">
          <a href="/" className="hover:text-primary transition-colors">← Siteye dön</a>
        </p>
      </div>
    </div>
  );
}
