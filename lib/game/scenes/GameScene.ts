import * as Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  COLORS,
  LAYERS,
  GameState,
} from '../phaser-config';
import type { LevelConfig } from '@/types/game';

interface GameSceneData {
  campaignId: string;
  sessionId: string;
  timerDuration: number;
  levelConfig: LevelConfig;
  assets?: {
    playerSpriteUrl?: string | null;
    playerJumpSpriteUrl?: string | null;
    icecreamSpriteUrl?: string | null;
    ingredientSpriteUrl?: string | null;
    platformSpriteUrl?: string | null;
    platformWoodSpriteUrl?: string | null;
    platformStoneSpriteUrl?: string | null;
    platformIceSpriteUrl?: string | null;
    bridgeSpriteUrl?: string | null;
    backgroundUrl?: string | null;
    hazardSpriteUrl?: string | null;
  };
  spriteConfig?: {
    idleSpriteUrl: string;
    walkSpriteUrl: string;
    jumpSpriteUrl: string;
    frameWidth: number;
    frameHeight: number;
    walkFrameCount: number;
    walkFrameRate: number;
  } | null;
}

/**
 * Main game scene with platformer gameplay
 */
export class GameScene extends Phaser.Scene {
  // Game state
  private gameState: GameState = GameState.LOADING;
  private score: number = 0;
  private timeRemaining: number = 0;
  private startTime: number = 0;
  
  // Game data
  private campaignId: string = '';
  private sessionId: string = '';
  private timerDuration: number = 60;
  private levelConfig?: LevelConfig;
  private assets?: GameSceneData['assets'];
  private spriteConfig?: GameSceneData['spriteConfig'];
  
  // Game objects
  private player?: Phaser.Physics.Arcade.Sprite;
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private iceCream?: Phaser.Physics.Arcade.Sprite;
  private ingredients?: Phaser.Physics.Arcade.Group;
  private hazards?: Phaser.Physics.Arcade.StaticGroup;
  
  // Game progress
  private ingredientsCollected: number = 0;
  private totalIngredients: number = 0;
  
  // Input
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  
  // Mobile input
  private mobileInput: {
    move: 'left' | 'right' | 'stop';
    jump: boolean;
  } = {
    move: 'stop',
    jump: false,
  };
  
  // UI
  private timerText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  
  // Timer
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Initialize scene with game data
   */
  init(data: GameSceneData) {
    this.campaignId = data.campaignId;
    this.sessionId = data.sessionId;
    this.timerDuration = data.timerDuration;
    this.levelConfig = data.levelConfig;
    this.assets = data.assets;
    this.spriteConfig = data.spriteConfig;
    this.timeRemaining = this.timerDuration;
    this.gameState = GameState.LOADING;
  }

  /**
   * Preload game assets
   */
  preload() {
    // Load walking sprite sheets if provided
    if (this.spriteConfig) {
      this.load.image('player_idle', this.spriteConfig.idleSpriteUrl);
      this.load.spritesheet('player_walk', this.spriteConfig.walkSpriteUrl, {
        frameWidth: this.spriteConfig.frameWidth,
        frameHeight: this.spriteConfig.frameHeight,
      });
      this.load.image('player_jump', this.spriteConfig.jumpSpriteUrl);
    } else {
      // Load custom sprites if provided (legacy support)
      if (this.assets?.playerSpriteUrl) {
        this.load.image('player_custom', this.assets.playerSpriteUrl);
      }
      if (this.assets?.playerJumpSpriteUrl) {
        this.load.image('player_jump_custom', this.assets.playerJumpSpriteUrl);
      }
    }
    
    if (this.assets?.icecreamSpriteUrl) {
      this.load.image('icecream_custom', this.assets.icecreamSpriteUrl);
    }
    if (this.assets?.ingredientSpriteUrl) {
      this.load.image('ingredient_custom', this.assets.ingredientSpriteUrl);
    }
    if (this.assets?.platformSpriteUrl) {
      this.load.image('platform_custom', this.assets.platformSpriteUrl);
    }
    
    // Load new platform sprite variants
    if (this.assets?.platformWoodSpriteUrl) {
      this.load.image('platform_wood', this.assets.platformWoodSpriteUrl);
    }
    if (this.assets?.platformStoneSpriteUrl) {
      this.load.image('platform_stone', this.assets.platformStoneSpriteUrl);
    }
    if (this.assets?.platformIceSpriteUrl) {
      this.load.image('platform_ice', this.assets.platformIceSpriteUrl);
    }
    if (this.assets?.bridgeSpriteUrl) {
      this.load.image('platform_bridge', this.assets.bridgeSpriteUrl);
    }
    
    if (this.assets?.backgroundUrl) {
      this.load.image('background_custom', this.assets.backgroundUrl);
    }
    if (this.assets?.hazardSpriteUrl) {
      this.load.image('hazard_custom', this.assets.hazardSpriteUrl);
    }
  }

  /**
   * Create game objects and setup
   */
  create() {
    // Get world width from level config or use default
    const worldWidth = (this.levelConfig as any)?.worldWidth || GAME_WIDTH * 2;
    
    // Set world bounds for side-scrolling
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    
    // Setup camera to follow player
    this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor('#87CEEB');
    
    // Create background (custom or gradient)
    this.createBackground();
    
    // Create platforms from level config
    this.createPlatforms();
    
    // Create hazards
    this.createHazards();
    
    // Create ingredients to collect
    this.createIngredients();
    
    // Create player
    this.createPlayer();
    
    // Setup camera to follow player with smooth scrolling
    if (this.player) {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this.cameras.main.setDeadzone(200, 100);
    }
    
    // Create ice cream collectible
    this.createIceCream();
    
    // Setup input
    this.setupInput();
    
    // Setup UI
    this.createUI();
    
    // Setup collisions
    this.setupCollisions();
    
    // Start timer
    this.startTimer();
    
    // Set game state to playing
    this.gameState = GameState.PLAYING;
    this.startTime = Date.now();
  }

  /**
   * Create gradient background or custom image
   */
  private createBackground() {
    const worldWidth = (this.levelConfig as any)?.worldWidth || GAME_WIDTH * 2;
    
    // Use custom background if provided
    if (this.assets?.backgroundUrl && this.textures.exists('background_custom')) {
      // Get the texture to check its size
      const texture = this.textures.get('background_custom');
      const bgWidth = texture.getSourceImage().width;
      const bgHeight = texture.getSourceImage().height;
      
      // If background matches world width, use it as-is
      if (bgWidth === worldWidth) {
        const bg = this.add.image(worldWidth / 2, GAME_HEIGHT / 2, 'background_custom');
        bg.setDisplaySize(worldWidth, GAME_HEIGHT);
        bg.setDepth(-1);
      } else {
        // Otherwise, tile the background across the world
        const bg = this.add.tileSprite(0, 0, worldWidth, GAME_HEIGHT, 'background_custom');
        bg.setOrigin(0, 0);
        bg.setDepth(-1);
      }
      return;
    }
    
    // Default gradient background - full world width
    const graphics = this.add.graphics();
    
    // Sky gradient across full world
    for (let y = 0; y < GAME_HEIGHT; y++) {
      const alpha = y / GAME_HEIGHT;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x87CEEB),
        Phaser.Display.Color.ValueToColor(0x4A90E2),
        100,
        alpha * 100
      );
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillRect(0, y, worldWidth, 1);
    }
  }

  /**
   * Create hazards (spikes, lava, etc.)
   */
  private createHazards() {
    this.hazards = this.physics.add.staticGroup();
    
    // Use hazard positions from level config if available
    const hazardPositions = (this.levelConfig as any)?.hazards || [
      { x: 450, y: 530 },
      { x: 900, y: 530 },
    ];
    
    hazardPositions.forEach((pos: any) => {
      // Use custom sprite if available
      if (this.assets?.hazardSpriteUrl && this.textures.exists('hazard_custom')) {
        const hazard = this.add.image(pos.x, pos.y, 'hazard_custom');
        this.hazards!.add(hazard);
      } else {
        // Create default hazard (red spike)
        const graphics = this.add.graphics();
        graphics.fillStyle(0xFF0000, 1);
        graphics.fillTriangle(0, 20, 10, 0, 20, 20);
        graphics.generateTexture(`hazard_${pos.x}_${pos.y}`, 20, 20);
        graphics.destroy();
        
        const hazard = this.add.image(pos.x, pos.y, `hazard_${pos.x}_${pos.y}`);
        this.hazards!.add(hazard);
      }
    });
    
    this.hazards.refresh();
  }

  /**
   * Create ingredients to collect
   */
  private createIngredients() {
    this.ingredients = this.physics.add.group({
      allowGravity: false, // Disable gravity for all ingredients in group
    });
    
    // Use ingredient positions from level config if available
    const ingredientPositions = (this.levelConfig as any)?.ingredients || [
      { x: 250, y: 300 },
      { x: 600, y: 250 },
      { x: 1000, y: 300 },
    ];
    
    this.totalIngredients = ingredientPositions.length;
    
    ingredientPositions.forEach((pos: any, index: number) => {
      // Use custom sprite if available
      if (this.assets?.ingredientSpriteUrl && this.textures.exists('ingredient_custom')) {
        const ingredient = this.physics.add.sprite(pos.x, pos.y, 'ingredient_custom');
        ingredient.setDepth(LAYERS.COLLECTIBLES);
        
        // Add floating animation (up and down)
        this.tweens.add({
          targets: ingredient,
          y: pos.y - 10,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        
        this.ingredients!.add(ingredient);
      } else {
        // Create default ingredient sprite - simple circle without border
        const color = [0xFFD700, 0x8B4513, 0xFF69B4][index % 3];
        const graphics = this.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(12, 12, 12);
        // Add subtle highlight
        graphics.fillStyle(0xFFFFFF, 0.4);
        graphics.fillCircle(8, 8, 4);
        graphics.generateTexture(`ingredient_${index}`, 24, 24);
        graphics.destroy();
        
        const ingredient = this.physics.add.sprite(pos.x, pos.y, `ingredient_${index}`);
        ingredient.setDepth(LAYERS.COLLECTIBLES);
        
        // Add floating animation (up and down)
        this.tweens.add({
          targets: ingredient,
          y: pos.y - 10,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        
        this.ingredients!.add(ingredient);
      }
    });
  }

  /**
   * Create platforms from level configuration
   */
  private createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    
    if (!this.levelConfig) return;
    
    // Find highest platform for bridge sprite
    const highestY = Math.min(...this.levelConfig.platforms.map(p => p.y));
    
    // Available platform sprite types
    const platformSprites = [
      this.textures.exists('platform_wood') ? 'platform_wood' : null,
      this.textures.exists('platform_stone') ? 'platform_stone' : null,
      this.textures.exists('platform_ice') ? 'platform_ice' : null,
    ].filter(Boolean);
    
    const hasBridge = this.textures.exists('platform_bridge');
    
    // Create platforms from config with variety
    this.levelConfig.platforms.forEach((platform, index) => {
      const isHighest = platform.y === highestY;
      
      // Use bridge for highest platform if available
      if (isHighest && hasBridge) {
        this.createPlatformSprite(platform, 'platform_bridge');
        return;
      }
      
      // Use new platform sprites if available
      if (platformSprites.length > 0) {
        // Randomize platform type for variety
        const spriteKey = platformSprites[index % platformSprites.length];
        this.createPlatformSprite(platform, spriteKey!);
        return;
      }
      
      // Fallback to legacy single platform texture
      if (this.assets?.platformSpriteUrl && this.textures.exists('platform_custom')) {
        const sprite = this.add.tileSprite(
          platform.x + platform.width / 2,
          platform.y + platform.height / 2,
          platform.width,
          platform.height,
          'platform_custom'
        );
        this.platforms!.add(sprite);
        return;
      }
      
      // Default platform - brown rectangle (no sprites uploaded)
      const rect = this.add.rectangle(
        platform.x + platform.width / 2,
        platform.y + platform.height / 2,
        platform.width,
        platform.height,
        0x8B4513
      );
      rect.setOrigin(0.5, 0.5);
      this.platforms!.add(rect);
    });
    
    // Refresh static body bounds
    this.platforms.refresh();
  }
  
  private createPlatformSprite(platform: any, spriteKey: string) {
    // Platform sprites are 60x20px with 3 sections of 20x20px each
    // Structure: [left 20px][center 20px][right 20px]
    const SECTION_SIZE = 20;
    
    const platformWidth = platform.width;
    const platformHeight = platform.height;
    
    // For very small platforms, just use a scaled version
    if (platformWidth < 40) {
      const sprite = this.add.image(
        platform.x + platformWidth / 2,
        platform.y + platformHeight / 2,
        spriteKey
      );
      sprite.setDisplaySize(platformWidth, platformHeight);
      this.platforms!.add(sprite);
      return;
    }
    
    // Left section (0-20px of sprite)
    const left = this.add.image(
      platform.x + SECTION_SIZE / 2,
      platform.y + platformHeight / 2,
      spriteKey
    );
    left.setCrop(0, 0, SECTION_SIZE, SECTION_SIZE);
    left.setDisplaySize(SECTION_SIZE, platformHeight);
    this.platforms!.add(left);
    
    // Center section - repeat the middle 20px
    const centerWidth = platformWidth - (SECTION_SIZE * 2);
    let currentX = platform.x + SECTION_SIZE;
    
    while (currentX < platform.x + platformWidth - SECTION_SIZE) {
      const remainingWidth = (platform.x + platformWidth - SECTION_SIZE) - currentX;
      const thisWidth = Math.min(SECTION_SIZE, remainingWidth);
      
      const center = this.add.image(
        currentX + thisWidth / 2,
        platform.y + platformHeight / 2,
        spriteKey
      );
      center.setCrop(SECTION_SIZE, 0, thisWidth, SECTION_SIZE);
      center.setDisplaySize(thisWidth, platformHeight);
      this.platforms!.add(center);
      
      currentX += thisWidth;
    }
    
    // Right section (40-60px of sprite)
    const right = this.add.image(
      platform.x + platformWidth - SECTION_SIZE / 2,
      platform.y + platformHeight / 2,
      spriteKey
    );
    right.setCrop(SECTION_SIZE * 2, 0, SECTION_SIZE, SECTION_SIZE);
    right.setDisplaySize(SECTION_SIZE, platformHeight);
    this.platforms!.add(right);
  }

  /**
   * Create player character
   */
  private createPlayer() {
    const spawnPoint = this.levelConfig?.spawnPoint || { x: 100, y: 450 };
    
    // Use walking sprite if configured
    if (this.spriteConfig && this.textures.exists('player_idle')) {
      this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player_idle');
      
      // Create walk animation
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player_walk', { 
          start: 0, 
          end: this.spriteConfig.walkFrameCount - 1 
        }),
        frameRate: this.spriteConfig.walkFrameRate,
        repeat: -1,
      });
    } else if (this.assets?.playerSpriteUrl && this.textures.exists('player_custom')) {
      // Use custom sprite if available (legacy)
      this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player_custom');
    } else {
      // Create default player as a simple rectangle
      const playerGraphics = this.add.graphics();
      playerGraphics.fillStyle(COLORS.PLAYER, 1);
      playerGraphics.fillRect(0, 0, 32, 48);
      playerGraphics.generateTexture('player', 32, 48);
      playerGraphics.destroy();
      
      this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player');
    }
    
    // Don't collide with world bounds - let player fall off
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(LAYERS.PLAYER);
    this.player.body!.setSize(32, 48);
    this.player.setBounce(0);
  }

  /**
   * Create ice cream collectible
   */
  private createIceCream() {
    if (!this.levelConfig || !this.levelConfig.iceCreams.length) return;
    
    // Get first ice cream position
    const iceCreamPos = this.levelConfig.iceCreams[0];
    
    // Use custom sprite if available
    if (this.assets?.icecreamSpriteUrl && this.textures.exists('icecream_custom')) {
      this.iceCream = this.physics.add.sprite(iceCreamPos.x, iceCreamPos.y, 'icecream_custom');
      this.iceCream.setAlpha(0.5); // Locked appearance
    } else {
      // Create default ice cream as a simple circle
      const iceCreamGraphics = this.add.graphics();
      iceCreamGraphics.fillStyle(COLORS.ICE_CREAM, 1);
      iceCreamGraphics.fillCircle(16, 16, 16);
      // Add cone
      iceCreamGraphics.fillStyle(0xD2691E, 1);
      iceCreamGraphics.fillTriangle(8, 16, 24, 16, 16, 32);
      // Add locked overlay initially
      iceCreamGraphics.fillStyle(0x000000, 0.5);
      iceCreamGraphics.fillCircle(16, 16, 16);
      iceCreamGraphics.generateTexture('icecream_locked', 32, 32);
      
      // Create unlocked version
      const unlockedGraphics = this.add.graphics();
      unlockedGraphics.fillStyle(COLORS.ICE_CREAM, 1);
      unlockedGraphics.fillCircle(16, 16, 16);
      unlockedGraphics.fillStyle(0xD2691E, 1);
      unlockedGraphics.fillTriangle(8, 16, 24, 16, 16, 32);
      // Add shine
      unlockedGraphics.fillStyle(0xFFFFFF, 0.6);
      unlockedGraphics.fillCircle(12, 12, 6);
      unlockedGraphics.generateTexture('icecream', 32, 32);
      unlockedGraphics.destroy();
      iceCreamGraphics.destroy();
      
      this.iceCream = this.physics.add.sprite(iceCreamPos.x, iceCreamPos.y, 'icecream_locked');
    }
    
    this.iceCream.setDepth(LAYERS.COLLECTIBLES);
    (this.iceCream.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    
    // Add floating animation
    this.tweens.add({
      targets: this.iceCream,
      y: iceCreamPos.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Setup keyboard input
   */
  private setupInput() {
    // Arrow keys
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // WASD keys
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  /**
   * Public method to set mobile input from external controls
   */
  public setMobileInput(input: { move?: 'left' | 'right' | 'stop'; jump?: boolean }) {
    if (input.move !== undefined) {
      this.mobileInput.move = input.move;
    }
    if (input.jump !== undefined) {
      this.mobileInput.jump = input.jump;
      // Reset jump after a frame
      setTimeout(() => {
        this.mobileInput.jump = false;
      }, 100);
    }
  }

  /**
   * Create UI elements
   */
  private createUI() {
    // Timer display - fixed to camera
    this.timerText = this.add.text(GAME_WIDTH - 10, 10, `Time: ${this.timerDuration}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.timerText.setOrigin(1, 0);
    this.timerText.setDepth(LAYERS.UI);
    this.timerText.setScrollFactor(0); // Fixed to camera
    
    // Ingredients counter - fixed to camera
    this.scoreText = this.add.text(10, 10, `Ingredients: 0/${this.totalIngredients}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setOrigin(0, 0);
    this.scoreText.setDepth(LAYERS.UI);
    this.scoreText.setScrollFactor(0); // Fixed to camera
  }

  /**
   * Setup physics collisions
   */
  private setupCollisions() {
    if (!this.player || !this.platforms) return;
    
    // Player collides with platforms
    this.physics.add.collider(this.player, this.platforms);
    
    // Player collects ingredients
    if (this.ingredients) {
      this.physics.add.overlap(
        this.player,
        this.ingredients,
        this.collectIngredient,
        undefined,
        this
      );
    }
    
    // Player touches hazards (game over)
    if (this.hazards) {
      this.physics.add.overlap(
        this.player,
        this.hazards,
        this.hitHazard,
        undefined,
        this
      );
    }
    
    // Player overlaps with ice cream (only if all ingredients collected)
    if (this.iceCream) {
      this.physics.add.overlap(
        this.player,
        this.iceCream,
        this.collectIceCream,
        undefined,
        this
      );
    }
  }

  /**
   * Handle ingredient collection
   */
  private collectIngredient(player: any, ingredient: any) {
    if (this.gameState !== GameState.PLAYING) return;
    
    // Prevent multiple collections of same ingredient
    if (!ingredient.active) return;
    
    // Disable ingredient immediately to prevent multiple collections
    ingredient.disableBody(true, false);
    
    // Remove ingredient with animation
    this.tweens.add({
      targets: ingredient,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        ingredient.destroy();
      }
    });
    
    // Increment counter
    this.ingredientsCollected++;
    
    // Update UI
    if (this.scoreText) {
      this.scoreText.setText(`Ingredients: ${this.ingredientsCollected}/${this.totalIngredients}`);
    }
    
    // Check if all ingredients collected
    if (this.ingredientsCollected >= this.totalIngredients && this.iceCream) {
      // Unlock ice cream
      if (this.assets?.icecreamSpriteUrl && this.textures.exists('icecream_custom')) {
        this.iceCream.setAlpha(1); // Full opacity when unlocked
      } else {
        this.iceCream.setTexture('icecream');
      }
      
      // Add pulsing glow effect
      this.tweens.add({
        targets: this.iceCream,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Handle hazard collision
   */
  private hitHazard() {
    if (this.gameState !== GameState.PLAYING) return;
    
    // Flash player red
    if (this.player) {
      this.player.setTint(0xFF0000);
      this.time.delayedCall(200, () => {
        this.player?.clearTint();
      });
    }
    
    // End game
    this.endGame(false, 'hazard');
  }

  /**
   * Handle ice cream collection
   */
  private collectIceCream(player: any, iceCream: any) {
    if (this.gameState !== GameState.PLAYING) return;
    
    // Only allow collection if all ingredients collected
    if (this.ingredientsCollected < this.totalIngredients) {
      return;
    }
    
    // Prevent multiple collections
    if (!iceCream.active) return;
    
    // Disable ice cream immediately
    iceCream.disableBody(true, true);
    
    // Calculate score based on remaining time and ingredients
    // Formula: 1000 base + (remaining_time * 10) + (ingredients * 50)
    this.score = 1000 + (this.timeRemaining * 10) + (this.ingredientsCollected * 50);
    
    // End game successfully
    this.endGame(true);
  }

  /**
   * Start countdown timer
   */
  private startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000, // 1 second
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Update timer each second
   */
  private updateTimer() {
    if (this.gameState !== GameState.PLAYING) return;
    
    this.timeRemaining--;
    
    if (this.timerText) {
      this.timerText.setText(`Time: ${this.timeRemaining}`);
    }
    
    // Check if time is up
    if (this.timeRemaining <= 0) {
      this.endGame(false, 'timeout');
    }
  }

  /**
   * End game and emit results
   */
  private endGame(completed: boolean, reason?: 'timeout' | 'fell' | 'hazard') {
    console.log('=== GameScene.endGame called ===');
    console.log('Completed:', completed);
    console.log('Reason:', reason);
    console.log('Current game state:', this.gameState);
    
    // Prevent multiple calls
    if (this.gameState === GameState.COMPLETED || this.gameState === GameState.GAME_OVER) {
      console.log('Game already ended, skipping');
      return;
    }
    
    this.gameState = completed ? GameState.COMPLETED : GameState.GAME_OVER;
    console.log('New game state:', this.gameState);
    
    // Stop timer
    this.timerEvent?.remove();
    
    // Stop player movement
    if (this.player) {
      this.player.setVelocity(0, 0);
      (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }
    
    // Calculate completion time
    const completionTime = Math.floor((Date.now() - this.startTime) / 1000);
    console.log('Completion time:', completionTime);
    
    // Show score
    if (this.scoreText) {
      if (completed) {
        this.scoreText.setText(`Score: ${this.score}\nTime: ${completionTime}s`);
      } else if (reason === 'timeout') {
        this.scoreText.setText('Time\'s Up!\nTry Again');
      } else {
        this.scoreText.setText('Oops!\nYou Died');
      }
      this.scoreText.setVisible(true);
    }
    
    const result = {
      completed,
      score: this.score,
      completionTime,
      sessionId: this.sessionId,
      reason: reason || (completed ? undefined : 'timeout'),
    };
    
    console.log('Emitting gameEnd event with result:', result);
    console.log('Event listeners count:', this.events.listenerCount('gameEnd'));
    
    // Emit game end event to React
    this.events.emit('gameEnd', result);
    
    console.log('gameEnd event emitted');
  }

  /**
   * Update loop - called every frame
   */
  update() {
    if (this.gameState !== GameState.PLAYING || !this.player) return;
    
    // Handle player movement
    this.handlePlayerMovement();
    
    // Check if player fell off the world
    // Lowest platform is at y=445, so if player is 80px below that, they fell
    if (this.player.y > 525) {
      this.endGame(false, 'fell');
    }
  }

  /**
   * Handle player movement input
   */
  private handlePlayerMovement() {
    if (!this.player || !this.cursors || !this.wasdKeys) return;
    
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const isOnGround = body.touching.down || body.blocked.down;
    
    // Horizontal movement - check keyboard OR mobile input
    const moveLeft = this.cursors.left.isDown || this.wasdKeys.A.isDown || this.mobileInput.move === 'left';
    const moveRight = this.cursors.right.isDown || this.wasdKeys.D.isDown || this.mobileInput.move === 'right';
    
    if (moveLeft) {
      body.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
      
      // Play walk animation if using sprite config
      if (this.spriteConfig && isOnGround && this.player.anims) {
        this.player.anims.play('walk', true);
      }
    } else if (moveRight) {
      body.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
      
      // Play walk animation if using sprite config
      if (this.spriteConfig && isOnGround && this.player.anims) {
        this.player.anims.play('walk', true);
      }
    } else {
      // Decelerate when no input
      body.setVelocityX(body.velocity.x * 0.8);
      if (Math.abs(body.velocity.x) < 10) {
        body.setVelocityX(0);
      }
      
      // Stop walk animation and show idle
      if (this.spriteConfig && isOnGround && this.player.anims) {
        this.player.anims.stop();
        this.player.setTexture('player_idle');
      }
    }
    
    // Handle jump state and sprite switching
    if (!isOnGround) {
      // In air - use jump sprite
      if (this.spriteConfig && this.textures.exists('player_jump')) {
        if (this.player.texture.key !== 'player_jump') {
          this.player.anims?.stop();
          this.player.setTexture('player_jump');
        }
      } else if (this.assets?.playerJumpSpriteUrl && this.textures.exists('player_jump_custom')) {
        if (this.player.texture.key !== 'player_jump_custom') {
          this.player.setTexture('player_jump_custom');
        }
      }
    } else {
      // On ground - use idle/walk sprite
      if (this.spriteConfig) {
        // Animation handled above based on movement
      } else if (this.assets?.playerSpriteUrl && this.textures.exists('player_custom')) {
        if (this.player.texture.key !== 'player_custom') {
          this.player.setTexture('player_custom');
        }
      }
    }
    
    // Jump - check keyboard OR mobile input
    if (
      (this.cursors.up.isDown || this.wasdKeys.W.isDown || this.cursors.space.isDown || this.mobileInput.jump) &&
      isOnGround
    ) {
      body.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  /**
   * Cleanup when scene is destroyed
   */
  shutdown() {
    this.timerEvent?.remove();
    this.events.removeAllListeners();
  }
}
