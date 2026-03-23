import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  active: boolean;
  angle: number;
  trail: number;
}

const STAR_COLORS = [
  'hsla(210, 60%, 95%, ',   // cool white
  'hsla(43, 80%, 85%, ',    // warm gold
  'hsla(200, 70%, 90%, ',   // icy blue
  'hsla(290, 60%, 90%, ',   // pale violet
  'hsla(170, 70%, 88%, ',   // mint teal
];

export const CosmicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animationRef = useRef<number>();
  const lastShootRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      const starCount = Math.floor((canvas.width * canvas.height) / 2200);
      starsRef.current = [];
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 0.3,
          opacity: Math.random() * 0.75 + 0.25,
          twinkleSpeed: Math.random() * 0.025 + 0.008,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }
      // Init shooting stars (lazy)
      shootingStarsRef.current = Array.from({ length: 4 }, () => ({
        x: 0, y: 0, length: 0, speed: 0, opacity: 0, active: false, angle: 0, trail: 0
      }));
    };

    const spawnShootingStar = (ss: ShootingStar) => {
      ss.x = Math.random() * canvas.width * 0.8;
      ss.y = Math.random() * canvas.height * 0.4;
      ss.length = Math.random() * 120 + 80;
      ss.speed = Math.random() * 8 + 6;
      ss.opacity = 1;
      ss.active = true;
      ss.angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.15;
      ss.trail = 0;
    };

    const drawStar = (star: Star, time: number) => {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.35 + 0.65;
      const opacity = star.opacity * twinkle;

      // Soft outer glow
      const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2.5);
      grad.addColorStop(0, star.color + `${opacity * 0.5})`);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(0, 0%, 100%, ${opacity})`;
      ctx.fill();
    };

    const drawShootingStar = (ss: ShootingStar) => {
      if (!ss.active) return;
      const dx = Math.cos(ss.angle) * ss.length;
      const dy = Math.sin(ss.angle) * ss.length;

      const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - dx, ss.y - dy);
      grad.addColorStop(0, `hsla(43, 90%, 85%, ${ss.opacity})`);
      grad.addColorStop(0.3, `hsla(200, 80%, 90%, ${ss.opacity * 0.5})`);
      grad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - dx, ss.y - dy);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // tiny bright head
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(43, 90%, 95%, ${ss.opacity})`;
      ctx.fill();
    };

    const drawNebulaLayer = (time: number) => {
      // Drifting nebula clouds — very subtle
      const t = time * 0.00008;

      // Violet nebula — top right
      const g1 = ctx.createRadialGradient(
        canvas.width * (0.7 + Math.sin(t) * 0.04),
        canvas.height * (0.2 + Math.cos(t * 0.7) * 0.04),
        0,
        canvas.width * 0.7,
        canvas.height * 0.2,
        canvas.width * 0.42
      );
      g1.addColorStop(0, 'hsla(262, 65%, 35%, 0.18)');
      g1.addColorStop(0.5, 'hsla(262, 55%, 25%, 0.1)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Teal nebula — bottom left
      const g2 = ctx.createRadialGradient(
        canvas.width * (0.15 + Math.cos(t * 0.9) * 0.04),
        canvas.height * (0.7 + Math.sin(t * 0.6) * 0.04),
        0,
        canvas.width * 0.15,
        canvas.height * 0.7,
        canvas.width * 0.38
      );
      g2.addColorStop(0, 'hsla(180, 75%, 30%, 0.14)');
      g2.addColorStop(0.5, 'hsla(200, 60%, 25%, 0.07)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold nebula — center subtle
      const g3 = ctx.createRadialGradient(
        canvas.width * 0.5,
        canvas.height * 0.5,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.55
      );
      g3.addColorStop(0, 'hsla(43, 70%, 30%, 0.06)');
      g3.addColorStop(1, 'transparent');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Nebula base layers
      drawNebulaLayer(time);

      // Stars
      starsRef.current.forEach(star => drawStar(star, time * 0.001));

      // Shooting stars — spawn randomly every ~6–12s
      if (time - lastShootRef.current > (6000 + Math.random() * 6000)) {
        const inactive = shootingStarsRef.current.find(s => !s.active);
        if (inactive) {
          spawnShootingStar(inactive);
          lastShootRef.current = time;
        }
      }
      shootingStarsRef.current.forEach(ss => {
        if (!ss.active) return;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity -= 0.012;
        if (ss.opacity <= 0) ss.active = false;
        drawShootingStar(ss);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, hsl(262 45% 9%) 0%, hsl(228 35% 4%) 55%, hsl(228 40% 3%) 100%)'
      }}
    />
  );
};
