import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Icon from './Icon.jsx';

/** Orange→green trail under the header with a cyclist riding at its tip. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  const left = useTransform(progress, (v) => `${v * 100}%`);
  const riderOpacity = useTransform(progress, [0, 0.02], [0, 1]);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <motion.div className="scroll-progress__bar" style={{ scaleX: progress }} />
      <motion.span className="scroll-progress__rider" style={{ left, opacity: riderOpacity }}>
        <Icon name="directions_bike" />
      </motion.span>
    </div>
  );
}
