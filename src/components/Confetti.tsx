'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
}

const COLORS = [
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#eab308', // yellow
  '#10b981', // green
  '#f97316', // orange
  '#3b82f6', // blue
];

export default function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Particle[] = [];

    // Resize canvas to cover window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    // Spawn from bottom corners and bottom center, shooting upwards
    const spawnCount = 150;
    for (let i = 0; i < spawnCount; i++) {
      // Choose spawn side: Left, Right, or Center
      const spawnGroup = Math.random();
      let startX = canvas.width / 2;
      let startY = canvas.height + 20;
      let vx = (Math.random() - 0.5) * 8;
      let vy = -Math.random() * 15 - 10;

      if (spawnGroup < 0.35) {
        // Spawn from left corner shooting diagonally right
        startX = 0;
        vx = Math.random() * 12 + 4;
        vy = -Math.random() * 16 - 12;
      } else if (spawnGroup < 0.7) {
        // Spawn from right corner shooting diagonally left
        startX = canvas.width;
        vx = -Math.random() * 12 - 4;
        vy = -Math.random() * 16 - 12;
      }

      particles.push({
        x: startX,
        y: startY,
        vx,
        vy,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        radius: Math.random() * 5 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        decay: Math.random() * 0.008 + 0.004,
      });
    }

    const gravity = 0.4;
    const friction = 0.98;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        activeParticles++;

        // Update physics
        p.vx *= friction;
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        // Draw rectangle
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 1.5);
        ctx.restore();
      });

      if (activeParticles > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
