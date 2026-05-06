---
name: biome
description: Biome linter and formatter for TypeScript and JSX code quality
---

# Biome Skill

This project uses [Biome](https://biomejs.dev/) for linting and formatting the frontend codebase.

## Configuration

Located at `/frontend/biome.json`. Configured for:
- TypeScript + JSX/TSX
- React rules
- Import sorting
- Recommended style defaults

## npm Scripts

### `npm run format`
Auto-fixes formatting and linting issues.

```bash
cd frontend && npm run format
```

This runs:
```bash
biome check --write .
```

### `npm run lint`
Checks for issues without modifying files.

```bash
cd frontend && npm run lint
```

This runs:
```bash
biome check .
```

## Editor Integration

Install the Biome extension for your editor:
- **VS Code**: [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- **Other editors**: See [Biome docs](https://biomejs.dev/guides/integrate-in-editor/)

Enable format-on-save for automatic formatting.

## CI Integration

Run in CI before tests:
```bash
npm run format && npm run lint && npm run build
```

## What Biome Checks

- **Formatting**: Indentation, line length, semicolons, quotes
- **Linting**: Unused variables, missing dependencies, React hooks rules
- **Import sorting**: Alphabetical, grouped by type

## Troubleshooting

- **Formatting conflicts**: Biome replaces Prettier/ESLint—disable those if installed
- **Parse errors**: Check `biome.json` syntax
- **Rule violations**: Fix manually or use `--write` to auto-fix
