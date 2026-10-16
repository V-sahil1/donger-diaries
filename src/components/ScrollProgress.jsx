import { useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { createTrekkerScene } from './trekkerScene.js';

/** Orange→green trail under the header with a 3D trekker walking at its tip. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  const left = useTransform(progress, (v) => `${v * 100}%`);
  const riderOpacity = useTransform(progress, [0, 0.02], [0, 1]);
  const canvasRef = useRef(null);

  useEffect(() => {
    const scene = createTrekkerScene(canvasRef.current);
    return () => scene.dispose();
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <motion.div className="scroll-progress__bar" style={{ scaleX: progress }} />
      <motion.span className="scroll-progress__rider" style={{ left, opacity: riderOpacity }}>
        <canvas ref={canvasRef} className="scroll-progress__trekker" />
      </motion.span>
    </div>
  );
}
