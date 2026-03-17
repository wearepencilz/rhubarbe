// API configuration for development and production
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
  ? '' // Same origin in production (Vercel)
  : 'http://localhost:3001')

