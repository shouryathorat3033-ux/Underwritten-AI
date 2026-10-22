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
      if (diagramRef.current) {
        gsap.to(diagramRef.current, {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

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

      orbsRef.current.forEach((orb, i) => {
        if (!orb) return;
        gsap.to(orb, {
          yPercent: -25 - i * 15,
          xPercent: i % 2 === 0 ? 8 : -8,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      });

      // Split text reveal
      if (headingRef.current) {
        const lines = headingRef.current.querySelectorAll(".split-line");
        lines.forEach((line, lineIdx) => {
          const text = line.textContent;
          line.innerHTML = "";
          line.style.display = "inline-block";

          [...text].forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.display = "inline-block";
            span.style.willChange = "transform, opacity";
            if (line.dataset.gradient) {
              span.className = "gradient-text-animated";
            }
            line.appendChild(span);
          });

          gsap.from(line.children, {
            y: 50,
            opacity: 0,
            rotateX: -30,
            duration: 0.65,
            ease: "back.out(1.6)",
            stagger: 0.025,
            delay: 0.2 + lineIdx * 0.12,
          });
        });
      }

      gsap.from(".hero-fade-in", {
        y: 25,
        opacity: 0,
        filter: "blur(6px)",
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.8,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[calc(100vh-66px)] flex items-center pt-24 pb-14 overflow-hidden">
      {/* Ordivalabs Ambient Cobalt & Rose Glow Orbs */}
      <div ref={(el) => (orbsRef.current[0] = el)} className="absolute top-10 right-10 w-[550px] h-[550px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)", filter: "blur(110px)" }} />
      <div ref={(el) => (orbsRef.current[1] = el)} className="absolute bottom-10 left-5 w-[450px] h-[450px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(244,63,94,0.1), transparent 70%)", filter: "blur(130px)" }} />
      <div ref={(el) => (orbsRef.current[2] = el)} className="absolute top-1/2 left-1/3 w-[320px] h-[320px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)", filter: "blur(90px)" }} />

      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: Scientific Typography & CTAs */}
        <div ref={leftRef}>
          <div className="hero-fade-in flex items-center gap-2 mb-6">
            <span className="tech-badge-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ACTUARIAL INTELLIGENCE · GEMMA 4 E4B
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline">
              [LATENCY: &lt;50ms]
            </span>
          </div>

          {/* Heading */}
          <h1 ref={headingRef} className="text-4xl sm:text-5xl lg:text-[4.25rem] font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="split-line text-white">Precision Risk</span>
            <br />
            <span className="split-line" data-gradient="true">Intelligence</span>
            <span className="split-line text-white"> in</span>
            <br />
            <span className="split-line text-white">Milliseconds</span>
          </h1>

          <div className="hero-fade-in mb-5">
            <TypingSubtitle />
          </div>

          <p className="hero-fade-in text-base sm:text-lg leading-relaxed mb-8 max-w-xl text-slate-400 font-normal">
            Automate high-stakes insurance underwriting with mathematical precision. Fusing traditional clinical metrics, live telematics, and local Gemma 4 E4B evidence reasoning into auditable, instant risk decisions.
          </p>

          {/* CTAs */}
          <div className="hero-fade-in flex flex-wrap gap-4 items-center">
            {isAuth ? (
              <MagneticButton strength={0.3}>
                <Link href="/dashboard" className="btn-primary no-underline px-8 py-3.5 text-sm">
                  Access Underwriting Workbench
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </MagneticButton>
            ) : (
              <>
                <MagneticButton strength={0.3}>
                  <Link href="/assess" className="btn-primary no-underline px-8 py-3.5 text-sm group">
                    <span className="flex items-center gap-2">
                      Start Risk Assessment
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </span>
                  </Link>
                </MagneticButton>
                <MagneticButton strength={0.25}>
                  <a href="#how-it-works" className="btn-secondary no-underline px-6 py-3.5 text-sm group">
                    Explore Architecture
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-y-0.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </a>
                </MagneticButton>
              </>
            )}
          </div>

          {/* Micro Telemetry Metrics */}
          <div className="hero-fade-in grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-blue-500/15 max-w-lg">
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">99.4%</p>
              <p className="font-mono text-[10px] text-blue-400 uppercase tracking-wider">Actuarial Precision</p>
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">&lt; 3.0s</p>
              <p className="font-mono text-[10px] text-blue-400 uppercase tracking-wider">Gemma 4 Reasoning</p>
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">100%</p>
              <p className="font-mono text-[10px] text-blue-400 uppercase tracking-wider">IRDAI Audit Compliant</p>
            </div>
          </div>
        </div>

        {/* Right: Architecture Blueprint Diagram */}
        <div ref={diagramRef} className="hidden lg:block relative">
          <ArchitectureDiagram />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">[EXPLORE SYSTEM]</span>
        <div className="w-5 h-8 rounded-full flex justify-center pt-1.5 border border-blue-500/20 bg-blue-950/20">
          <div className="w-1 h-2 rounded-full bg-blue-400 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
