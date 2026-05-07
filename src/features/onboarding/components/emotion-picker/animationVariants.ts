export const orbMotionVariants = {
  wave: {
    animate: {
      y: [0, -25, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
    }
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    }
  },
  drift: {
    animate: {
      y: [0, -15, 0],
      x: [0, 10, 0],
      transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
    }
  },
  spiral: {
    animate: {
      rotate: 360,
      transition: { duration: 8, repeat: Infinity, ease: 'linear' }
    }
  }
};

export const orbInteractionVariants = {
  default: { scale: 1, opacity: 1 },
  hover: {
    scale: 1.08,
    opacity: 1,
    boxShadow: '0 0 40px rgba(0,212,255,0.6)',
    transition: { duration: 0.2 }
  },
  selected: {
    scale: 0.95,
    opacity: 1,
    boxShadow: '0 0 60px rgba(0,212,255,1)',
    transition: { duration: 0.2 }
  },
  fading: {
    scale: 1,
    opacity: 0,
    transition: { duration: 0.3 }
  },
  pulse: {
    scale: [1, 0.8, 1.3, 1],
    transition: { duration: 0.5 }
  }
};

export const fadeInStagger = {
  container: { staggerChildren: 0.1, delayChildren: 0.2 },
  item: { opacity: [0, 1], transition: { duration: 0.3 } }
};

export const slideInFromBottom = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};
