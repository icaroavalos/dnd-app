# Project Instructions: D&D Character App

This project is a web application for creating and managing D&D 5e characters, specifically targeting the **2024 (XPHB)** ruleset. It features a modern React frontend and a NestJS backend.

## Project Overview

- **Frontend**: Vite + React 19 + TypeScript + Zustand + Tailwind CSS 3.
- **Backend**: NestJS 11 + Fastify 5 + Prisma (SQLite).
- **Data Source**: Canonical 5e rules from `5etools-v2.28.0`, compressed into `data/5etools/5e-2024/` via a custom ETL script.
- **Architecture**: Separated Frontend and Backend. The backend serves as the source of truth for rules, character projection, and persistence.

## Key Directories

- `/frontend`: React application (Vite-based).
- `/backend`: NestJS application.
- `/data/5etools/5e-2024`: Compressed rule datasets consumed by the backend.
- `/docs`: Comprehensive project documentation, including architecture and preferences.
- `/scripts`: Utility scripts, notably `build-5etools-data.mjs` for data processing.

## Building and Running

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
# Also install in subdirectories if needed, though root scripts often handle it
```

### Development
Both servers must be running for full functionality:
- **Frontend**: `npm run dev` (starts on http://localhost:3000)
- **Backend**: `npm run backend:dev` (starts on http://localhost:3100)

### Testing
- **Unified**: `npm test`
- **Backend**: `npm --prefix backend run test`
- **Typecheck**: `npm run typecheck` (frontend) and `npm run backend:typecheck`

### Production Build
- **Frontend**: `npm run build`
- **Backend**: `npm run backend:build`

## Development Conventions

### Coding Standards
- **TypeScript**: Strict mode is mandatory. Avoid `as any`.
- **Styling**: Exclusively **Tailwind CSS**. Use the `cn()` helper (`src/lib/utils.ts` in frontend) for conditional classes.
- **Icons**: Use **Lucide React**. **No emojis** in the UI or code.
- **Architecture**: Thin controllers, business logic in services.
- **Contracts**: Shared types between frontend and backend should reside in `backend/src/shared/contracts/`.

### Data Flow
1. Raw data: `5etools-v2.28.0/`
2. ETL Process: `node scripts/build-5etools-data.mjs ./5etools-v2.28.0`
3. Target: `data/5etools/5e-2024/`
4. Consumption: Backend reads these JSONs -> Frontend calls Backend APIs.

### Rule Compliance (D&D 2024)
- **Generic Choices**: Use the dynamic choice system based on text patterns.
- **Resources**: Use the Strategy Pattern for resource recovery (Short Rest vs. Long Rest).
- **HP Recalculation**: Constitution increases must retroactively update max HP.

## Documentation Reference
For deeper dives, refer to:
- `docs/AGENT_CONTEXT.md`: Best starting point for AI agents.
- `docs/architecture.md`: Detailed architectural decisions.
- `docs/preferences.md`: Specific coding and UI preferences.
- `README.md`: High-level overview and installation steps.
