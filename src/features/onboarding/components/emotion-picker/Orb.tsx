import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { orbMotionVariants, orbInteractionVariants } from './animationVariants';

interface OrbProps {
  id: string;
  label: string;
  color: string;
  motionPattern: 'wave' | 'pulse' | 'drift' | 'spiral';
  description?: string;
  isSelected?: boolean;
  isFading?: boolean;
  onSelect: (id: string) => void;
  size?: 'large' | 'medium' | 'small';
}

export const Orb: React.FC<OrbProps> = ({
  id,
  label,
  color,
  motionPattern,
  description,
  isSelected = false,
  isFading = false,
  onSelect,
  size = 'large'
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const sizeMap = {
    large: { width: 140, height: 140 },
    medium: { width: 100, height: 100 },
    small: { width: 80, height: 80 }
  };

  const dimensions = sizeMap[size];
  const glowSize = size === 'large' ? 80 : size === 'medium' ? 60 : 40;

  const handleClick = () => {
    onSelect(id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  let variant = 'default';
  if (isFading) variant = 'fading';
  else if (isSelected) variant = 'selected';
  else if (isHovering) variant = 'hover';

  return (
    <motion.div
      className="relative flex items-center justify-center cursor-pointer"
      animate={orbMotionVariants[motionPattern].animate}
      variants={orbInteractionVariants as any}
      initial="default"
      animate={variant}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      tabIndex={0}
      role="button"
      aria-label={`Select ${label}. ${description || ''}`}
      {...dimensions}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}40 0%, ${color}20 70%, transparent 100%)`,
          width: glowSize * 2,
          height: glowSize * 2,
          filter: `blur(20px)`
        }}
      />

      {/* Inner solid orb */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
          boxShadow: `0 0 30px ${color}80, inset -2px -2px 10px rgba(0,0,0,0.3), inset 2px 2px 10px rgba(255,255,255,0.1)`
        }}
      >
        {/* Shine effect */}
        <div
          className="absolute top-2 left-2 rounded-full opacity-40"
          style={{
            width: '40%',
            height: '40%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)',
            filter: 'blur(8px)'
          }}
        />
      </motion.div>

      {/* Label below orb (shown on hover) */}
      {isHovering && (
        <motion.div
          className="absolute -bottom-16 text-center text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="font-semibold text-sm">{label}</p>
          {description && <p className="text-xs text-gray-300 mt-1">{description}</p>}
        </motion.div>
      )}
    </motion.div>
  );
};
