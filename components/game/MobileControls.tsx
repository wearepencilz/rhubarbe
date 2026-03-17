'use client';

import { useEffect, useRef } from 'react';

interface MobileControlsProps {
  onMove: (direction: 'left' | 'right' | 'stop') => void;
  onJump: () => void;
  onClose?: () => void;
}

export default function MobileControls({ onMove, onJump, onClose }: MobileControlsProps) {
  const leftButtonRef = useRef<HTMLButtonElement>(null);
  const rightButtonRef = useRef<HTMLButtonElement>(null);
  const upButtonRef = useRef<HTMLButtonElement>(null);
  const jumpButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const leftButton = leftButtonRef.current;
    const rightButton = rightButtonRef.current;
    const upButton = upButtonRef.current;
    const jumpButton = jumpButtonRef.current;

    if (!leftButton || !rightButton || !upButton || !jumpButton) return;

    // Left button handlers
    const handleLeftStart = (e: Event) => {
      e.preventDefault();
      console.log('Left button pressed');
      onMove('left');
    };
    const handleLeftEnd = (e: Event) => {
      e.preventDefault();
      console.log('Left button released');
      onMove('stop');
    };

    // Right button handlers
    const handleRightStart = (e: Event) => {
      e.preventDefault();
      console.log('Right button pressed');
      onMove('right');
    };
    const handleRightEnd = (e: Event) => {
      e.preventDefault();
      console.log('Right button released');
      onMove('stop');
    };

    // Up button handlers (also triggers jump)
    const handleUpStart = (e: Event) => {
      e.preventDefault();
      console.log('Up button pressed');
      onJump();
    };

    // Jump button handler
    const handleJump = (e: Event) => {
      e.preventDefault();
      console.log('Jump button pressed');
      onJump();
    };

    // Add touch and mouse event listeners
    leftButton.addEventListener('touchstart', handleLeftStart, { passive: false });
    leftButton.addEventListener('touchend', handleLeftEnd, { passive: false });
    leftButton.addEventListener('mousedown', handleLeftStart);
    leftButton.addEventListener('mouseup', handleLeftEnd);
    leftButton.addEventListener('mouseleave', handleLeftEnd);

    rightButton.addEventListener('touchstart', handleRightStart, { passive: false });
    rightButton.addEventListener('touchend', handleRightEnd, { passive: false });
    rightButton.addEventListener('mousedown', handleRightStart);
    rightButton.addEventListener('mouseup', handleRightEnd);
    rightButton.addEventListener('mouseleave', handleRightEnd);

    upButton.addEventListener('touchstart', handleUpStart, { passive: false });
    upButton.addEventListener('mousedown', handleUpStart);

    jumpButton.addEventListener('touchstart', handleJump, { passive: false });
    jumpButton.addEventListener('mousedown', handleJump);

    // Cleanup
    return () => {
      leftButton.removeEventListener('touchstart', handleLeftStart);
      leftButton.removeEventListener('touchend', handleLeftEnd);
      leftButton.removeEventListener('mousedown', handleLeftStart);
      leftButton.removeEventListener('mouseup', handleLeftEnd);
      leftButton.removeEventListener('mouseleave', handleLeftEnd);

      rightButton.removeEventListener('touchstart', handleRightStart);
      rightButton.removeEventListener('touchend', handleRightEnd);
      rightButton.removeEventListener('mousedown', handleRightStart);
      rightButton.removeEventListener('mouseup', handleRightEnd);
      rightButton.removeEventListener('mouseleave', handleRightEnd);

      upButton.removeEventListener('touchstart', handleUpStart);
      upButton.removeEventListener('mousedown', handleUpStart);

      jumpButton.removeEventListener('touchstart', handleJump);
      jumpButton.removeEventListener('mousedown', handleJump);
    };
  }, [onMove, onJump]);

  return (
    <>
      {/* Game Boy controls at bottom - using Figma exported assets */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 border-t-4 shadow-2xl" style={{ 
        backgroundColor: '#D0CCCA',
        borderColor: '#8E8C90',
        paddingBottom: 'env(safe-area-inset-bottom)' 
      }}>
        <div className="relative px-6 py-8">
          <div className="max-w-md mx-auto flex justify-between items-center gap-4">
            {/* D-Pad - 172x172px with 60x60px touch areas */}
            <div className="relative flex items-center justify-center" style={{ width: '172px', height: '172px' }}>
              {/* D-Pad image background */}
              <img 
                src="/controller/d-pad.png" 
                alt="D-Pad" 
                width={172} 
                height={172}
                className="absolute select-none"
                style={{ 
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  pointerEvents: 'none'
                }}
              />
              
              {/* Left button - 60x60px touch area */}
              <button
                ref={leftButtonRef}
                className="absolute left-0 top-1/2 -translate-y-1/2 active:opacity-70 transition-opacity z-10"
                style={{ width: '60px', height: '60px' }}
                aria-label="Move Left"
              />
              
              {/* Right button - 60x60px touch area */}
              <button
                ref={rightButtonRef}
                className="absolute right-0 top-1/2 -translate-y-1/2 active:opacity-70 transition-opacity z-10"
                style={{ width: '60px', height: '60px' }}
                aria-label="Move Right"
              />
              
              {/* Up button - 60x60px touch area */}
              <button
                ref={upButtonRef}
                className="absolute top-0 left-1/2 -translate-x-1/2 active:opacity-70 transition-opacity z-10"
                style={{ width: '60px', height: '60px' }}
                aria-label="Jump"
              />
            </div>

            {/* Quit button - centered between D-pad and A button */}
            {onClose && (
              <button
                onClick={onClose}
                className="active:opacity-80 transition-opacity flex-shrink-0"
                aria-label="Quit Game"
              >
                <img 
                  src="/controller/quit.png" 
                  alt="Quit" 
                  width={48} 
                  height={48}
                  className="w-12 h-12 select-none"
                  style={{ 
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    WebkitTouchCallout: 'none',
                    pointerEvents: 'none'
                  }}
                />
              </button>
            )}

            {/* A Button (Jump) - using exported asset */}
            <button
              ref={jumpButtonRef}
              className="active:opacity-80 transition-opacity flex-shrink-0"
              aria-label="Jump"
            >
              <img 
                src="/controller/jump.png" 
                alt="Jump" 
                width={80} 
                height={80}
                className="w-20 h-20 select-none"
                style={{ 
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  pointerEvents: 'none'
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
