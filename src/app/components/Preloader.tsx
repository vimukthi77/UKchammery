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
          width: 90px;
          height: 90px;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .brand-logo-pulse {
          width: 52px;
          height: 52px;
          object-fit: contain;
          animation: logo-breathe 2s ease-in-out infinite;
          z-index: 2;
        }

        .spinner-ring {
          position: absolute;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          border: 2.5px solid rgba(6, 78, 59, 0.05);
          z-index: 1;
        }

        .spinner-active {
          position: absolute;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          border-top-color: var(--primary);
          border-right-color: var(--accent);
          animation: spin-loader 1.2s cubic-bezier(0.5, 0.15, 0.5, 0.85) infinite;
          z-index: 1;
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

        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes logo-breathe {
          0%, 100% {
            transform: scale(0.94);
            filter: drop-shadow(0 2px 4px rgba(6, 78, 59, 0.04));
          }
          50% {
            transform: scale(1.04);
            filter: drop-shadow(0 6px 14px rgba(6, 78, 59, 0.12));
          }
        }

        @keyframes text-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="loader-wrapper">
        <div className="spinner-ring" />
        <div className="spinner-active" />
        <img className="brand-logo-pulse" src="/uklogo.png" alt="UK-Chammery" />
      </div>

      <div className="preloader-status-text">{message}</div>
    </div>
  );
}
