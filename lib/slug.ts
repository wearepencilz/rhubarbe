/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Hook for managing auto-generated slugs in forms
 * Returns [slug, setSlug, handleNameChange, isAutoGenerating]
 */
export function useAutoSlug(initialSlug: string = '') {
  const [slug, setSlug] = React.useState(initialSlug);
  const [isAutoGenerating, setIsAutoGenerating] = React.useState(!initialSlug);

  const handleNameChange = (name: string) => {
    if (isAutoGenerating) {
      setSlug(generateSlug(name));
    }
    return name;
  };

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    // Once manually edited, stop auto-generating
    setIsAutoGenerating(false);
  };

  return {
    slug,
    setSlug: handleSlugChange,
    handleNameChange,
    isAutoGenerating
  };
}

// For non-React contexts
export interface SlugState {
  slug: string;
  isAutoGenerating: boolean;
}

export function createSlugState(initialSlug: string = ''): SlugState {
  return {
    slug: initialSlug,
    isAutoGenerating: !initialSlug
  };
}

export function updateSlugFromName(state: SlugState, name: string): SlugState {
  if (state.isAutoGenerating) {
    return {
      ...state,
      slug: generateSlug(name)
    };
  }
  return state;
}

export function setSlugManually(state: SlugState, slug: string): SlugState {
  return {
    slug,
    isAutoGenerating: false
  };
}

// Import React for the hook
import React from 'react';
