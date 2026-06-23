import React, { useEffect, useRef } from 'react';

interface ParticlesProps {
    density?: number;
}

export default function Particles({ density = 50 }: ParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
        }> = [];

        // Initialize particles
        const particleCount = Math.min(density, Math.floor((width * height) / 15000));
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
            });
        }

        let mouseX = 0;
        let mouseY = 0;
        let isMouseActive = false;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            isMouseActive = true;
        };

        const handleMouseLeave = () => {
            isMouseActive = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // LandingPage has a dark tech aesthetic with gold (#f59e0b) and violet/indigo.
            // We use semi-transparent purple/indigo for main particles/lines, and highlight with gold near mouse.
            const particleColor = 'rgba(124, 58, 237, 0.45)';

            particles.forEach((p) => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Bounce/Wrap boundaries
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        const alpha = (1 - dist / 120) * 0.15;
                        ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }

                // Draw lines connecting to mouse
                if (isMouseActive) {
                    const p = particles[i];
                    const distToMouse = Math.hypot(p.x - mouseX, p.y - mouseY);
                    if (distToMouse < 180) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouseX, mouseY);
                        const alpha = (1 - distToMouse / 180) * 0.2;
                        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`; // Subtle gold glow connection
                        ctx.lineWidth = 0.9;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);
        };
    }, [density]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}
