import { useCallback, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { ScrollTrigger } from './lib/gsap.js';
import Preloader from './components/Preloader.jsx';
import ScrollProgress from './components/ScrollProgress.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import FeaturedTrips from './components/FeaturedTrips.jsx';
import Manifesto from './components/Manifesto.jsx';
import RoadTrips from './components/RoadTrips.jsx';
import Treks from './components/Treks.jsx';
import Process from './components/Process.jsx';
import Community from './components/Community.jsx';
import CallToAction from './components/CallToAction.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [loading, setLoading] = useState(true);
  // `ready` flips as the curtain starts opening so the hero intro plays underneath it.
  const [ready, setReady] = useState(false);

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
      <main>
        <Hero ready={ready} />
        <FeaturedTrips />
        <Manifesto />
        <RoadTrips />
        <Treks />
        <Process />
        <Community />
        <CallToAction />
      </main>
      <Footer />
    </MotionConfig>
  );
}
