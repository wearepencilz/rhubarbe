/**
 * Unit tests for extract-modifiers migration utility
 */

import { describe, it, expect } from 'vitest'
import { extractModifiers } from '@/lib/migration/extract-modifiers'

describe('extractModifiers', () => {
  it('should return empty arrays for empty offerings', () => {
    const result = extractModifiers([])
    
    expect(result.modifiers).toEqual([])
    expect(result.modifierMap.size).toBe(0)
  })
  
  it('should handle offerings without toppings', () => {
    const offerings = [
      { id: 'off-1', formatId: 'format-1' },
      { id: 'off-2', formatId: 'format-2', toppings: [] }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toEqual([])
    expect(result.modifierMap.size).toBe(0)
  })
  
  it('should extract a single topping from one offering', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].name).toBe('Sprinkles')
    expect(result.modifiers[0].slug).toBe('sprinkles')
    expect(result.modifiers[0].type).toBe('topping')
    expect(result.modifiers[0].price).toBe(50)
    expect(result.modifiers[0].status).toBe('active')
    expect(result.modifiers[0].availableForFormatIds).toEqual(['format-cup'])
    
    expect(result.modifierMap.size).toBe(1)
    expect(result.modifierMap.has('Sprinkles')).toBe(true)
    expect(result.modifierMap.get('Sprinkles')).toBe(result.modifiers[0].id)
  })
  
  it('should extract multiple unique toppings', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Sprinkles', price: 50 },
          { name: 'Hot Fudge', price: 100 }
        ]
      },
      {
        id: 'off-2',
        formatId: 'format-cone',
        toppings: [
          { name: 'Chocolate Chips', price: 75 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(3)
    expect(result.modifierMap.size).toBe(3)
    
    const names = result.modifiers.map(m => m.name)
    expect(names).toContain('Sprinkles')
    expect(names).toContain('Hot Fudge')
    expect(names).toContain('Chocolate Chips')
  })
  
  it('should deduplicate toppings with the same name', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      },
      {
        id: 'off-2',
        formatId: 'format-cone',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      },
      {
        id: 'off-3',
        formatId: 'format-pint',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].name).toBe('Sprinkles')
    expect(result.modifierMap.size).toBe(1)
  })
  
  it('should aggregate formats for duplicate toppings', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      },
      {
        id: 'off-2',
        formatId: 'format-cone',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      },
      {
        id: 'off-3',
        formatId: 'format-pint',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].availableForFormatIds).toHaveLength(3)
    expect(result.modifiers[0].availableForFormatIds).toContain('format-cup')
    expect(result.modifiers[0].availableForFormatIds).toContain('format-cone')
    expect(result.modifiers[0].availableForFormatIds).toContain('format-pint')
  })
  
  it('should default price to 0 if not specified', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Free Sprinkles' }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].price).toBe(0)
  })
  
  it('should preserve allergen information', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { 
            name: 'Peanut Butter Sauce', 
            price: 100,
            allergens: ['peanuts', 'dairy']
          }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].allergens).toEqual(['peanuts', 'dairy'])
  })
  
  it('should default allergens to empty array if not specified', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].allergens).toEqual([])
  })
  
  it('should generate proper slugs from names', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Hot Fudge Sauce', price: 100 },
          { name: 'Chocolate Chips & Nuts', price: 75 },
          { name: '  Extra Sprinkles  ', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(3)
    expect(result.modifiers[0].slug).toBe('hot-fudge-sauce')
    expect(result.modifiers[1].slug).toBe('chocolate-chips-nuts')
    expect(result.modifiers[2].slug).toBe('extra-sprinkles')
  })
  
  it('should skip toppings with empty or invalid names', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Valid Topping', price: 50 },
          { name: '', price: 50 },
          { name: '   ', price: 50 },
          { price: 50 } // Missing name
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].name).toBe('Valid Topping')
  })
  
  it('should trim whitespace from topping names', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: '  Sprinkles  ', price: 50 }
        ]
      },
      {
        id: 'off-2',
        formatId: 'format-cone',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    // Should be deduplicated because trimmed names match
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].name).toBe('Sprinkles')
  })
  
  it('should set sortOrder based on extraction order', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'First', price: 50 },
          { name: 'Second', price: 50 },
          { name: 'Third', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(3)
    expect(result.modifiers[0].sortOrder).toBe(0)
    expect(result.modifiers[1].sortOrder).toBe(1)
    expect(result.modifiers[2].sortOrder).toBe(2)
  })
  
  it('should set all modifiers to active status', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Topping 1', price: 50 },
          { name: 'Topping 2', price: 75 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(2)
    expect(result.modifiers[0].status).toBe('active')
    expect(result.modifiers[1].status).toBe('active')
  })
  
  it('should set all modifiers to topping type', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Topping 1', price: 50 },
          { name: 'Topping 2', price: 75 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(2)
    expect(result.modifiers[0].type).toBe('topping')
    expect(result.modifiers[1].type).toBe('topping')
  })
  
  it('should generate unique IDs for each modifier', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Topping 1', price: 50 },
          { name: 'Topping 2', price: 75 },
          { name: 'Topping 3', price: 100 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(3)
    
    const ids = result.modifiers.map(m => m.id)
    const uniqueIds = new Set(ids)
    
    expect(uniqueIds.size).toBe(3) // All IDs should be unique
    
    // All IDs should start with 'mod-'
    ids.forEach(id => {
      expect(id).toMatch(/^mod-/)
    })
  })
  
  it('should set createdAt and updatedAt timestamps', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].createdAt).toBeDefined()
    expect(result.modifiers[0].updatedAt).toBeDefined()
    
    // Should be valid ISO 8601 timestamps
    expect(() => new Date(result.modifiers[0].createdAt)).not.toThrow()
    expect(() => new Date(result.modifiers[0].updatedAt)).not.toThrow()
  })
  
  it('should handle offerings without formatId', () => {
    const offerings = [
      {
        id: 'off-1',
        toppings: [
          { name: 'Sprinkles', price: 50 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].availableForFormatIds).toEqual([])
  })
  
  it('should handle complex real-world scenario', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Sprinkles', price: 50, allergens: [] },
          { name: 'Hot Fudge', price: 100, allergens: ['dairy'] }
        ]
      },
      {
        id: 'off-2',
        formatId: 'format-cone',
        toppings: [
          { name: 'Sprinkles', price: 50 }, // Duplicate
          { name: 'Chocolate Chips', price: 75, allergens: ['dairy'] }
        ]
      },
      {
        id: 'off-3',
        formatId: 'format-pint',
        toppings: [] // No toppings
      },
      {
        id: 'off-4',
        formatId: 'format-sandwich'
        // No toppings field
      },
      {
        id: 'off-5',
        formatId: 'format-twist',
        toppings: [
          { name: 'Hot Fudge', price: 100, allergens: ['dairy'] }, // Duplicate
          { name: 'Caramel Sauce', price: 100 }
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    // Should have 4 unique modifiers
    expect(result.modifiers).toHaveLength(4)
    expect(result.modifierMap.size).toBe(4)
    
    const names = result.modifiers.map(m => m.name).sort()
    expect(names).toEqual(['Caramel Sauce', 'Chocolate Chips', 'Hot Fudge', 'Sprinkles'])
    
    // Check Sprinkles is available for both cup and cone
    const sprinkles = result.modifiers.find(m => m.name === 'Sprinkles')
    expect(sprinkles?.availableForFormatIds).toHaveLength(2)
    expect(sprinkles?.availableForFormatIds).toContain('format-cup')
    expect(sprinkles?.availableForFormatIds).toContain('format-cone')
    
    // Check Hot Fudge is available for cup and twist
    const hotFudge = result.modifiers.find(m => m.name === 'Hot Fudge')
    expect(hotFudge?.availableForFormatIds).toHaveLength(2)
    expect(hotFudge?.availableForFormatIds).toContain('format-cup')
    expect(hotFudge?.availableForFormatIds).toContain('format-twist')
  })
  
  it('should skip toppings that produce empty slugs', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        toppings: [
          { name: 'Valid Topping', price: 50 },
          { name: '!!!', price: 50 }, // Only special characters - produces empty slug
          { name: '  !@#$  ', price: 50 }, // Only special chars and whitespace
          { name: '---', price: 50 } // Only hyphens - produces empty slug after trim
        ]
      }
    ]
    
    const result = extractModifiers(offerings as any)
    
    // Should only extract the valid topping
    expect(result.modifiers).toHaveLength(1)
    expect(result.modifiers[0].name).toBe('Valid Topping')
    expect(result.modifiers[0].slug).toBe('valid-topping')
  })
})
