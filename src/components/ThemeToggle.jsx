import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext.jsx';
import Icon from './Icon.jsx';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <motion.button
      type="button"
      className="icon-btn theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.88 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          className="theme-toggle__icon"
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Icon name={isDark ? 'light_mode' : 'dark_mode'} className={isDark ? 'tone-accent' : ''} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
