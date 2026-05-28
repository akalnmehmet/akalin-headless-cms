import { useEffect, useRef, useState } from "react";

interface Props {
  onFinish: () => void;
  name?: string;
}

export default function MatrixPreloader({ onFinish, name = "MEHMET AKALIN" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showName, setShowName] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize) + 1;
    const drops: number[] = Array(cols).fill(0).map(() => Math.random() * -50);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*_+-=[]{}|;:,.?ØÆŁÑ";

    let animId: number;

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const bright = Math.random() > 0.92;
        ctx.fillStyle = bright ? "#d4a017" : "#7a5c10";
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.97) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      }
      animId = requestAnimationFrame(draw);
    };

    draw();

    const t1 = setTimeout(() => setShowName(true), 1200);
    const t2 = setTimeout(() => {
      let start: number | null = null;
      const fade = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 900, 1);
        setOpacity(1 - p);
        if (p < 1) requestAnimationFrame(fade);
        else onFinish();
      };
      requestAnimationFrame(fade);
    }, 3600);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", resize);
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center pointer-events-none"
      style={{ opacity }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div
        className="relative z-10 text-center select-none"
        style={{
          opacity:    showName ? 1 : 0,
          transform:  showName ? "scale(1)" : "scale(0.92)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <h1
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontWeight:    900,
            letterSpacing: "0.22em",
            fontSize:      "clamp(1.6rem, 5.5vw, 4.5rem)",
            color:         "#ffffff",
            textShadow:    "0 0 40px rgba(255,255,255,0.2)",
            textTransform: "uppercase",
          }}
        >
          {name}
        </h1>
        <div
          style={{
            margin:     "12px auto 0",
            width:      "56px",
            height:     "2px",
            background: "#d4a017",
            boxShadow:  "0 0 10px #d4a017",
          }}
        />
      </div>
    </div>
  );
}
