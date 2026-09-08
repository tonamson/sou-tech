"use client";

import { useEffect, useRef } from "react";


export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Exactly 2 primary ocean wave ribbons: 1 Electric Blue & 1 Golden Amber
    // Gerstner/Trochoidal oceanic curvature: steep peaks, gentle broad troughs like real ocean swells
    const waves = [
      {
        id: "blue",
        colorStops: [
          { stop: 0, color: "#1D4ED8" },
          { stop: 0.35, color: "#2563EB" },
          { stop: 0.75, color: "#38BDF8" },
          { stop: 1, color: "#BAE6FD" },
        ],
        glowColor: "#38BDF8",
        amplitude: 110,      // Biên độ uốn lượn sâu, dập dềnh rõ nét
        frequency: 0.0014,   // Bước sóng cân đối tạo 2-3 nhịp uốn lượn ngoạn mục qua màn hình
        speed: 0.008,        // Tốc độ trôi tự nhiên
        phase: 0.8,
        yOffsetRatio: 0.53,
        glowBlur: 24,
      },
      {
        id: "amber",
        colorStops: [
          { stop: 0, color: "#92400E" },
          { stop: 0.35, color: "#D97706" },
          { stop: 0.75, color: "#DAAF37" },
          { stop: 1, color: "#FEF08A" },
        ],
        glowColor: "#DAAF37",
        amplitude: 115,      // Biên độ sâu, đan xen nhịp nhàng
        frequency: 0.0013,
        speed: -0.007,       // Chảy ngược chiều uyển chuyển
        phase: 3.6,
        yOffsetRatio: 0.47,
        glowBlur: 24,
      },
    ];

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      waves.forEach((wave) => {
        const baseOffsetY = height * wave.yOffsetRatio;

        // Gerstner Trochoidal ocean wave simulation:
        // Đỉnh sóng cong vút mềm mại, đáy sóng võng tròn rộng đặc trưng của sóng biển
        const points: { x: number; y: number }[] = [];
        for (let x = -40; x <= width + 60; x += 4) {
          const t = time * wave.speed;
          
          // Primary oceanic swell (sóng chính)
          const angle1 = x * wave.frequency + t + wave.phase;
          // Trochoidal sharpening factor (đỉnh uốn cong mềm mại, bụng sóng tròn rộng)
          const yTrochoid = Math.pow((Math.sin(angle1) + 1) / 2, 1.6) * 2 - 1;
          
          // Harmonic secondary swell (sóng con trợ lực tạo nhịp nhấp nhô sống động)
          const angle2 = x * (wave.frequency * 0.58) - t * 0.75 + wave.phase * 0.5;
          const y2 = Math.sin(angle2) * (wave.amplitude * 0.4);
          
          // Modulation wave (biên độ dao động theo vị trí màn hình)
          const mod = 0.75 + 0.35 * Math.sin(x * 0.0007 + t * 0.3);

          const y = baseOffsetY + (yTrochoid * wave.amplitude * 0.75 + y2) * mod;
          points.push({ x, y });
        }

        const drawPath = () => {
          ctx.beginPath();
          if (points.length === 0) return;
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        };

        const createGradient = () => {
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          wave.colorStops.forEach((cs) => grad.addColorStop(cs.stop, cs.color));
          return grad;
        };

        // Layer 1: Soft Ambient Glow (Hào quang tản sắc thanh mảnh 18px, tạo độ mềm không bị thô)
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.shadowColor = wave.glowColor;
        ctx.shadowBlur = 30;
        ctx.strokeStyle = createGradient();
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawPath();
        ctx.stroke();
        ctx.restore();

        // Layer 2: Sleek Elegant Silk Line (Đường nét thanh thoát 3.5px, mềm mại tinh tế)
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = wave.glowColor;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = createGradient();
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawPath();
        ctx.stroke();
        ctx.restore();

        // Layer 3: Fine Light Filament (Sợi tơ ánh sáng thanh mảnh 1.2px ở tâm)
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = wave.id === "blue" ? "#F0F9FF" : "#FFFBEB";
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawPath();
        ctx.stroke();
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const services = [
    { title: "SOFTWARE" },
    { title: "AI" },
    { title: "CLOUD" },
    { title: "SYSTEMS" },
    { title: "INTEGRATION" },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070D14] text-[#E5E7EB] flex flex-col justify-between p-8 sm:p-12 md:p-16 lg:p-20 select-none">
      {/* 1. Deep Atmospheric Gradient Canvas */}
      <div 
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle 1600px at 70% 50%, #101B2E 0%, #0B1220 55%, #070D14 100%)",
        }}
      />

      {/* 2. Soft Ambient Atmospheric Light Glows */}
      <div className="pointer-events-none absolute top-[45%] right-[25%] h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[#1E3A8A]/20 blur-[160px] css-ambient-pulse" />
      <div className="pointer-events-none absolute top-[55%] right-[15%] h-[450px] w-[450px] -translate-y-1/2 rounded-full bg-[#DAAF37]/12 blur-[150px] css-ambient-pulse" />

      {/* 3. Real-Time Multi-Layer Oceanic Wave Ribbons (Fluid Hydrodynamic Motion) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />


      {/* 4. Soft Left Text Shield (Semi-transparent so wave passes smoothly underneath without obstructing text) */}
      <div 
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to right, #070D14 15%, rgba(7, 13, 20, 0.65) 45%, transparent 75%)",
        }}
      />

      {/* Top Section: Brand Identity & Services Column */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Brand Logo & Subtitle */}
        <div className="md:col-span-8 flex flex-col items-start">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-dark-transparent.png"
              alt="SoU Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="flex flex-col">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-baseline gap-2">
                <div className="flex items-baseline">
                  <span className="text-[#F8FAFC]">S</span>
                  <span className="text-[#DAAF37] lowercase">o</span>
                  <span className="text-[#F8FAFC]">U</span>
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-normal text-[#F8FAFC]">
                  Technology Solution
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Services Navigation / List */}
        <div className="md:col-span-4 flex flex-col items-start md:items-end justify-start pt-1 md:pt-2">
          <div className="flex flex-col items-start md:items-end gap-1.5 sm:gap-2 text-[#94A3B8] font-bold text-sm sm:text-base md:text-lg tracking-wider">
            {services.map((item) => (
              <span
                key={item.title}
                className="transition-colors duration-200 hover:text-[#DAAF37] cursor-pointer"
              >
                {item.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Center Hero: Typographic Core Message */}
      <div className="relative z-10 my-auto py-10 sm:py-16">
        <div className="flex flex-col space-y-0.5 sm:space-y-1 text-left font-black tracking-tight leading-[0.95]">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F8FAFC]">
            PEOPLE
          </h1>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F8FAFC]">
            TECHNOLOGY
          </h1>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F8FAFC]">
            SOLUTIONS
          </h1>
          <div className="pt-2 sm:pt-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F8FAFC]">
              A BRIGHTER
            </h1>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F8FAFC]">
              TOMORROW
            </h1>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Clean Domain Link */}
      <footer className="relative z-10 flex items-center justify-between pt-6">
        <a
          href="https://soutechnology.vn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm font-medium tracking-wide text-[#94A3B8] hover:text-[#DAAF37] transition-colors"
        >
          soutechnology.vn
        </a>

        <div className="text-[11px] sm:text-xs font-mono text-[#64748B]">
          SoU Technology Solution
        </div>
      </footer>
    </main>
  );
}
