'use client';

import React, { useCallback, useState } from 'react';
import { LoadingScreen as NewLoadingScreen } from './loading/LoadingScreen';
import { LoadingPhase, LoadingScreenError } from './loading/types';
import { ParticleSystemState } from '../galaxy/types';

interface LegacyLoadingScreenProps {
  onComplete?: (particleState?: ParticleSystemState) => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Legacy LoadingScreen wrapper component.
 * Maintains backward compatibility while using the new comprehensive loading system.
 */
export const LoadingScreen: React.FC<LegacyLoadingScreenProps> = ({ 
  onComplete, 
  children, 
  className 
}) => {
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(LoadingPhase.INITIALIZING);
  const [particleState, setParticleState] = useState<ParticleSystemState | null>(null);

  // Handle completion callback from legacy interface
  const handleLoadingComplete = useCallback((finalParticleState: ParticleSystemState) => {
    setParticleState(finalParticleState);
    setLoadingPhase(LoadingPhase.COMPLETE);
    onComplete?.(finalParticleState);
  }, [onComplete]);

  // Handle loading errors
  const handleError = useCallback((error: LoadingScreenError) => {
    console.error('Loading screen error:', error);
    // For now, just complete the loading on errors to maintain compatibility
    onComplete?.();
  }, [onComplete]);

  // Show children after loading completes
  if (loadingPhase === LoadingPhase.COMPLETE && children) {
    return <>{children}</>;
  }

  return (
    <div className={className}>
      <NewLoadingScreen 
        onComplete={handleLoadingComplete}
        onError={handleError}
      />
    </div>
  );
};

export default LoadingScreen;
