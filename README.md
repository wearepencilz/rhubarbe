# Pencilz Website

A React-based website with a simple CMS for managing projects.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the API server (in one terminal):
```bash
npm run server
```

3. Start the dev server (in another terminal):
```bash
npm run dev
```

4. Access the site:
- Website: `http://localhost:5173`
- CMS Login: `http://localhost:5173/cms/login`
- Default credentials: `admin` / `admin123`

## Important: Running Both Servers

You need BOTH servers running:
- API server (port 3001) - handles project data and image uploads
- Vite dev server (port 5173) - serves the React app

If image uploads fail, make sure the API server is running with `npm run server`.

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Design System

The CMS uses Ark UI components with an Attio-inspired design:
- Clean, modern interface with thoughtful field grouping
- Accessible components with keyboard navigation
- Collapsible sections for reduced cognitive load
- Consistent spacing and typography

Update your design tokens in `tailwind.config.js`:
- Colors: `theme.extend.colors`
- Typography: `theme.extend.fontFamily` and `theme.fontSize`
- Border radius: `theme.extend.borderRadius`

## Project Structure

- `/src/pages` - Public pages
- `/src/cms` - CMS admin interface
- `/src/components` - Reusable components
- `/src/components/ui` - Radix UI-based components
- `/public/data` - JSON data storage
- `/public/uploads` - Project images

## Features

- Simple authentication
- Project management (CRUD)
- News/blog management
- Page content editor
- Global settings management
- Responsive design ready
- Framer Motion for animations
- Tailwind CSS for styling
- Ark UI components for accessibility

