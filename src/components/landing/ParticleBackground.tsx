import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      speed: number;
      opacity: number;
      char: string;
    }> = [];

    const chars = '01$€£¥%+-.';
    const columnWidth = 20;
    const columns = Math.floor(canvas.width / columnWidth);

    // Initialize particles
    for (let i = 0; i < columns * 2; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 1.5,
        opacity: Math.random() * 0.3,
        char: chars[Math.floor(Math.random() * chars.length)],
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(11, 15, 21, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.font = '14px JetBrains Mono';
        ctx.fillStyle = `rgba(0, 229, 255, ${particle.opacity})`;
        ctx.fillText(particle.char, particle.x, particle.y);

        particle.y += particle.speed;
        
        if (particle.y > canvas.height) {
          particle.y = -20;
          particle.x = Math.random() * canvas.width;
          particle.char = chars[Math.floor(Math.random() * chars.length)];
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default ParticleBackground;
