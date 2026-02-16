# OpenClaw Installation Guide

**Version:** 2026.2.15
**Repository:** https://github.com/nicholasreese/opencraw
**Documentation:** https://docs.openclaw.ai

---

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Prerequisites](#prerequisites)
4. [Installation Methods](#installation-methods)
   - [Method 1: NPM/PNPM Global Install (Recommended)](#method-1-npmpnpm-global-install-recommended)
   - [Method 2: From Source](#method-2-from-source)
   - [Method 3: Docker](#method-3-docker)
5. [Initial Configuration](#initial-configuration)
6. [Security Setup](#security-setup)
7. [Channel Configuration](#channel-configuration)
8. [Verification & Testing](#verification--testing)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Configuration](#advanced-configuration)
11. [Updating OpenClaw](#updating-openclaw)

---

## Overview

**OpenClaw** is a personal AI assistant gateway that routes messages through multiple channels (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, Matrix, Zalo, and WebChat). It provides a secure, locally-controlled interface to AI models from Anthropic (Claude) and OpenAI (GPT).

This installation guide covers setup, configuration, and security hardening for the OpenClaw platform.

---

## System Requirements

### Minimum Requirements

- **CPU:** 2+ cores (4+ recommended for optimal performance)
- **RAM:** 4GB minimum (8GB+ recommended)
- **Storage:** 2GB free disk space (10GB+ for development builds)
- **Network:** Stable internet connection for AI model API calls

### Operating System Support

| OS                   | Support Level      | Notes                                       |
| -------------------- | ------------------ | ------------------------------------------- |
| **macOS**            | ✅ Fully Supported | 10.15+ (Catalina or later)                  |
| **Linux**            | ✅ Fully Supported | Ubuntu 20.04+, Debian 11+, Fedora 35+, Arch |
| **Windows (WSL2)**   | ✅ Recommended     | Native Windows support experimental         |
| **Windows (Native)** | ⚠️ Experimental    | Use WSL2 for best experience                |
| **Docker**           | ✅ Fully Supported | Any Docker-compatible host                  |

---

## Prerequisites

### 1. Node.js Installation

**Required Version:** Node.js ≥ 22.12.0

#### macOS (Homebrew)

```bash
# Install via Homebrew
brew install node@22

# Verify installation
node --version  # Should show v22.12.0 or higher
```

#### Linux (NodeSource)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
```

#### Windows (WSL2)

```bash
# Inside WSL2 Ubuntu
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Alternative: Node Version Manager (nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 22
nvm install 22
nvm use 22
nvm alias default 22
```

### 2. Package Manager

**Recommended:** pnpm 10.23.0+

```bash
# Install pnpm globally
npm install -g pnpm@10.23.0

# Verify installation
pnpm --version
```

**Alternative:** npm (comes with Node.js) or Bun

```bash
# npm is already installed with Node.js
npm --version

# Bun (optional, experimental)
curl -fsSL https://bun.sh/install | bash
```

### 3. Git (for source installation)

```bash
# macOS (via Xcode Command Line Tools)
xcode-select --install

# Linux
sudo apt-get install git        # Ubuntu/Debian
sudo dnf install git            # Fedora
sudo pacman -S git              # Arch

# Verify
git --version
```

### 4. AI Model Credentials

You'll need credentials for at least one AI provider:

- **Anthropic Claude** (Recommended): API key or OAuth subscription (Claude Pro/Max)
- **OpenAI GPT**: API key or OAuth subscription (ChatGPT Plus)

Get credentials:

- Anthropic: https://console.anthropic.com/settings/keys
- OpenAI: https://platform.openai.com/api-keys

---

## Installation Methods

### Method 1: NPM/PNPM Global Install (Recommended)

This is the simplest method for most users.

#### Step 1: Install OpenClaw Globally

```bash
# Using pnpm (recommended)
pnpm add -g openclaw@latest

# OR using npm
npm install -g openclaw@latest

# Verify installation
openclaw --version
```

#### Step 2: Run Onboarding Wizard

```bash
# Launch interactive setup wizard
openclaw onboard --install-daemon

# Follow the prompts to configure:
# - Gateway settings (port, host, logging)
# - AI model credentials (Anthropic/OpenAI)
# - Messaging channels (WhatsApp, Telegram, etc.)
# - Security settings (DM policies, rate limiting)
```

The `--install-daemon` flag automatically installs the gateway as a system service:

- **macOS**: launchd user service
- **Linux**: systemd user service

#### Step 3: Start the Gateway

```bash
# If daemon installed (recommended)
openclaw gateway start

# OR run in foreground with verbose logging
openclaw gateway --port 18789 --verbose
```

---

### Method 2: From Source

For development or advanced users who want to customize the codebase.

#### Step 1: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/nicholasreese/opencraw.git
cd opencraw
```

#### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This will install:
# - Core openclaw dependencies
# - UI dependencies (Lit + Vite)
# - Extension dependencies (36+ channel packages)
# - Skill dependencies (48+ tool packages)
```

#### Step 3: Build the Project

```bash
# Build UI components
pnpm ui:build

# Build complete project (TypeScript → JavaScript)
pnpm build

# This generates:
# - dist/ (compiled JavaScript)
# - openclaw.mjs (CLI entry point)
# - dist/plugin-sdk/ (plugin type definitions)
```

#### Step 4: Run Tests (Optional)

```bash
# Run full test suite
pnpm test

# Expected output:
# ✓ 5,083 tests passing (713 test files)
# ✓ All security validations passing
```

#### Step 5: Configure and Start

```bash
# Run onboarding wizard
pnpm openclaw onboard --install-daemon

# Start gateway
pnpm openclaw gateway --port 18789
```

#### Step 6: Development Mode (Auto-reload)

```bash
# Gateway with auto-reload on file changes
pnpm gateway:watch

# Full OpenClaw in dev mode
pnpm dev
```

---

### Method 3: Docker

Run OpenClaw in an isolated container environment.

#### Step 1: Pull Docker Image

```bash
# Pull latest stable image
docker pull openclaw/openclaw:latest

# OR build from source
git clone https://github.com/nicholasreese/opencraw.git
cd opencraw
docker build -t openclaw:local .
```

#### Step 2: Create Configuration Directory

```bash
# Create persistent config directory
mkdir -p ~/.openclaw
```

#### Step 3: Run Container

```bash
# Run with mounted config volume
docker run -d \
  --name openclaw \
  -p 18789:18789 \
  -v ~/.openclaw:/root/.openclaw \
  -e ANTHROPIC_API_KEY="your-api-key-here" \
  openclaw/openclaw:latest

# View logs
docker logs -f openclaw
```

#### Step 4: Access Shell for Configuration

```bash
# Open shell in running container
docker exec -it openclaw /bin/bash

# Run onboarding wizard inside container
openclaw onboard
```

---

## Initial Configuration

### 1. Configuration File Location

OpenClaw stores configuration in: `~/.openclaw/config.json5`

The configuration uses **JSON5 format** (allows comments and trailing commas).

### 2. Basic Configuration Structure

```json5
{
  // Gateway Settings
  gateway: {
    port: 18789,
    host: "127.0.0.1", // SECURITY: Bind to localhost only
    verbose: true,
    logLevel: "info",
  },

  // AI Model Configuration
  agents: {
    defaultModel: "claude-opus-4.5",
    concurrency: 3,
    timeout: 300000, // 5 minutes

    authProfiles: [
      {
        provider: "anthropic",
        apiKey: "${ANTHROPIC_API_KEY}", // Use env var
        models: ["claude-opus-4.5", "claude-sonnet-4.5"],
      },
    ],
  },

  // Security Settings
  security: {
    rateLimiting: {
      maxAttempts: 5,
      windowMs: 60000, // 1 minute
      lockoutMs: 900000, // 15 minutes
    },

    // Default DM policy: "pairing" (recommended) or "open"
    defaultDmPolicy: "pairing",
  },

  // Channel Configurations
  channels: {
    telegram: {
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: "pairing",
    },

    slack: {
      enabled: false,
      botToken: "${SLACK_BOT_TOKEN}",
      appToken: "${SLACK_APP_TOKEN}",
    },
  },
}
```

### 3. Environment Variables

**Recommended:** Store sensitive credentials in `.env` file

Create `~/.openclaw/.env`:

```bash
# AI Model API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...

# Channel Credentials
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...

# Webhook Secrets (MUST be 32+ characters, high entropy)
# Generate with: openssl rand -base64 32
TELEGRAM_WEBHOOK_SECRET=...
GITHUB_WEBHOOK_SECRET=...
```

**SECURITY:** Set proper file permissions:

```bash
chmod 600 ~/.openclaw/.env
chmod 600 ~/.openclaw/config.json5
```

### 4. Validate Configuration

```bash
# Run configuration doctor
openclaw doctor

# This checks for:
# - Missing required credentials
# - Risky DM policies (dmPolicy="open")
# - Weak webhook secrets
# - Overly permissive file permissions
# - Port conflicts
```

---

## Security Setup

OpenClaw includes comprehensive security features (see `SECURITY_FIXES.md` for details).

### 1. Authentication Rate Limiting

**Default Configuration:**

- Maximum 5 failed authentication attempts per minute per IP
- 15-minute lockout after exceeding limit
- Localhost (127.0.0.1) exempt from rate limiting

```json5
{
  security: {
    rateLimiting: {
      maxAttempts: 5, // Max attempts per window
      windowMs: 60000, // 1 minute window
      lockoutMs: 900000, // 15 minute lockout
      exemptLoopback: true, // Exempt 127.0.0.1
    },
  },
}
```

### 2. HTTPS/TLS Configuration

**For Production:** Always use HTTPS when exposing the gateway externally.

```json5
{
  gateway: {
    port: 18789,
    host: "0.0.0.0", // Allow external connections
    tls: {
      enabled: true,
      certFile: "/path/to/cert.pem",
      keyFile: "/path/to/key.pem",
    },
  },
}
```

**Certificate Generation (Let's Encrypt):**

```bash
# Install certbot
sudo apt-get install certbot  # Ubuntu/Debian
brew install certbot          # macOS

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificates location: /etc/letsencrypt/live/your-domain.com/
```

### 3. Webhook Secret Configuration

**CRITICAL:** Webhook secrets must be cryptographically strong.

**Requirements:**

- Minimum 32 characters
- High entropy (≥3.5 bits per character)
- Never use dictionary words or predictable patterns

**Generate Secure Secrets:**

```bash
# Method 1: OpenSSL (recommended)
openssl rand -base64 32

# Method 2: /dev/urandom
head -c 32 /dev/urandom | base64

# Method 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example Configuration:**

```json5
{
  channels: {
    telegram: {
      enabled: true,
      webhook: {
        enabled: true,
        secret: "${TELEGRAM_WEBHOOK_SECRET}", // Must be 32+ chars
        url: "https://your-domain.com/webhook/telegram",
      },
    },
  },
}
```

### 4. Direct Message (DM) Policies

Control how the assistant handles unsolicited direct messages.

**Pairing Mode** (Default, Recommended):

```json5
{
  channels: {
    telegram: {
      dmPolicy: "pairing", // Requires explicit pairing code
    },
  },
}
```

**Open Mode** (Use with Caution):

```json5
{
  channels: {
    telegram: {
      dmPolicy: "open", // ⚠️ Responds to all DMs
      allowlist: [
        // Recommended: restrict to known users
        "@known_user1",
        "@known_user2",
      ],
    },
  },
}
```

**Check for Risky Configurations:**

```bash
openclaw doctor
# Output will warn about any channels with dmPolicy="open"
```

### 5. File Permissions

**Secure Sensitive Files:**

```bash
# Config files (owner read/write only)
chmod 600 ~/.openclaw/config.json5
chmod 600 ~/.openclaw/.env

# State directory (owner only)
chmod 700 ~/.openclaw/state/

# Exec approvals (owner read/write only)
chmod 600 ~/.openclaw/state/exec-approvals.json
```

### 6. Network Security

**Firewall Configuration:**

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 18789/tcp
sudo ufw enable

# Fedora/RHEL (firewalld)
sudo firewall-cmd --add-port=18789/tcp --permanent
sudo firewall-cmd --reload

# macOS (pf)
# Add to /etc/pf.conf:
# pass in proto tcp to port 18789
```

**Bind to Localhost Only (Development):**

```json5
{
  gateway: {
    host: "127.0.0.1", // Only accessible from local machine
    port: 18789,
  },
}
```

**External Access (Production):**

```json5
{
  gateway: {
    host: "0.0.0.0", // ⚠️ Accessible from network
    port: 18789,
    tls: {
      enabled: true, // REQUIRED for external access
    },
  },
}
```

### 7. Security Headers

OpenClaw automatically applies comprehensive security headers:

- **X-Frame-Options:** `DENY` (prevents clickjacking)
- **X-Content-Type-Options:** `nosniff` (prevents MIME sniffing)
- **X-XSS-Protection:** `1; mode=block` (legacy XSS protection)
- **Content-Security-Policy:** Restricts resource loading
- **Strict-Transport-Security:** Forces HTTPS (when TLS enabled)
- **Referrer-Policy:** `strict-origin-when-cross-origin`

No additional configuration required.

---

## Channel Configuration

### Telegram

#### Step 1: Create Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Follow prompts to get bot token: `123456:ABC-DEF...`

#### Step 2: Configure OpenClaw

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: "pairing",

      // Optional: Webhook mode (recommended for production)
      webhook: {
        enabled: true,
        url: "https://your-domain.com/webhook/telegram",
        secret: "${TELEGRAM_WEBHOOK_SECRET}", // 32+ chars
      },
    },
  },
}
```

#### Step 3: Set Webhook (if using webhook mode)

```bash
# OpenClaw will automatically set the webhook URL
# Or manually:
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://your-domain.com/webhook/telegram\", \"secret_token\": \"${TELEGRAM_WEBHOOK_SECRET}\"}"
```

### Slack

#### Step 1: Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Enable Socket Mode (for interactive features)
4. Install to workspace

#### Step 2: Get Tokens

- **Bot Token:** `xoxb-...` (OAuth & Permissions → Bot User OAuth Token)
- **App Token:** `xapp-...` (Basic Information → App-Level Tokens)

#### Step 3: Configure OpenClaw

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "${SLACK_BOT_TOKEN}",
      appToken: "${SLACK_APP_TOKEN}",
      dmPolicy: "pairing",
    },
  },
}
```

### Discord

#### Step 1: Create Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" tab → "Add Bot"
4. Copy bot token

#### Step 2: Configure OpenClaw

```json5
{
  channels: {
    discord: {
      enabled: true,
      botToken: "${DISCORD_BOT_TOKEN}",
      dmPolicy: "pairing",
    },
  },
}
```

#### Step 3: Invite Bot to Server

Generate invite URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot
```

### WhatsApp (Baileys)

**Note:** WhatsApp integration uses an unofficial library and may violate WhatsApp ToS.

```json5
{
  channels: {
    whatsapp: {
      enabled: true,
      mode: "qr", // Scan QR code for authentication
      dmPolicy: "pairing",
    },
  },
}
```

**Setup:**

```bash
# Start gateway
openclaw gateway

# QR code will be displayed in terminal
# Scan with WhatsApp mobile app: Settings → Linked Devices
```

### Additional Channels

See documentation for:

- **Signal:** https://docs.openclaw.ai/channels/signal
- **iMessage/BlueBubbles:** https://docs.openclaw.ai/channels/bluebubbles
- **Microsoft Teams:** https://docs.openclaw.ai/channels/teams
- **Google Chat:** https://docs.openclaw.ai/channels/googlechat
- **Matrix:** https://docs.openclaw.ai/channels/matrix
- **Zalo:** https://docs.openclaw.ai/channels/zalo

---

## Verification & Testing

### 1. Check Gateway Status

```bash
# Check if gateway is running
openclaw gateway status

# View logs
openclaw gateway logs

# Test connection
curl http://127.0.0.1:18789/health
# Expected: {"status":"ok"}
```

### 2. Send Test Message

```bash
# Send via CLI
openclaw message send --to "@telegram_username" --message "Hello from OpenClaw"

# Or use agent command
openclaw agent --message "What's the weather today?" --thinking high
```

### 3. Verify Channel Connections

```bash
# List active channels
openclaw channels list

# Expected output:
# ✓ telegram (connected)
# ✓ slack (connected)
# ✗ discord (not configured)
```

### 4. Run Security Audit

```bash
# Run comprehensive security check
openclaw doctor

# This validates:
# ✓ No risky DM policies
# ✓ Strong webhook secrets
# ✓ Proper file permissions
# ✓ Rate limiting enabled
# ✓ No port conflicts
```

### 5. Test AI Integration

```bash
# Quick AI model test
openclaw agent --message "Count to 5" --model claude-sonnet-4.5

# Expected output:
# 1
# 2
# 3
# 4
# 5
```

---

## Troubleshooting

### Common Issues

#### 1. "openclaw: command not found"

**Cause:** Global package not in PATH

**Solution:**

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(npm config get prefix)/bin"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

#### 2. "Port 18789 already in use"

**Cause:** Another process using the port

**Solution:**

```bash
# Find process using port
lsof -i :18789
# OR
netstat -tulpn | grep 18789

# Kill process
kill -9 <PID>

# Or use different port
openclaw gateway --port 18790
```

#### 3. "EACCES: permission denied"

**Cause:** Insufficient file permissions

**Solution:**

```bash
# Fix config directory permissions
sudo chown -R $USER ~/.openclaw
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/config.json5
```

#### 4. "Webhook secret has insufficient entropy"

**Cause:** Weak webhook secret (< 32 chars or low entropy)

**Solution:**

```bash
# Generate strong secret
openssl rand -base64 32

# Update .env file
echo "TELEGRAM_WEBHOOK_SECRET=$(openssl rand -base64 32)" >> ~/.openclaw/.env
```

#### 5. "Rate limit exceeded"

**Cause:** Too many authentication attempts

**Solution:**

```bash
# Wait for lockout period (default: 15 minutes)
# Or clear rate limit state (if localhost)
openclaw gateway reset-rate-limits
```

#### 6. "Failed to connect to AI model"

**Cause:** Invalid API key or network issue

**Solution:**

```bash
# Verify API key
echo $ANTHROPIC_API_KEY

# Test API connection
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

#### 7. "Node version too old"

**Cause:** Node.js < 22.12.0

**Solution:**

```bash
# Update Node.js using nvm
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version
```

### Debug Mode

```bash
# Run gateway with verbose logging
openclaw gateway --verbose --log-level debug

# Or set in config
{
  gateway: {
    verbose: true,
    logLevel: "debug"
  }
}
```

### Logs Location

```bash
# Gateway logs (systemd)
journalctl --user -u openclaw-gateway -f

# Gateway logs (launchd - macOS)
tail -f ~/Library/Logs/openclaw-gateway.log

# Application logs
tail -f ~/.openclaw/logs/gateway.log
```

---

## Advanced Configuration

### 1. Custom Plugin Installation

```bash
# Install plugin from npm
openclaw plugin install @openclaw/plugin-custom

# Install from local directory
openclaw plugin install ./my-plugin

# List installed plugins
openclaw plugin list
```

### 2. Memory & Embeddings

```json5
{
  memory: {
    enabled: true,
    provider: "local", // or "pinecone", "weaviate"

    local: {
      path: "~/.openclaw/memory",
      maxDocuments: 10000,
    },

    embeddings: {
      model: "text-embedding-3-small",
      provider: "openai",
      apiKey: "${OPENAI_API_KEY}",
    },
  },
}
```

### 3. Multi-Model Fallback

```json5
{
  agents: {
    authProfiles: [
      {
        provider: "anthropic",
        apiKey: "${ANTHROPIC_API_KEY}",
        models: ["claude-opus-4.5", "claude-sonnet-4.5"],
        priority: 1, // Primary
      },
      {
        provider: "openai",
        apiKey: "${OPENAI_API_KEY}",
        models: ["gpt-4o", "gpt-4o-mini"],
        priority: 2, // Fallback
      },
    ],

    fallbackStrategy: "round-robin", // or "priority"
  },
}
```

### 4. Custom Hooks

Create executable scripts in `~/.openclaw/hooks/`:

```bash
# ~/.openclaw/hooks/on-message-received.sh
#!/bin/bash

MESSAGE="$1"
CHANNEL="$2"

# Log all messages
echo "[$(date)] $CHANNEL: $MESSAGE" >> ~/.openclaw/logs/messages.log

# Send notification
if [[ "$MESSAGE" == *"urgent"* ]]; then
  notify-send "Urgent Message" "$MESSAGE"
fi
```

Make executable:

```bash
chmod +x ~/.openclaw/hooks/on-message-received.sh
```

### 5. Sandbox Configuration

```json5
{
  tools: {
    bash: {
      enabled: true,
      sandbox: {
        enabled: true,
        containerName: "openclaw-sandbox",
        workspaceDir: "/workspace",
        allowedCommands: ["git", "npm", "node", "python3"],
        blockedCommands: ["rm -rf", "dd", "mkfs"],
      },
    },
  },
}
```

---

## Updating OpenClaw

### Update via NPM/PNPM

```bash
# Update to latest stable
pnpm update -g openclaw@latest

# OR specific version
pnpm update -g openclaw@2026.2.15

# Verify update
openclaw --version
```

### Update from Source

```bash
cd opencraw

# Fetch latest changes
git pull origin main

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build

# Restart gateway
openclaw gateway restart
```

### Channel Switching

```bash
# Switch to beta channel
openclaw update --channel beta

# Switch to dev channel
openclaw update --channel dev

# Switch back to stable
openclaw update --channel stable
```

### Post-Update Validation

```bash
# Run configuration doctor
openclaw doctor

# Run tests (if from source)
pnpm test

# Check changelog
openclaw changelog
```

---

## Additional Resources

### Documentation

- **Official Docs:** https://docs.openclaw.ai
- **Getting Started:** https://docs.openclaw.ai/start/getting-started
- **Concepts:** https://docs.openclaw.ai/concepts
- **Channel Setup:** https://docs.openclaw.ai/channels
- **Security Guide:** https://docs.openclaw.ai/gateway/security
- **API Reference:** https://docs.openclaw.ai/api

### Security Documentation

- **Security Fixes Report:** [SECURITY_FIXES.md](SECURITY_FIXES.md)
- **OWASP Top 10 Compliance:** https://owasp.org/www-project-top-ten/
- **CWE Top 25:** https://cwe.mitre.org/top25/

### Community

- **GitHub Repository:** https://github.com/nicholasreese/opencraw
- **Discord:** https://discord.gg/clawd
- **DeepWiki:** https://deepwiki.com/openclaw/openclaw

### Development

- **Architecture Guide:** [CLAUDE.md](CLAUDE.md)
- **Contributing:** https://github.com/nicholasreese/opencraw/blob/main/CONTRIBUTING.md
- **Plugin SDK:** https://docs.openclaw.ai/plugins

---

## Support

### Get Help

1. Check [FAQ](https://docs.openclaw.ai/start/faq)
2. Search [GitHub Issues](https://github.com/nicholasreese/opencraw/issues)
3. Join [Discord Community](https://discord.gg/clawd)
4. Read [Troubleshooting Guide](#troubleshooting)

### Report Issues

**Security Issues:** Email security@openclaw.ai (do not open public issues)

**Bug Reports:** https://github.com/nicholasreese/opencraw/issues/new

Include:

- OpenClaw version (`openclaw --version`)
- Node.js version (`node --version`)
- Operating system
- Error logs
- Steps to reproduce

---

## License

OpenClaw is released under the **MIT License**.

See [LICENSE](LICENSE) file for details.

---

**Last Updated:** February 16, 2026
**Document Version:** 1.0
**Installation Guide for OpenClaw v2026.2.15**
