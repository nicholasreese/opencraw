# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenClaw** is a personal AI assistant gateway system that runs locally and connects to multiple messaging channels (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage/BlueBubbles, Microsoft Teams, Matrix, Zalo, WebChat). It routes messages through AI agents with voice interactions, canvas rendering, and extensible tool integrations.

**Runtime:** Node.js ≥22.12.0
**Package Manager:** pnpm 10.23.0
**Language:** TypeScript 5.9 (strict mode, ESM)

## Common Commands

### Development
```bash
# Run from source (TypeScript directly via tsx)
pnpm openclaw <command>

# Start gateway in dev mode (with channel support disabled for faster startup)
pnpm gateway:dev

# Start gateway with auto-reload on file changes
pnpm gateway:watch

# Run full OpenClaw in dev mode
pnpm dev
```

### Building
```bash
# Full production build (tsdown → dist/)
pnpm build

# Build control UI (Vite/Lit app)
pnpm ui:build

# Build plugin SDK type definitions
pnpm build:plugin-sdk:dts
```

### Testing
```bash
# Run all unit tests in parallel
pnpm test

# Fast unit tests only (no e2e)
pnpm test:fast

# Watch mode for development
pnpm test:watch

# End-to-end tests
pnpm test:e2e

# Live API tests (requires real credentials)
pnpm test:live

# Generate coverage report (70% threshold)
pnpm test:coverage

# Complete test suite (lint + build + unit + e2e + live + docker)
pnpm test:all
```

### Code Quality
```bash
# Lint with oxlint (Rust-based, type-aware)
pnpm lint

# Format with oxfmt (Rust-based)
pnpm format

# Check formatting without modifying files
pnpm format:check

# Run all checks (format check + type check + lint)
pnpm check
```

### Mobile/Desktop Apps
```bash
# iOS (requires Xcode)
pnpm ios:open        # Generate and open Xcode project
pnpm ios:build       # Build iOS app
pnpm ios:run         # Build and run in simulator

# Android
pnpm android:assemble
pnpm android:install
pnpm android:run

# macOS app
pnpm mac:package     # Package macOS app bundle
pnpm mac:restart     # Restart running macOS app
```

## Architecture Overview

OpenClaw is organized into 5 layers:

### 1. CLI & UX Layer
- **`src/cli/`** - Command-line interface built with Commander.js
  - `program/build-program.ts` - CLI program construction
  - `daemon-cli.ts` - Daemon lifecycle (start/stop/restart)
  - Command implementations in `src/commands/`
- **`ui/`** - Web control UI (Lit + Vite)
- **`src/tui/`** - Terminal UI interface

### 2. Gateway Layer (WebSocket Control Plane)
- **`src/gateway/`** - Core gateway server
  - `server.ts` - Express HTTP/WebSocket server
  - `client.ts` - WebSocket client manager
  - `server-methods/` - API endpoints (send, config, talk, web, wizard)
  - `boot.ts` - Startup initialization
  - `hooks.ts` - Event hook system
- **`src/infra/`** - Infrastructure services
  - `ports.ts` - Port availability checking
  - `env.ts` - Environment normalization
  - `outbound/` - Message delivery system
  - `state-migrations.ts` - Data schema migrations

### 3. Agent & Execution Layer
- **`src/agents/`** - AI agent runtime using Pi agent (RPC mode)
  - `agent-scope.ts` - Agent execution context
  - `auth-profiles/` - LLM authentication management
  - `provider-*.ts` - LLM provider integrations (Anthropic, OpenAI, etc.)
  - `tools/` - Tool implementations (browser, nodes, discord, slack)
- **`src/providers/`** - LLM provider interfaces
- **`src/hooks/`** - Webhook/event system

### 4. Channel & Integration Layer
- **`src/channels/`** - Channel interface system
  - `registry.ts` - Channel registration
  - `channel-config.ts` - Per-channel configuration
  - Individual channels: discord, slack, telegram, signal, imessage, line, whatsapp
- **`extensions/`** - Pluggable channel extensions (36+ packages)
  - Each extension has `package.json` with `"openclaw": { "extensions": [...] }`
  - Examples: discord, telegram, msteams, bluebubbles, matrix, zalo

### 5. Core Services Layer
- **`src/config/`** - Configuration system
  - `zod-schema.ts` - Zod schema validation
  - `io.ts` - Config file I/O (JSON5 parsing)
  - `validation.ts` - Config validation with plugins
  - `legacy-migrate.ts` - Migration from old formats
- **`src/plugins/`** - Plugin system
  - `loader.ts` - Plugin module loader
  - `registry.ts` - Plugin runtime registry
  - `install.ts` - Plugin installation
- **`src/sessions/`** - Session management
- **`src/memory/`** - Memory/embeddings system
- **`src/media/`** - Image/audio/video handling

## Monorepo Structure

Workspace defined in `pnpm-workspace.yaml`:
- Root package (`openclaw`)
- `ui/` - Control UI
- `extensions/*/` - Channel extensions (36+ packages)
- `skills/*/` - Bundled CLI tools (48+ packages)
- `packages/*/` - Workspace packages (clawdbot, moltbot)

## Build System

### Bundler: tsdown
- Converts TypeScript to JavaScript in `dist/`
- Entry points: `src/index.ts`, `src/entry.ts`, `src/cli/daemon-cli.ts`
- Plugin SDK: `dist/plugin-sdk/index.js` and `dist/plugin-sdk/account-id.js`
- CLI binary: `openclaw.mjs`

### Linter & Formatter
- **oxlint**: Rust-based, type-aware linter
- **oxfmt**: Rust-based formatter
- Config: `.oxlintrc.json`

### Testing: Vitest
Multiple test configurations:
- `vitest.config.ts` - Main unit tests
- `vitest.unit.config.ts` - Fast unit tests
- `vitest.e2e.config.ts` - End-to-end tests
- `vitest.live.config.ts` - Live API tests
- `vitest.extensions.config.ts` - Extension tests
- `vitest.gateway.config.ts` - Gateway tests

Test setup in `test/setup.ts` provides isolated HOME directory and plugin cache.

Coverage: 70% lines/functions/statements, 55% branches (only `./src/**/*.ts`)

## Configuration System

User config: `~/.openclaw/config.json5` (JSON5 format)

Flow:
1. Load from `~/.openclaw/config.json5` via `src/config/io.ts`
2. Validate against Zod schema in `src/config/zod-schema.ts`
3. Type definitions in `src/config/types.ts`
4. Gateway watches for changes via chokidar (hot reload)

Config includes:
- Gateway settings (port, host, logging)
- Channel configurations (auth, DM policies, allowlists)
- Agent settings (concurrency, timeouts, model selection)
- Tool configurations and sandboxing
- Memory/embedding settings

## Key Architectural Patterns

### Plugin System
- Auto-discovery from `extensions/` and installed packages
- Each plugin declares exports in `package.json`
- Dynamic import at runtime via `src/plugins/loader.ts`
- Types exported via `openclaw/plugin-sdk`

### Session Model
- Main session: Default conversation context
- Group sessions: Isolated per channel/group
- Activation: Auto-activation, mention, or manual
- State store: `~/.openclaw/state/`

### Channel Abstraction
All channels implement `ChannelOutboundAdapter`:
- `send()` - Send message
- `getOrgMembers()` - List members (if applicable)
- `editMessage()` - Edit capability (if supported)
- `deliveryMode` - Direct/queued/webhook

### Hook System
- Global hooks: File-based hook scripts
- Plugin hooks: Registered at startup
- Event types: Message received, before/after agent, etc.
- Sandboxed execution with defined inputs/outputs

## Entry Points & Main Flows

### CLI Entry (`openclaw.mjs` → `src/index.ts`)
1. Load environment (`.env`)
2. Setup structured logging
3. Check Node.js version
4. Build Commander.js program (`src/cli/program/build-program.ts`)
5. Parse CLI arguments and dispatch

### Gateway Entry (`src/gateway/boot.ts`)
1. Load config from `~/.openclaw/config.json5`
2. Initialize subsystems (channels, plugins, agents)
3. Start WebSocket server
4. Serve control UI
5. Execute BOOT.md if present

### Agent Execution (`src/agents/agent-scope.ts`)
1. Resolve auth profile (model + credentials)
2. Build tool definitions
3. Create Pi agent runtime (RPC mode)
4. Stream messages through tool execution
5. Deliver results back to channel

## TypeScript Configuration

- **Strict mode:** Enabled
- **ES Target:** ES2023
- **Module:** ESM (NodeNext)
- **Path aliases:** `openclaw/plugin-sdk/*` → `src/plugin-sdk/*`

Main configs:
- `tsconfig.json` - Main build config
- `tsconfig.test.json` - Test configuration
- `tsconfig.plugin-sdk.dts.json` - Plugin SDK type generation
- `tsdown.config.ts` - Bundle configuration

## Security & DM Policies

Default DM behavior (configurable per channel):
- **Pairing mode** (default): Unknown senders receive pairing code, messages not processed until approved
- **Open mode**: Requires explicit opt-in (`dmPolicy="open"`)
- **Allowlist**: Per-channel sender allowlists

Run `openclaw doctor` to identify risky configurations.

Authentication:
- OAuth: Anthropic/OpenAI (subscription-based)
- API Keys: Provider-specific
- Auth profiles: Round-robin fallback between credentials

## Common Development Tasks

### Add a new CLI command
1. Create command file in `src/commands/`
2. Add to command registry in `src/cli/program/command-registry.ts`

### Add a channel integration
1. Create directory in `src/channels/` or `extensions/`
2. Implement `ChannelOutboundAdapter` interface
3. Register in `src/channels/registry.ts`

### Add a tool/skill
1. Create file in `src/agents/tools/`
2. Hook into tool registry in agent initialization

### Modify config schema
1. Edit `src/config/zod-schema.ts`
2. Update `src/config/types.ts`
3. Consider migration in `src/config/legacy-migrate.ts`

### Create an extension
1. Create directory in `extensions/<name>/`
2. Add `package.json` with `"openclaw": { "extensions": [...] }` manifest
3. Extension loads automatically at runtime

## Tech Stack

**Core:**
- Node.js 22+, TypeScript 5.9, pnpm 10.23
- CLI: Commander.js 14
- Server: Express 5, ws 8
- Agent Runtime: @mariozechner/pi-* (Anthropic's Pi agent)
- Protocol: @agentclientprotocol/sdk

**Messaging:**
- Telegram: grammY 1.40
- Discord: discord.js
- Slack: @slack/bolt 4.6
- WhatsApp: @whiskeysockets/baileys 7.0
- Signal: signal-cli (exec)
- Line: @line/bot-sdk
- Google Chat: @google-cloud/chat

**Dev Tools:**
- Testing: Vitest 4
- Linting: oxlint (Rust)
- Formatting: oxfmt (Rust)
- UI: Lit 3, Vite 7

**Optional:**
- Canvas: @napi-rs/canvas (peer)
- Local LLM: node-llama-cpp (peer)

## Documentation

- Main docs: https://docs.openclaw.ai
- Architecture: https://docs.openclaw.ai/concepts/architecture
- Getting started: https://docs.openclaw.ai/start/getting-started
- Channels: https://docs.openclaw.ai/channels
- Tools: https://docs.openclaw.ai/tools
- Security: https://docs.openclaw.ai/gateway/security
