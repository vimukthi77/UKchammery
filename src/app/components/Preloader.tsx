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
      backgroundColor: '#fafafa',
      zIndex: 9999,
      gap: '16px',
      fontFamily: 'var(--font-sans), sans-serif'
    }}>
      <style>{`
        .preloader-circle-bg {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(6, 78, 59, 0.06);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          justifyContent: center;
          position: relative;
          margin-bottom: 4px;
        }

        /* Minimal plate curve drawing */
        .plate-svg {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0.85;
        }

        /* Abstract professional drops */
        .food-item {
          position: absolute;
          opacity: 0;
        }

        .food-capsule {
          width: 12px;
          height: 6px;
          border-radius: 3px;
          background-color: var(--accent); /* warm gold */
          animation: drop-rotate 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          left: 36px;
          top: 24px;
        }

        .food-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--primary); /* forest green */
          animation: drop-straight 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite 0.6s;
          left: 50px;
          top: 26px;
        }

        .food-leaf {
          width: 8px;
          height: 8px;
          border-radius: 6px 0;
          background-color: #10B981; /* emerald green */
          transform: rotate(-45deg);
          animation: drop-leaf 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite 1.2s;
          left: 60px;
          top: 22px;
        }

        /* Landing Ripples */
        .ripple {
          position: absolute;
          bottom: 27px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 2px;
          border-radius: 50%;
          border: 1.5px solid var(--accent);
          opacity: 0;
        }
        .ripple-1 {
          animation: ripple-out 2.2s ease-out infinite 0.4s;
        }
        .ripple-2 {
          animation: ripple-out 2.2s ease-out infinite 1.0s;
        }
        .ripple-3 {
          animation: ripple-out 2.2s ease-out infinite 1.6s;
        }

        @keyframes drop-rotate {
          0% {
            transform: translateY(-40px) rotate(-30deg) scale(0.3);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          40%, 80% {
            transform: translateY(32px) rotate(15deg) scale(1);
            opacity: 1;
          }
          95%, 100% {
            transform: translateY(32px) rotate(15deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes drop-straight {
          0% {
            transform: translateY(-40px) scale(0.3);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          40%, 80% {
            transform: translateY(30px) scale(1);
            opacity: 1;
          }
          95%, 100% {
            transform: translateY(30px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes drop-leaf {
          0% {
            transform: translateY(-40px) rotate(-60deg) scale(0.3);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          40%, 80% {
            transform: translateY(34px) rotate(-15deg) scale(1);
            opacity: 1;
          }
          95%, 100% {
            transform: translateY(34px) rotate(-15deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes ripple-out {
          0% {
            width: 6px;
            height: 2px;
            opacity: 0;
          }
          5% {
            opacity: 0.8;
          }
          20% {
            width: 44px;
            height: 8px;
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }

        .preloader-text-modern {
          font-size: 0.72rem;
          color: var(--primary);
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          animation: pulse-opacity 1.8s ease-in-out infinite;
        }

        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="preloader-circle-bg">
        {/* Sleek plate curve */}
        <svg className="plate-svg" width="56" height="12" viewBox="0 0 56 12">
          <path d="M 4,2 Q 28,11 52,2" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 12,5 Q 28,10 44,5" fill="none" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </svg>

        {/* Dynamic drop ripples */}
        <div className="ripple ripple-1" />
        <div className="ripple ripple-2" />
        <div className="ripple ripple-3" />

        {/* Dropping modern ingredients */}
        <div className="food-item food-capsule" />
        <div className="food-item food-dot" />
        <div className="food-item food-leaf" />
      </div>

      <div className="preloader-text-modern">{message}</div>
    </div>
  );
}
