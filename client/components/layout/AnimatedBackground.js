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

    // Technical particles: electric blue, cyan, and subtle rose
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.2 + 0.4,
        speedX: (Math.random() - 0.5) * 0.22,
        speedY: (Math.random() - 0.5) * 0.22,
        opacity: Math.random() * 0.22 + 0.04,
        color: Math.random() > 0.85 ? "244,63,94" : Math.random() > 0.45 ? "59,130,246" : "56,189,248",
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const time = performance.now() * 0.001;

      particles.forEach(p => {
        p.x += p.speedX + Math.sin(time * 0.25 + p.phase) * 0.06;
        p.y += p.speedY + Math.cos(time * 0.2 + p.phase) * 0.06;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const distToMouse = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        const mouseGlow = distToMouse < 220 ? (1 - distToMouse / 220) * 0.35 : 0;
        const finalOpacity = p.opacity + mouseGlow;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + mouseGlow * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${finalOpacity})`;
        ctx.fill();
      });

      // Draw fine technical node connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist < 150) {
            const opacity = 0.04 * (1 - dist / 150);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59,130,246,${opacity})`;
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070a13]">
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0" style={{ opacity: 0.75 }} />

      {/* Blueprint Grid — Ordivalabs 40px grid */}
      <div className="absolute inset-0 tech-grid-pattern opacity-60" />

      {/* Ambient Cobalt & Rose Glows */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(37,99,235,0.07), transparent 70%)",
        animation: "breathe 10s ease-in-out infinite",
      }} />

      {/* Corner telemetry glows */}
      <div className="absolute -top-40 -right-40 w-[650px] h-[650px]" style={{
        background: "radial-gradient(circle, rgba(37,99,235,0.1), transparent 60%)",
        animation: "glow-drift 28s infinite",
      }} />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px]" style={{
        background: "radial-gradient(circle, rgba(244,63,94,0.06), transparent 60%)",
        animation: "glow-drift 24s infinite reverse",
      }} />

      {/* Top Precision Beacon Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, transparent 5%, #2563eb 25%, #60a5fa 50%, #f43f5e 75%, transparent 95%)",
        opacity: 0.8,
        boxShadow: "0 0 20px rgba(37,99,235,0.5), 0 0 40px rgba(37,99,235,0.2)",
      }} />

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(7,10,19,0.85) 100%)",
      }} />
    </div>
  );
}
