"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TypingSubtitle from "./TypingSubtitle";
import ArchitectureDiagram from "./ArchitectureDiagram";
import MagneticButton from "@/components/gsap/MagneticButton";

export default function Hero() {
  const { status } = useSession();
  const isAuth = status === "authenticated";
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const diagramRef = useRef(null);
  const leftRef = useRef(null);
  const orbsRef = useRef([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ── Effect #1: Parallax on scroll ──
      // Architecture diagram moves slower (parallax depth)
      if (diagramRef.current) {
        gsap.to(diagramRef.current, {
          yPercent: -20,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

      // Left content parallax (slower)
      if (leftRef.current) {
        gsap.to(leftRef.current, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

      // Ambient orbs drift on scroll
      orbsRef.current.forEach((orb, i) => {
        if (!orb) return;
        gsap.to(orb, {
          yPercent: -30 - i * 15,
          xPercent: i % 2 === 0 ? 10 : -10,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      });

      // ── Effect #2: Text split animation ──
      if (headingRef.current) {
        const lines = headingRef.current.querySelectorAll(".split-line");
        lines.forEach((line, lineIdx) => {
          const text = line.textContent;
          line.innerHTML = "";
          line.style.display = "inline-block";

          // Wrap each character in a span
          [...text].forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.display = "inline-block";
            span.style.willChange = "transform, opacity";
            // Preserve gradient class on gradient spans
            if (line.dataset.gradient) {
              span.className = "gradient-text-animated";
            }
            line.appendChild(span);
          });

          // Stagger reveal each character
          gsap.from(line.children, {
            y: 60,
            opacity: 0,
            rotateX: -40,
            duration: 0.7,
            ease: "back.out(1.7)",
            stagger: 0.03,
            delay: 0.3 + lineIdx * 0.15,
          });
        });
      }

      // Fade in the rest of the hero content
      gsap.from(".hero-fade-in", {
        y: 30,
        opacity: 0,
        filter: "blur(6px)",
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.9,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[calc(100vh-64px)] flex items-center pt-20 pb-10 overflow-hidden">
      {/* Ambient orbs — with GSAP parallax */}
      <div ref={(el) => (orbsRef.current[0] = el)} className="absolute top-10 right-5 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)", filter: "blur(120px)" }} />
      <div ref={(el) => (orbsRef.current[1] = el)} className="absolute bottom-10 left-5 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)", filter: "blur(140px)" }} />
      <div ref={(el) => (orbsRef.current[2] = el)} className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.1), transparent 70%)", filter: "blur(100px)" }} />
      <div ref={(el) => (orbsRef.current[3] = el)} className="absolute top-1/4 right-1/3 w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)", filter: "blur(80px)" }} />

      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left */}
        <div ref={leftRef}>
          <div className="hero-fade-in">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-6" style={{ background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(8px)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.8)", animation: "soft-pulse 2s ease-in-out infinite" }} />
              AI-Powered Underwriting
            </span>
          </div>

          {/* Text split heading */}
          <h1 ref={headingRef} className="text-4xl sm:text-5xl lg:text-[4.25rem] font-extrabold leading-[1.05] mb-6" style={{ perspective: "600px" }}>
            <span className="split-line" style={{ color: "#fafafa" }}>Smarter Risk</span>
            <br />
            <span className="split-line" data-gradient="true" style={{ display: "inline-block" }}>Assessment</span>
            <span className="split-line" style={{ color: "#fafafa" }}> in</span>
            <br />
            <span className="split-line" style={{ color: "#fafafa" }}>Seconds</span>
          </h1>

          <div className="hero-fade-in mb-5">
            <TypingSubtitle />
          </div>

          <p className="hero-fade-in text-base sm:text-lg leading-relaxed mb-10 max-w-xl" style={{ color: "#71717a" }}>
            Harness the power of AI to transform weeks of manual underwriting into instant, data-driven risk decisions with unmatched precision and consistency.
          </p>

          {/* CTAs with magnetic effect */}
          <div className="hero-fade-in flex flex-wrap gap-4">
            {isAuth ? (
              <MagneticButton strength={0.3}>
                <Link href="/dashboard" className="btn-primary no-underline inline-flex items-center gap-2 px-10 py-4 text-base">
                  Go to Dashboard
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </MagneticButton>
            ) : (
              <>
                <MagneticButton strength={0.3}>
                  <Link href="/assess" className="btn-primary no-underline inline-flex items-center gap-2 px-10 py-4 text-base relative overflow-hidden group">
                    <span className="relative z-10 flex items-center gap-2">
                      Start Free Assessment
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                  </Link>
                </MagneticButton>
                <MagneticButton strength={0.25}>
                  <a href="#how-it-works" className="btn-secondary no-underline inline-flex items-center gap-2 px-8 py-4 text-base group">
                    See How It Works
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-y-0.5"><path d="M6 9l6 6 6-6"/></svg>
                  </a>
                </MagneticButton>
              </>
            )}
          </div>
        </div>

        {/* Right — Architecture Diagram with parallax */}
        <div ref={diagramRef} className="hidden lg:block">
          <ArchitectureDiagram />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ animation: "bounce-down 2s ease-in-out infinite" }}>
        <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "#52525b" }}>Scroll</span>
        <div className="w-5 h-8 rounded-full flex justify-center pt-1.5" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="w-1 h-2 rounded-full" style={{ background: "rgba(16,185,129,0.5)", animation: "float 2s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}
