import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { ScrollTrigger } from './lib/gsap.js';
import { useParallax } from './lib/parallax.js';
import Preloader from './components/Preloader.jsx';
import ScrollProgress from './components/ScrollProgress.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import FeaturedTrips from './components/FeaturedTrips.jsx';
import Manifesto from './components/Manifesto.jsx';
import Journey from './components/journey/Journey.jsx';
import RoadTrips from './components/RoadTrips.jsx';
import Treks from './components/Treks.jsx';
import PlaceStories from './components/stories/PlaceStories.jsx';
import Process from './components/Process.jsx';
import Community from './components/Community.jsx';
import CallToAction from './components/CallToAction.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [loading, setLoading] = useState(true);
  // `ready` flips as the curtain starts opening so the hero intro plays underneath it.
  const [ready, setReady] = useState(false);

  const mainRef = useRef(null);
  // Layered depth: photos and collage pieces drift at different scroll speeds.
  useParallax(mainRef);

  // Lazy images and late fonts change the page height after the scroll
  // triggers were measured, which leaves pinned sections (the route, the fort
  // stories) switching on in the wrong place. Re-measure whenever it changes.
  useEffect(() => {
    const main = mainRef.current;
    let lastHeight = main.offsetHeight;
    let timer;
    const ro = new ResizeObserver(() => {
      const height = main.offsetHeight;
      if (Math.abs(height - lastHeight) < 2) return;
      lastHeight = height;
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    ro.observe(main);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  const handleReveal = useCallback(() => setReady(true), []);
  const handleDone = useCallback(() => {
    setLoading(false);
    ScrollTrigger.refresh();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {loading && <Preloader onReveal={handleReveal} onDone={handleDone} />}
      <ScrollProgress />
      <Header ready={ready} />
      <main ref={mainRef}>
        <Hero ready={ready} />
        <FeaturedTrips />
        <Manifesto />
        <Journey />
        <RoadTrips />
        <Treks />
        <PlaceStories />
        <Process />
        <Community />
        <CallToAction />
      </main>
      <Footer />
    </MotionConfig>
  );
}
