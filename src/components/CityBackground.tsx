import React from 'react';

interface CityBackgroundProps {
  children: React.ReactNode;
}

export default function CityBackground({ children }: CityBackgroundProps) {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#09090e' // Ensure a base background color is set on wrapper
    }}>
      {/* Background Image Layer */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: 'url("/city_background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.38) blur(6px) contrast(1.1)',
          transform: 'scale(1.05)', // Prevent white edges due to blur
          zIndex: 1 // Positive stacking context
        }} 
        aria-hidden="true"
      />

      {/* Dark Vignette Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle at 50% 50%, rgba(9, 9, 14, 0.1) 0%, rgba(9, 9, 14, 0.7) 100%)',
          zIndex: 2 // Positioned in front of the image
        }} 
        aria-hidden="true"
      />

      {/* Content Layer */}
      <div style={{
        position: 'relative',
        zIndex: 10, // Positioned on top of both background layers
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </div>
    </div>
  );
}
