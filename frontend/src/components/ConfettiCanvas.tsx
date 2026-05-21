'use client';

import { useEffect, useRef } from 'react';

export default function ConfettiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        interface ConfettiParticle {
            x: number;
            y: number;
            size: number;
            color: string;
            vx: number;
            vy: number;
            rotation: number;
            rotationSpeed: number;
            opacity: number;
        }

        const colors = ['#FF4A4A', '#FFD124', '#3E7BFA', '#2EC4B6', '#FF9F1C', '#E0AAFF'];
        const particles: ConfettiParticle[] = [];

        // Launch burst from bottom-center of the screen
        const particleCount = 100;
        const startX = canvas.width / 2;
        const startY = canvas.height - 20;

        for (let i = 0; i < particleCount; i++) {
            // Upwards burst: angle between -45 and -135 degrees
            const angle = (Math.random() * 90 - 135) * (Math.PI / 180);
            const speed = Math.random() * 12 + 8;
            particles.push({
                x: startX,
                y: startY,
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5,
                opacity: 1
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let active = false;
            particles.forEach((p) => {
                if (p.opacity <= 0) return;
                active = true;

                p.x += p.vx;
                p.y += p.vy;

                // Physics
                p.vy += 0.22; // gravity
                p.vx *= 0.97; // air resistance
                p.vy *= 0.97; // air resistance

                p.rotation += p.rotationSpeed;

                if (p.vy > 1) {
                    p.opacity -= 0.015;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            if (active) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-[100]"
        />
    );
}
