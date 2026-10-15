import { motion } from 'framer-motion';

// Shared Framer Motion building blocks for scroll-in reveals.
const ease = [0.2, 0.7, 0.2, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const container = (stagger) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
});

/** Parent that reveals its <Item> children one after another when scrolled into view. */
export function Stagger({ as = 'div', stagger = 0.12, amount = 0.15, children, ...props }) {
  const Component = motion[as];
  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={container(stagger)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Item({ as = 'div', variants = fadeUp, ...props }) {
  const Component = motion[as];
  return <Component variants={variants} {...props} />;
}

/** Stand-alone element that fades up when scrolled into view. */
export function Reveal({ as = 'div', variants = fadeUp, amount = 0.2, ...props }) {
  const Component = motion[as];
  return (
    <Component
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variants}
      {...props}
    />
  );
}
