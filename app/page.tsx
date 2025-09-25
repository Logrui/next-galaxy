"use client";

import { useState } from 'react';
import GalaxyCanvas from "./galaxy/GalaxyCanvas";
import LoadingScreen from './components/LoadingScreen';

export default function Page() {
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  return (
    <>
      {/* Galaxy loads in background immediately */}
      <div style={{ 
        opacity: showLoading ? 0 : 1, 
        transition: 'opacity 0.5s ease-in-out',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}>
        <GalaxyCanvas />
      </div>
      
      {/* Loading screen overlay */}
      {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
    </>
  );
}
