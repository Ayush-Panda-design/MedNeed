'use client';

import React, { useRef, useState, useCallback } from 'react';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt degrees (default 12)
  glare?: boolean;
  scale?: number; // scale on hover (default 1.02)
  perspective?: number; // perspective px (default 1000)
  onClick?: () => void;
  title?: string;
}

export default function TiltCard3D({
  children,
  className = '',
  maxTilt = 10,
  glare = true,
  scale = 1.02,
  perspective = 1000,
  onClick,
  title,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
  });
  const [glareStyle, setGlareStyle] = useState({
    opacity: 0,
    transform: 'translate(-50%, -50%)',
    left: '50%',
    top: '50%',
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (-maxTilt to +maxTilt)
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      setTiltStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
        transition: 'transform 80ms ease-out',
      });

      if (glare) {
        setGlareStyle({
          opacity: 0.45,
          transform: 'translate(-50%, -50%)',
          left: `${x}px`,
          top: `${y}px`,
        });
      }
    },
    [maxTilt, glare, scale, perspective]
  );

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
    });
    if (glare) {
      setGlareStyle((prev) => ({
        ...prev,
        opacity: 0,
      }));
    }
  }, [perspective, glare]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title={title}
      style={{
        transformStyle: 'preserve-3d',
        ...tiltStyle,
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* Dynamic Specular Glare Overlay */}
      {glare && (
        <div
          className="pointer-events-none absolute w-64 h-64 rounded-full blur-xl z-30 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(59, 130, 246, 0.25) 45%, transparent 70%)',
            left: glareStyle.left,
            top: glareStyle.top,
            transform: glareStyle.transform,
            opacity: glareStyle.opacity,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
