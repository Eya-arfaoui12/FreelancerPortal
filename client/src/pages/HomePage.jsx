import React, { Suspense, lazy, memo } from 'react'
import Navbar from '../components/home/Navbar';
import Footer from '../components/home/Footer';

// Lazy loading pour améliorer les performances
const Hero = lazy(() => import('../components/home/Hero'));
const PopularServices = lazy(() => import('../components/home/PopularServices'));
const Features = lazy(() => import('../components/home/Features'));
const ExplorePros = lazy(() => import('../components/home/ExplorePros'));
const Highlights = lazy(() => import('../components/home/Highlights'));

// Composant de loading optimisé avec memo
const LoadingSpinner = memo(() => (
  <div className="min-h-[100px] flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

const Home = () => {
  return (
    <div className="overflow-hidden">
      <Navbar/>
      
      {/* Hero sans Suspense car c'est critique */}
      <Suspense fallback={<LoadingSpinner />}>
        <Hero />
      </Suspense>
      
      {/* Sections avec Suspense groupé pour éviter les multiples spinners */}
      <Suspense fallback={<LoadingSpinner />}>
        <>
          <PopularServices />
          <Features />
          <ExplorePros />
          <Highlights />
        </>
      </Suspense>
      
      <Footer />
    </div>
  )
}

export default memo(Home)