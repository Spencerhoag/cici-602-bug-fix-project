# CICI Frontend

React + Vite frontend for the CICI AI Code Iteration Platform.

## Current State

A functional React application with:
- **Tech Stack**: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui
- **Project Management**: Create and view projects, switch between them
- **Issue Management**: Create issues with basic syntax fixing or expected output modes
- **File Browser**: VS Code-style collapsable folder tree with search and syntax highlighting
- **AI Iteration Viewer**: Display AI reasoning, diffs, runtime output, and iteration history
- **Change Review**: Accept/Deny interface for proposed changes
- **Mock Data**: Sample projects and iterations for development

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Potential Additions

### Backend Integration
- Connect to FastAPI backend (API client stub exists in `src/lib/api.ts`)
- WebSocket support for real-time iteration updates
- Environment configuration for API endpoints

### Features
- User authentication and sessions
- GitHub OAuth integration
- Real-time collaboration features
- Enhanced diff viewing (side-by-side, inline)
- Code search across projects
- Iteration rollback/replay
- Export iteration history
- Custom AI model selection
- Project templates
- Batch issue creation

### UI/UX Improvements
- Light mode support
- Customizable themes
- Keyboard shortcuts
- Drag-and-drop file upload
- Mobile responsiveness
- Accessibility improvements (ARIA labels, keyboard navigation)
- Performance optimizations for large file trees

### Developer Experience
- End-to-end testing (Playwright/Cypress)
- Component storybook
- API documentation
- Docker containerization
- CI/CD pipeline

## Project Structure

```
frontend/
├── src/
│   ├── components/   # React components
│   │   ├── ui/       # shadcn/ui base components
│   │   ├── layout/   # Header, Sidebar, FileTree
│   │   ├── project/  # Project management
│   │   ├── issue/    # Issue creation
│   │   ├── ai/       # AI iteration viewer
│   │   └── code/     # Code viewer
│   ├── lib/
│   │   ├── types.ts     # TypeScript interfaces
│   │   ├── mock-data.ts # Sample data
│   │   ├── api.ts       # Backend API client
│   │   └── utils.ts     # Utilities
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```
