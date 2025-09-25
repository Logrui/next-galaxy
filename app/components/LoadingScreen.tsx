'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Random duration between 3-10 seconds
    const duration = Math.random() * 7000 + 3000; // 3000ms to 10000ms
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress >= 100) {
        // Start fade out animation
        setTimeout(() => {
          setIsVisible(false);
          // Call onComplete after fade out animation
          setTimeout(onComplete, 500);
        }, 300);
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [onComplete]);

  // Generate fewer, slower moving particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.4 + 0.1,
    animationDelay: Math.random() * 8,
    duration: Math.random() * 4 + 6, // 6-10 seconds
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="loading-screen"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, rgba(15, 15, 35, 0.95) 0%, rgba(5, 5, 15, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
        overflow: 'hidden',
      }}
    >
      {/* Slow moving particles background */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            opacity: particle.opacity,
            animation: `float ${particle.duration}s infinite ${particle.animationDelay}s ease-in-out`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* Glassmorphism container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '60px 80px',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        zIndex: 1,
        maxWidth: '500px',
        width: '90%',
      }}>
        {/* Minimalist loading indicator */}
        <div style={{
          width: '60px',
          height: '60px',
          margin: '0 auto 40px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderTop: '2px solid rgba(255, 255, 255, 0.8)',
          animation: 'spin 2s linear infinite',
        }} />

        {/* Clean title */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '200',
          marginBottom: '16px',
          color: 'rgba(255, 255, 255, 0.95)',
          letterSpacing: '4px',
          textTransform: 'uppercase',
        }}>
          Galaxy
        </h1>

        <p style={{
          fontSize: '0.9rem',
          opacity: 0.6,
          marginBottom: '50px',
          letterSpacing: '1px',
          fontWeight: '300',
        }}>
          Loading cosmic experience
        </p>

        {/* Clean progress bar */}
        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '0.5px',
          overflow: 'hidden',
          margin: '0 auto 24px',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '0.5px',
            transition: 'width 0.3s ease-out',
          }} />
        </div>

        {/* Progress percentage */}
        <div style={{
          fontSize: '0.8rem',
          opacity: 0.5,
          fontFamily: 'monospace',
          fontWeight: '300',
        }}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-20px) translateX(10px); 
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-10px) translateX(-5px); 
            opacity: 0.4;
          }
          75% { 
            transform: translateY(-30px) translateX(-10px); 
            opacity: 0.7;
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-screen {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
      `}</style>
    </div>
  );
}
