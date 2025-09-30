"use client";

import { useCallback, useState } from 'react';
import GalaxyCanvas from "./galaxy/GalaxyCanvas";
import { LoadingScreen as LoadingOverlay } from './components/loading/LoadingScreen';
import { LoadingScreenError, ParticleSystemState } from './components/loading/types';

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [particleState, setParticleState] = useState<ParticleSystemState | null>(null);

  const handleLoadingComplete = useCallback((finalState: ParticleSystemState) => {
    setParticleState(finalState);
    setIsLoading(false);
  }, []);

  const handleLoadingError = useCallback((error: LoadingScreenError) => {
    console.error('Loading error encountered:', error);
    setIsLoading(false);
  }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      <GalaxyCanvas loadingParticleState={particleState ?? undefined} />

      {isLoading && (
        <div className="pointer-events-auto absolute inset-0 z-[2000]">
          <LoadingOverlay onComplete={handleLoadingComplete} onError={handleLoadingError} />
        </div>
      )}
    </main>
  );
}
