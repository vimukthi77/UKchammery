'use client';

import React from 'react';

interface PreloaderProps {
  message?: string;
}

export default function Preloader({ message = 'Loading...' }: PreloaderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#ffffff',
      zIndex: 9999,
      gap: '20px',
      fontFamily: 'var(--font-sans), sans-serif'
    }}>
      <style>{`
        .loader-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .spaghetti-svg {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 90px;
          height: 90px;
          z-index: 2;
        }

        .spinner-ring {
          position: absolute;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 2px solid rgba(6, 78, 59, 0.05);
          z-index: 1;
        }

        .spinner-active {
          position: absolute;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: var(--primary);
          border-right-color: var(--accent);
          animation: spin-loader 1.4s cubic-bezier(0.5, 0.15, 0.5, 0.85) infinite;
          z-index: 1;
        }

        .glow-plate {
          animation: plate-glow 2s ease-in-out infinite alternate;
        }

        .steam-wave-1 {
          animation: steam-anim 2.2s ease-in-out infinite;
          transform-origin: 45px 50px;
        }

        .steam-wave-2 {
          animation: steam-anim 2.2s ease-in-out infinite;
          animation-delay: 1.1s;
          transform-origin: 55px 50px;
        }

        .noodle-pulse {
          animation: noodle-glow 2s ease-in-out infinite alternate;
        }

        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes plate-glow {
          0% {
            filter: drop-shadow(0 2px 4px rgba(6, 78, 59, 0.15));
            transform: translate(-50%, -50%) scale(0.96);
          }
          100% {
            filter: drop-shadow(0 6px 16px rgba(6, 78, 59, 0.4)) drop-shadow(0 0 8px rgba(212, 163, 115, 0.3));
            transform: translate(-50%, -50%) scale(1.04);
          }
        }

        @keyframes noodle-glow {
          0% {
            stroke: var(--accent);
            filter: drop-shadow(0 0 1px rgba(212, 163, 115, 0.4));
          }
          100% {
            stroke: #FCD34D;
            filter: drop-shadow(0 0 4px rgba(252, 211, 77, 0.9));
          }
        }

        @keyframes steam-anim {
          0% {
            transform: translateY(2px) scaleX(0.9);
            opacity: 0;
          }
          30% {
            opacity: 0.6;
          }
          80% {
            opacity: 0;
          }
          100% {
            transform: translateY(-12px) scaleX(1.1);
            opacity: 0;
          }
        }

        .preloader-status-text {
          font-size: 0.72rem;
          color: var(--primary);
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: 0.8;
          animation: text-pulse 2s ease-in-out infinite;
        }

        @keyframes text-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="loader-wrapper">
        <div className="spinner-ring" />
        <div className="spinner-active" />
        
        {/* Custom SVG Vector Spaghetti Plate */}
        <svg className="spaghetti-svg glow-plate" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Steam lines */}
          <path className="steam-wave-1" d="M44 48 Q42 40 46 34 T44 22" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />
          <path className="steam-wave-2" d="M54 48 Q56 41 52 35 T54 23" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />
          
          {/* Plate */}
          {/* Rim */}
          <ellipse cx="50" cy="66" rx="34" ry="12" stroke="var(--primary)" strokeWidth="3.5" fill="#FFFFFF" />
          {/* Plate inner base */}
          <ellipse cx="50" cy="67" rx="26" ry="8" stroke="rgba(6, 78, 59, 0.15)" strokeWidth="1.5" />
          
          {/* Spaghetti Heap (tangled glowing noodles) */}
          <path className="noodle-pulse" d="M30 65 C 34 52, 44 50, 48 58 C 50 48, 62 48, 66 58 C 70 65, 62 70, 50 69 C 38 68, 28 66, 30 65 Z" fill="none" strokeWidth="2.8" strokeLinecap="round" />
          <path className="noodle-pulse" d="M36 64 C 38 56, 44 54, 48 60 C 52 54, 58 56, 62 62" fill="none" strokeWidth="2.8" strokeLinecap="round" />
          <path className="noodle-pulse" d="M42 66 C 44 58, 52 58, 56 64" fill="none" strokeWidth="2.8" strokeLinecap="round" />
          <path className="noodle-pulse" d="M40 62 C 45 52, 55 52, 60 62" fill="none" strokeWidth="2.5" strokeLinecap="round" />

          {/* Fork dipping in */}
          {/* Handle */}
          <path d="M68 32 L56 48" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
          {/* Prong head connector */}
          <path d="M56 48 L51 52" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Three small prongs inside noodles */}
          <path d="M51 52 L47 56 M52 51 L48 55 M50 53 L46 57" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Basil leaf/garnish details */}
          <path d="M47 55 Q49 53 47 51 Q45 53 47 55 Z" fill="var(--primary)" />
          <path d="M53 58 Q55 56 53 54 Q51 56 53 58 Z" fill="var(--primary)" />
        </svg>
      </div>

      <div className="preloader-status-text">{message}</div>
    </div>
  );
}
