import { motion } from 'framer-motion';
import { Item, Stagger } from './motion.jsx';

const lineUp = {
  hidden: { opacity: 0, y: '0.6em' },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] } },
};

/**
 * Editorial section heading: tracked eyebrow, Playfair Display title,
 * and a handwritten Caveat accent phrase. Reveals itself on scroll.
 */
export default function SectionHeading({
  eyebrow,
  eyebrowTone = 'accent',
  title,
  accent,
  accentTone = 'accent',
  breakBeforeAccent = false,
  as: Tag = 'h2',
  className = '',
}) {
  const Heading = motion[Tag];
  return (
    <Stagger className={`section-heading ${className}`} stagger={0.1} amount={0.4}>
      {eyebrow && (
        <Item as="span" className={`eyebrow tone-${eyebrowTone}`}>
          {eyebrow}
        </Item>
      )}
      <Heading className="headline" variants={lineUp}>
        {title}{' '}
        {breakBeforeAccent && <br />}
        {accent && (
          <motion.em className={`accent-italic tone-${accentTone}`} variants={lineUp}>
            {accent}
          </motion.em>
        )}
      </Heading>
    </Stagger>
  );
}
