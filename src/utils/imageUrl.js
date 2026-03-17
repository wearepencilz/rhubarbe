import { API_URL } from '../config'

/**
 * Converts a relative image path to an absolute URL
 * In development: /uploads/image.jpg -> http://localhost:3001/uploads/image.jpg
 * In production: /uploads/image.jpg -> /uploads/image.jpg (same origin)
 */
export const getImageUrl = (path) => {
  if (!path) return ''
  
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // If it's a relative path starting with /, prepend API_URL in development
  if (path.startsWith('/')) {
    return API_URL ? `${API_URL}${path}` : path
  }
  
  return path
}
