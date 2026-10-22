"use client";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointermove", onMove, { passive: true });

    // More particles, wider size range
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.3,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.2 + 0.03,
        color: Math.random() > 0.75 ? "245,158,11" : Math.random() > 0.5 ? "52,211,153" : "16,185,129",
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const time = performance.now() * 0.001;

      particles.forEach(p => {
        // Gentle sinusoidal drift for organic movement
        p.x += p.speedX + Math.sin(time * 0.3 + p.phase) * 0.08;
        p.y += p.speedY + Math.cos(time * 0.25 + p.phase) * 0.08;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Mouse proximity brightens particles
        const distToMouse = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        const mouseGlow = distToMouse < 200 ? (1 - distToMouse / 200) * 0.3 : 0;
        const finalOpacity = p.opacity + mouseGlow;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + mouseGlow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${finalOpacity})`;
        ctx.fill();
      });

      // Draw connections between close particles
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist < 160) {
            const opacity = 0.035 * (1 - dist / 160);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(16,185,129,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0" style={{ opacity: 0.7 }} />

      {/* Grid — finer, subtler */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(16,185,129,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.012) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      {/* Aurora gradient center */}
      <div className="absolute inset-0 aurora-bg" style={{ opacity: 0.5 }} />

      {/* Radial gradient center glow */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16,185,129,0.05), transparent 70%)",
        animation: "breathe 8s ease-in-out infinite",
      }} />

      {/* Corner glows — richer */}
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px]" style={{
        background: "radial-gradient(circle, rgba(16,185,129,0.07), transparent 55%)",
        animation: "glow-drift 30s infinite",
      }} />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px]" style={{
        background: "radial-gradient(circle, rgba(245,158,11,0.05), transparent 55%)",
        animation: "glow-drift 25s infinite reverse",
      }} />
      {/* Extra mid-right glow */}
      <div className="absolute top-1/3 -right-20 w-[400px] h-[400px]" style={{
        background: "radial-gradient(circle, rgba(52,211,153,0.04), transparent 60%)",
        animation: "glow-drift 22s infinite 5s",
      }} />

      {/* Top accent bar — gradient with glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, transparent 5%, #10b981 30%, #34d399 50%, #f59e0b 70%, transparent 95%)",
        opacity: 0.7,
        boxShadow: "0 0 20px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.1)",
      }} />

      {/* Noise — slightly stronger for film grain */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.03 }}>
        <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Vignette — deeper */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 35%, rgba(9,9,11,0.9) 100%)",
      }} />
    </div>
  );
}
