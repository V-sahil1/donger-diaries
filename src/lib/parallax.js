import { useLayoutEffect } from 'react';
import { gsap, prefersReducedMotion } from './gsap.js';

/**
 * Scroll parallax for every `[data-parallax="N"]` inside `scope`.
 * The element drifts from -N% to +N% of its own height while it crosses the
 * viewport (negative N drifts the other way). It animates a `--py` custom
 * property consumed by the CSS `translate` property, so it stacks with any
 * transform Framer Motion or a :hover rule is already applying.
 */
export function useParallax(scope) {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-parallax]').forEach((el) => {
        const amount = parseFloat(el.dataset.parallax) || 8;
        gsap.fromTo(
          el,
          { '--py': `${-amount}%` },
          {
            '--py': `${amount}%`,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        );
      });
    }, scope);
    return () => ctx.revert();
  }, [scope]);
}
