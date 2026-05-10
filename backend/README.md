# D&D Backend

NestJS + Fastify backend for D&D 5e 2024 rules.

## Quick Start

```bash
npm install
npm run dev
```

Server: `http://localhost:3100`

## Documentation

- **[Architecture Guide](docs/architecture.md)** - Full backend documentation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness check |
| GET | `/rules/:catalog` | Rules data (classes, spells, items, etc.) |
| GET | `/characters` | List all characters (summary) |
| GET | `/characters/:id` | Get character by ID (full record) |
| POST | `/characters` | Create new character |
| PUT | `/characters/:id` | Update character |
| DELETE | `/characters/:id` | Delete character |
| POST | `/characters/project` | Derive character sheet |
| POST | `/actions/derive` | Get available actions |
| POST | `/resources/use` | Spend resource |
| POST | `/resources/recover` | Rest recovery |
| POST | `/inventory/spend-ammo` | Spend ammunition |
| POST | `/inventory/recover-ammo` | Recover ammunition |

## Key Directories

```
backend/
├── src/
│   ├── shared/contracts/    # Canonical types (source of truth)
│   ├── modules/             # Business logic
│   │   ├── rules/           # Rules data access
│   │   ├── characters/      # Character projection
│   │   ├── actions/         # Action derivation
│   │   ├── resources/       # Resource management
│   │   ├── inventory/       # Inventory operations
│   │   └── health/          # Health checks
│   └── config/              # Configuration
├── test/                    # Tests
└── docs/
    └── architecture.md      # This documentation
```

## Data Sources

**Rules:** `data/5etools/5e-2024/` (compacted 5etools JSON)

**Contracts:** `src/shared/contracts/` via `@shared/contracts` (TypeScript types)

## Persistence

**Prisma** is the canonical persistence layer for character state.
All character data is stored as `CharacterRecord` in the `recordJson` column.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Compile TypeScript
npm test         # Run tests
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | HTTP port |
| `LOG_LEVEL` | `info` | Log level |
| `RULES_DATA_DIR` | (auto) | Rules data path |
