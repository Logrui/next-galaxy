"use client";

import { useState } from 'react';
import GalaxyCanvas from "./galaxy/GalaxyCanvas";
import LoadingScreen from './components/LoadingScreen';
import { ParticleSystemState } from './galaxy/types';

export default function Page() {
  const [showLoading, setShowLoading] = useState(true);
  const [loadingParticleState, setLoadingParticleState] = useState<ParticleSystemState | null>(null);

  const handleLoadingComplete = (particleState?: ParticleSystemState) => {
    if (particleState) {
      setLoadingParticleState(particleState);
    }
    setShowLoading(false);
  };

  return (
    <>
      {/* Loading screen overlay (renders first) */}
      {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Galaxy renders only after loading completes to avoid premature WebGL usage */}
      {!showLoading && (
        <div style={{ 
          opacity: showLoading ? 0 : 1, 
          transition: 'opacity 0.5s ease-in-out',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}>
          <GalaxyCanvas loadingParticleState={loadingParticleState || undefined} />
        </div>
      )}
    </>
  );
}
