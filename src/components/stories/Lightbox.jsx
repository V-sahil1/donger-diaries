import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../Icon.jsx';

/** Full-screen photo viewer: Esc closes, ← / → step through the place's photos. */
export default function Lightbox({ viewer, onClose, onStep }) {
  const closeRef = useRef(null);
  const isOpen = Boolean(viewer);

  useEffect(() => {
    if (!isOpen) return undefined;
    const returnFocus = document.activeElement;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      returnFocus?.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose, onStep]);

  const photo = viewer?.photos[viewer.index];

  return (
    <AnimatePresence>
      {viewer && (
        <motion.div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AnimatePresence mode="wait">
            <motion.figure
              key={photo.src + viewer.index}
              className="lightbox__figure"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              <img src={photo.src} alt={photo.alt} />
              <figcaption>
                <span>{photo.caption}</span>
                <span className="lightbox__pos">
                  {viewer.index + 1} / {viewer.photos.length}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>

          <button ref={closeRef} type="button" className="lightbox__btn lightbox__close" onClick={onClose} aria-label="Close photo viewer">
            <Icon name="close" />
          </button>
          <button
            type="button"
            className="lightbox__btn lightbox__prev"
            onClick={(e) => {
              e.stopPropagation();
              onStep(-1);
            }}
            aria-label="Previous photo"
          >
            <Icon name="arrow_back" />
          </button>
          <button
            type="button"
            className="lightbox__btn lightbox__next"
            onClick={(e) => {
              e.stopPropagation();
              onStep(1);
            }}
            aria-label="Next photo"
          >
            <Icon name="arrow_forward" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
