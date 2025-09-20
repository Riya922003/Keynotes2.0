'use client'

import { useEffect, useRef } from 'react';

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface LocalSplashCursorProps {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  BACK_COLOR?: ColorRGB;
  TRANSPARENT?: boolean;
}

export default function LocalSplashCursor({
  SIM_RESOLUTION = 64,
  DYE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 1.5,
  VELOCITY_DISSIPATION = 0.8,
  PRESSURE = 0.05,
  PRESSURE_ITERATIONS = 20,
  CURL = 20,
  SPLAT_RADIUS = 0.15,
  SPLAT_FORCE = 3000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0, g: 0, b: 0 },
  TRANSPARENT = true
}: LocalSplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simplified fluid animation using canvas 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
    }> = [];

    const colors = [
      'rgba(255, 100, 150, 0.8)',
      'rgba(100, 150, 255, 0.8)',
      'rgba(150, 255, 100, 0.8)',
      'rgba(255, 200, 100, 0.8)',
      'rgba(200, 100, 255, 0.8)',
      'rgba(255, 50, 200, 0.8)',
    ];

    const addParticles = (x: number, y: number, count = 6) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 25,
          y: y + (Math.random() - 0.5) * 25,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          life: 1,
          maxLife: 2 + Math.random() * 2.5,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Clear canvas completely to maintain perfect transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles (only user-generated particles)
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.life -= deltaTime;
        
        particle.vx *= 0.92;
        particle.vy *= 0.92;

        if (particle.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = particle.life / particle.maxLife;
        const size = alpha * 12 + 3; // Much larger particles
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.95; // Maximum visibility without being too intrusive
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Prominent glow effect
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Additional outer glow
        ctx.globalAlpha = alpha * 0.25;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (Math.random() > 0.4) { // More frequent particle generation
        addParticles(x, y, 4);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Create bigger burst of particles on click
      addParticles(x, y, 12);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    
    // Start animation
    animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [
    SIM_RESOLUTION,
    DYE_RESOLUTION,
    DENSITY_DISSIPATION,
    VELOCITY_DISSIPATION,
    PRESSURE,
    PRESSURE_ITERATIONS,
    CURL,
    SPLAT_RADIUS,
    SPLAT_FORCE,
    SHADING,
    COLOR_UPDATE_SPEED,
    BACK_COLOR,
    TRANSPARENT
  ]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ 
        pointerEvents: 'none',
        zIndex: 1 
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          display: 'block',
          background: 'transparent', // Always transparent
          pointerEvents: 'auto'
        }}
      />
    </div>
  );
}