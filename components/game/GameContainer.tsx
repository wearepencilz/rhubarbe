'use client';

import { useState, useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGameConfig, getGameContainerStyles } from '@/lib/game/phaser-config';
import type { Campaign } from '@/types/game';
import MobileControls from './MobileControls';

interface GameContainerProps {
  campaign: Campaign;
}

type GamePhase = 'name-entry' | 'playing' | 'results';

interface Character {
  id: string;
  name: string;
  color: string;
  description: string;
}

const DEFAULT_CHARACTER: Character = {
  id: 'vanilla-kid',
  name: 'Vanilla Kid',
  color: '#f5e6d3',
  description: 'Classic and reliable',
};

interface GameResult {
  completed: boolean;
  score: number;
  completionTime: number;
  sessionId: string;
  reason?: 'timeout' | 'fell' | 'hazard';
}

export default function GameContainer({ campaign }: GameContainerProps) {
  const [phase, setPhase] = useState<GamePhase>('name-entry');
  const [playerName, setPlayerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaserLoaded, setPhaserLoaded] = useState(false);
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile control handlers
  const handleMobileMove = (direction: 'left' | 'right' | 'stop') => {
    if (!gameInstanceRef.current) return;
    const scene = gameInstanceRef.current.scene.getScene('GameScene') as any;
    if (scene && scene.setMobileInput) {
      scene.setMobileInput({ move: direction });
    }
  };

  const handleMobileJump = () => {
    if (!gameInstanceRef.current) return;
    const scene = gameInstanceRef.current.scene.getScene('GameScene') as any;
    if (scene && scene.setMobileInput) {
      scene.setMobileInput({ jump: true });
      // Reset jump after a short delay
      setTimeout(() => {
        if (scene && scene.setMobileInput) {
          scene.setMobileInput({ jump: false });
        }
      }, 100);
    }
  };

  const handleCloseGame = () => {
    // Destroy game and return to name entry
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }
    setPhase('name-entry');
    setGameResult(null);
    setSubmitResult(null);
    setError(null);
  };

  // Load saved player details from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('janine_player_name');
    const savedPhone = localStorage.getItem('janine_player_phone');
    const savedEmail = localStorage.getItem('janine_player_email');
    
    if (savedName) setPlayerName(savedName);
    if (savedPhone) setContactPhone(savedPhone);
    if (savedEmail) setContactEmail(savedEmail);
  }, []);

  // Load Phaser dynamically on client side only
  useEffect(() => {
    import('phaser').then(() => {
      setPhaserLoaded(true);
    });
  }, []);

  // Cleanup game on unmount only (not on phase changes)
  useEffect(() => {
    return () => {
      console.log('Component unmounting, destroying game');
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array = only run on mount/unmount

  // Handle name validation
  const isNameValid = playerName.length >= 2 && playerName.length <= 20;
  const isPhoneValid = contactPhone.length >= 10;
  const isFormValid = isNameValid && isPhoneValid;

  // Handle name submission - go straight to game
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setError(null);

    try {
      // Save player details to localStorage for future games
      localStorage.setItem('janine_player_name', playerName);
      localStorage.setItem('janine_player_phone', contactPhone);
      if (contactEmail) {
        localStorage.setItem('janine_player_email', contactEmail);
      }

      // Create game session with default character and contact info
      const response = await fetch('/api/game/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          characterId: DEFAULT_CHARACTER.id,
          campaignId: campaign.id,
          contactPhone: contactPhone || undefined,
          contactEmail: contactEmail || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // Move to playing phase first to mount the game container
      setPhase('playing');
      
      // Wait for next tick to ensure container is mounted
      setTimeout(() => {
        initializeGame(data.sessionId, data.gameConfig);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  // Initialize Phaser game
  const initializeGame = async (sessionId: string, gameConfig: any) => {
    if (!gameContainerRef.current || !phaserLoaded) {
      console.error('Cannot initialize game:', { 
        containerExists: !!gameContainerRef.current, 
        phaserLoaded,
        containerRef: gameContainerRef.current 
      });
      setError('Failed to initialize game. Please try again.');
      setPhase('name-entry');
      return;
    }

    console.log('Initializing game with config:', gameConfig);

    try {
      // Dynamically import Phaser and GameScene
      const PhaserModule = await import('phaser');
      const Phaser = PhaserModule.default || PhaserModule;
      const { GameScene } = await import('@/lib/game/scenes/GameScene');

      // Verify Phaser loaded correctly
      if (!Phaser || !Phaser.Game) {
        throw new Error('Phaser failed to load');
      }

      // Parse level data if it's a string
      const levelData = typeof gameConfig.levelData === 'string' 
        ? JSON.parse(gameConfig.levelData) 
        : gameConfig.levelData;

      console.log('Parsed level data:', levelData);

      // Create game configuration with mobile-friendly settings
      const config = createGameConfig(gameContainerRef.current, [GameScene]);

      console.log('Creating Phaser game with config:', config);

      // Create game instance with error handling
      let game: any;
      try {
        game = new Phaser.Game(config);
      } catch (phaserError) {
        console.error('Phaser.Game constructor error:', phaserError);
        throw new Error('Failed to create Phaser game instance');
      }

      if (!game) {
        throw new Error('Game instance is null');
      }

      gameInstanceRef.current = game;
      console.log('Phaser game created:', game);

      // Wait for scene to be ready
      game.events.once('ready', () => {
        console.log('Phaser ready event fired');
        const scene = game.scene.getScene('GameScene') as any;
        
        console.log('Got GameScene:', scene);
        
        if (!scene) {
          console.error('GameScene not found!');
          setError('Failed to load game scene. Please try again.');
          setPhase('name-entry');
          return;
        }
        
        // Listen for game end event
        console.log('Setting up gameEnd event listener');
        scene.events.on('gameEnd', (result: GameResult) => {
          console.log('=== gameEnd EVENT RECEIVED ===');
          console.log('Event result:', result);
          handleGameEnd(result);
        });

        // Start scene with game data
        const sceneData = {
          campaignId: campaign.id,
          sessionId,
          timerDuration: gameConfig.timerDuration,
          levelConfig: levelData,
          assets: gameConfig.assets || {},
          spriteConfig: gameConfig.spriteConfig || null,
        };
        
        console.log('Starting scene with data:', sceneData);
        scene.scene.restart(sceneData);
      });
    } catch (err) {
      console.error('Error initializing game:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to initialize game: ${errorMessage}. Please try refreshing the page.`);
      setPhase('name-entry');
    }
  };

  // Handle game end
  const handleGameEnd = async (result: GameResult) => {
    console.log('=== GAME END ===');
    console.log('handleGameEnd called with result:', result);
    console.log('Current phase:', phase);
    console.log('Current gameResult:', gameResult);
    
    try {
      // Prevent game from being destroyed during transition
      if (gameInstanceRef.current) {
        console.log('Pausing game instance');
        gameInstanceRef.current.scene.pause('GameScene');
      }
      
      setGameResult(result);
      setPhase('results');
      console.log('Phase set to results');

      // Only submit score if game was completed
      if (result.completed) {
        console.log('Game completed, submitting score...');
        await submitScore(result);
      } else {
        console.log('Game not completed, skipping score submission');
      }
    } catch (error) {
      console.error('Error in handleGameEnd:', error);
      setError('Failed to process game results');
    }
  };

  // Submit score to API
  const submitScore = async (result: GameResult) => {
    console.log('submitScore called with result:', result);
    setSubmitting(true);
    setError(null);

    try {
      console.log('Sending score submission request...');
      const response = await fetch('/api/game/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: result.sessionId,
          score: result.score,
          completionTime: result.completionTime,
          clientTimestamp: Date.now(),
        }),
      });

      console.log('Score submission response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Score submission failed:', errorData);
        throw new Error(errorData.message || 'Failed to submit score');
      }

      const data = await response.json();
      console.log('Score submission response:', data);
      console.log('Reward details:', data.reward);
      console.log('Has reward?', !!data.reward);
      if (data.reward) {
        console.log('Claim code:', data.reward.claimCode);
        console.log('QR code URL:', data.reward.qrCodeUrl);
      }
      setSubmitResult(data);
    } catch (err) {
      console.error('Score submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle play again
  const handlePlayAgain = async () => {
    // Destroy existing game
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }

    // Reset state but keep player info
    setGameResult(null);
    setSubmitResult(null);
    setError(null);
    
    // Create new session and restart game
    try {
      const response = await fetch('/api/game/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          characterId: DEFAULT_CHARACTER.id,
          campaignId: campaign.id,
          contactPhone: contactPhone || undefined,
          contactEmail: contactEmail || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // Move to playing phase
      setPhase('playing');
      
      // Wait for next tick to ensure container is mounted
      setTimeout(() => {
        initializeGame(data.sessionId, data.gameConfig);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const handleChangeInfo = () => {
    // Destroy existing game
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }

    // Reset everything
    setPhase('name-entry');
    setPlayerName('');
    setContactPhone('');
    setContactEmail('');
    setSessionId(null);
    setGameResult(null);
    setSubmitResult(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-4 p-0">
      {/* Game container - fullscreen on mobile, card on desktop */}
      <div style={{ display: phase === 'playing' ? 'block' : 'none' }}>
        {/* Full modal background */}
        <div className="fixed md:relative inset-0 md:inset-auto z-40 flex flex-col items-center justify-start p-5" style={{ backgroundColor: '#DDD9D5' }}>
          {/* Screen with border - 4:5 aspect ratio, max-width 400px */}
          <div className="w-full" style={{ maxWidth: '400px' }}>
            <div style={{ 
              aspectRatio: '4 / 5',
              backgroundColor: '#6B696E',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Game screen */}
              <div
                ref={gameContainerRef}
                className="w-full overflow-hidden select-none"
                style={{ 
                  backgroundColor: '#9FB666',
                  borderRadius: '4px',
                  aspectRatio: '400 / 500',
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
              />
            </div>
            
            {/* Quit button - 24px below screen, centered, desktop only */}
            {!isMobile && (
              <div className="flex justify-center" style={{ marginTop: '24px' }}>
                <button
                  onClick={handleCloseGame}
                  className="active:opacity-80 transition-opacity"
                  aria-label="Quit Game"
                >
                  <img 
                    src="/controller/quit.png" 
                    alt="Quit" 
                    width={48} 
                    height={48}
                    className="w-12 h-12"
                    style={{ 
                      pointerEvents: 'auto',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      WebkitTouchCallout: 'none'
                    }}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Controls */}
        {isMobile && (
          <MobileControls
            onMove={handleMobileMove}
            onJump={handleMobileJump}
            onClose={handleCloseGame}
          />
        )}
      </div>

      {/* Name Entry Phase */}
      {phase === 'name-entry' && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-2">Play to Win!</h2>
          <p className="text-center text-gray-600 mb-6">
            Enter your info to play. Winners get a text with their reward code!
          </p>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                maxLength={20}
                autoFocus
              />
              {playerName && !isNameValid && (
                <p className="text-red-500 text-sm mt-1">
                  Name must be between 2 and 20 characters
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
              {contactPhone && !isPhoneValid && (
                <p className="text-red-500 text-sm mt-1">
                  Phone number must be at least 10 digits
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                We'll text you if you win!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Start Game
            </button>

            <p className="text-xs text-gray-500 text-center">
              By playing, you agree to receive SMS notifications about your game results.
            </p>
          </form>
        </div>
      )}

      {/* Results Phase */}
      {phase === 'results' && gameResult && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-6">
            {gameResult.completed ? '🎉 Congratulations!' : 
             gameResult.reason === 'timeout' ? '⏰ Time\'s Up!' : '😢 Oops, you died!'}
          </h2>

          {gameResult.completed && (
            <div className="text-center space-y-4 mb-6">
              <div className="text-6xl font-bold text-blue-600">{gameResult.score}</div>
              <p className="text-xl text-gray-600">
                Completed in {gameResult.completionTime} seconds
              </p>

              {submitting && (
                <p className="text-gray-600">Submitting score...</p>
              )}

              {submitResult && (
                <div className="bg-green-100 border border-green-400 rounded-lg p-4">
                  <p className="font-semibold text-green-800">{submitResult.message}</p>
                  {submitResult.rank && (
                    <p className="text-green-700 mt-2">Your rank: #{submitResult.rank}</p>
                  )}
                  {submitResult.reward && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-400 rounded-lg p-4">
                      <p className="font-bold text-yellow-800 text-xl mb-2">
                        {submitResult.reward.successTitle || '🏆 You won a reward!'}
                      </p>
                      {submitResult.reward.rewardType && (
                        <p className="text-yellow-700 font-semibold mb-2">
                          {submitResult.reward.rewardType}
                        </p>
                      )}
                      
                      {/* QR Code */}
                      {submitResult.reward.qrCodeUrl && (
                        <div className="bg-white p-4 rounded-lg mb-4">
                          <p className="text-sm text-gray-700 mb-2 text-center font-semibold">
                            Show this QR code at the counter:
                          </p>
                          <img 
                            src={submitResult.reward.qrCodeUrl} 
                            alt="Reward QR Code"
                            className="mx-auto w-48 h-48"
                          />
                        </div>
                      )}
                      
                      <p className="text-yellow-700 mt-2">Claim Code:</p>
                      <p className="font-mono text-3xl font-bold text-yellow-900 mt-1 mb-3 tracking-wider">
                        {submitResult.reward.claimCode}
                      </p>
                      <p className="text-sm text-yellow-700 whitespace-pre-line">
                        {submitResult.reward.redemptionInstructions}
                      </p>
                      <p className="text-xs text-yellow-600 mt-3">
                        Expires: {new Date(submitResult.reward.expirationDate).toLocaleDateString()}
                      </p>
                      {contactPhone && (
                        <p className="text-xs text-yellow-600 mt-2">
                          📱 We've sent this code to your phone!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          )}

          {!gameResult.completed && (
            <div className="text-center space-y-4 mb-6">
              <p className="text-xl text-gray-700">
                {gameResult.reason === 'timeout' ? 
                  'Better luck next time!' : 
                  'You fell off the platforms!'}
              </p>
              <p className="text-gray-600">
                Playing as: <span className="font-semibold">{playerName}</span>
              </p>
            </div>
          )}

          <button
            onClick={handlePlayAgain}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors mb-3"
          >
            Try Again
          </button>
          
          <button
            onClick={handleChangeInfo}
            className="w-full text-blue-600 hover:text-blue-700 text-sm transition-colors"
          >
            Change email or phone
          </button>
        </div>
      )}
    </div>
  );
}
