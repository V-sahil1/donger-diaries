import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { navLinks } from '../data/content.js';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header({ ready = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('#top');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the nav item for the section currently in view.
  useEffect(() => {
    const sections = navLinks.map((l) => document.querySelector(l.href)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled || menuOpen ? 'is-scrolled' : ''}`}>
      <motion.div
        className="site-header__inner container"
        initial={{ y: -30, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1], delay: 0.5 }}
      >
        <a className="brand" href="#top" aria-label="Dongar Diaries home">
          <Logo />
        </a>

        <nav className="main-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={active === link.href ? 'is-active' : ''}
              aria-current={active === link.href ? 'page' : undefined}
            >
              {link.label}
              {active === link.href && (
                <motion.span
                  layoutId="nav-indicator"
                  className="nav-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          <a className="btn btn--primary btn--sm header-cta" href="#contact">
            <span>Plan a Trip</span>
            <Icon name="arrow_forward" />
          </a>
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <motion.nav
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
            >
              {navLinks.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } }}
                >
                  {link.label}
                  <Icon name="arrow_forward" />
                </motion.a>
              ))}
            </motion.nav>
            <a className="btn btn--primary" href="#contact" onClick={() => setMenuOpen(false)}>
              <span>Plan Your Journey</span>
              <Icon name="arrow_forward" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
