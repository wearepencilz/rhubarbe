/**
 * Walking sprite types for game characters
 */

export interface WalkingSprite {
  id: string;
  name: string;
  description?: string;
  
  // Sprite assets
  idle_sprite_url: string;
  walk_sprite_url: string;
  jump_sprite_url: string;
  
  // Sprite configuration
  frame_width: number;
  frame_height: number;
  walk_frame_count: number;
  walk_frame_rate: number;
  
  // Optional metadata
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface SpriteFormData {
  name: string;
  description?: string;
  idle_sprite_url: string;
  walk_sprite_url: string;
  jump_sprite_url: string;
  frame_width: number;
  frame_height: number;
  walk_frame_count: number;
  walk_frame_rate: number;
}
