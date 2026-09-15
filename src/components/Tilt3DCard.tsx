import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  intensity = 10,
  glowColor = 'rgba(59, 130, 246, 0.18)',
  onClick,
  style = {},
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [transformStyle, setTransformStyle] = useState<string>('rotateX(0deg) rotateY(0deg)');
  const [glowPos, setGlowPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
    setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rectRef.current) {
      if (cardRef.current) {
        rectRef.current = cardRef.current.getBoundingClientRect();
      } else {
        return;
      }
    }
    const { left, top, width, height } = rectRef.current;
    if (width === 0 || height === 0) return;

    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;

    const rotateX = (0.5 - y) * intensity;
    const rotateY = (x - 0.5) * intensity;

    setTransformStyle(`rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlowPos({ x: Math.round(x * 100), y: Math.round(y * 100) });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rectRef.current = null;
    setTransformStyle('rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.98 }}
      style={{
        perspective: 800,
        ...style,
      }}
      className={`relative group ${className}`}
    >
      <div
        style={{
          transform: isHovered ? transformStyle : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.25s ease-out',
          willChange: 'transform',
          transformStyle: 'preserve-3d',
        }}
        className="w-full h-full relative transform-gpu"
      >
        {/* Specular 3D Light Sheen Overlay */}
        {isHovered && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-10 transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 70%)`,
              opacity: 0.75,
            }}
          />
        )}

        {/* Card Content */}
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

