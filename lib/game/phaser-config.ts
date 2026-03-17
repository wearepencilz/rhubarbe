import * as Phaser from 'phaser';

/**
 * Phaser 3 Game Configuration
 * Optimized for pixel art rendering with 4:3 aspect ratio
 */

// Game dimensions (4:5 aspect ratio - vertical for mobile Game Boy style)
// 400x500 gives us a nice 4:5 ratio
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 500;

// Physics constants
export const GRAVITY = 2200; // Ultra-fast, snappy arcade feel
export const PLAYER_SPEED = 250;
export const PLAYER_JUMP_VELOCITY = -938; // Increased proportionally to maintain height

/**
 * Create Phaser game configuration
 * @param parent - DOM element ID or HTMLElement to mount the game
 * @param scenes - Array of Phaser scenes to use
 */
export function createGameConfig(
  parent: string | HTMLElement,
  scenes: Phaser.Types.Scenes.SceneType[]
): Phaser.Types.Core.GameConfig {
  // Detect if we're on mobile for better compatibility
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

  return {
    type: isMobile ? Phaser.CANVAS : Phaser.AUTO, // Force Canvas on mobile for better compatibility
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#87CEEB', // Sky blue
    
    // Pixel art rendering settings
    render: {
      pixelArt: true, // Disable anti-aliasing for crisp pixels
      antialias: false,
      roundPixels: true, // Round pixel positions to prevent sub-pixel rendering
      transparent: false,
      clearBeforeRender: true,
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
      failIfMajorPerformanceCaveat: false, // Don't fail on mobile if WebGL is slow
    },
    
    // Physics configuration
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: GRAVITY, x: 0 },
        debug: false, // Disable debug outlines
      },
    },
    
    // Scale configuration for responsive design
    scale: {
      mode: Phaser.Scale.FIT, // Fit game to container while maintaining aspect ratio
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    
    // Frame rate settings
    fps: {
      target: 60, // Target 60 FPS
      min: 30, // Minimum acceptable FPS
      forceSetTimeOut: false,
    },
    
    // Scene configuration
    scene: scenes,
    
    // Audio configuration
    audio: {
      disableWebAudio: false,
    },
    
    // Input configuration
    input: {
      keyboard: true,
      touch: true,
      gamepad: false,
    },
    
    // Disable context menu on right-click
    disableContextMenu: true,
    
    // Banner configuration
    banner: {
      hidePhaser: true, // Hide Phaser banner in console
      text: '#000000',
      background: [
        '#87CEEB',
        '#4A90E2',
        '#87CEEB',
        '#4A90E2'
      ]
    },
  };
}

/**
 * Calculate scaled dimensions to maintain 3:4 aspect ratio
 * @param containerWidth - Available container width
 * @param containerHeight - Available container height
 */
export function calculateScaledDimensions(
  containerWidth: number,
  containerHeight: number
): { width: number; height: number; scale: number } {
  const aspectRatio = GAME_WIDTH / GAME_HEIGHT; // 512/448 = 1.14...
  
  let width = containerWidth;
  let height = containerWidth / aspectRatio;
  
  // If height exceeds container, scale by height instead
  if (height > containerHeight) {
    height = containerHeight;
    width = containerHeight * aspectRatio;
  }
  
  const scale = width / GAME_WIDTH;
  
  return { width, height, scale };
}

/**
 * Get responsive game container styles
 * Ensures game maintains 3:4 aspect ratio on all devices
 */
export function getGameContainerStyles(): React.CSSProperties {
  return {
    width: '100%',
    maxWidth: `${GAME_WIDTH * 2}px`, // 800px max
    aspectRatio: '400 / 500',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
  };
}

/**
 * Color palette for Game Boy aesthetic
 */
export const COLORS = {
  // Game Boy original palette
  DARKEST: 0x0f380f,
  DARK: 0x306230,
  LIGHT: 0x8bac0f,
  LIGHTEST: 0x9bbc0f,
  
  // UI colors
  PRIMARY: 0x4a90e2,
  SUCCESS: 0x7ed321,
  WARNING: 0xf5a623,
  DANGER: 0xd0021b,
  
  // Game colors
  SKY: 0x87ceeb,
  GROUND: 0x8b4513,
  PLATFORM: 0x654321,
  ICE_CREAM: 0xffc0cb,
  PLAYER: 0xff6b6b,
};

/**
 * Z-index layers for proper rendering order
 */
export const LAYERS = {
  BACKGROUND: 0,
  PLATFORMS: 10,
  COLLECTIBLES: 20,
  PLAYER: 30,
  UI: 100,
};

/**
 * Game states
 */
export enum GameState {
  LOADING = 'loading',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  GAME_OVER = 'game_over',
}

/**
 * Input key mappings
 */
export const KEYS = {
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  JUMP: ['ArrowUp', 'KeyW', 'Space'],
  PAUSE: ['Escape', 'KeyP'],
};
