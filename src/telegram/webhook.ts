import { webhookCallback } from "grammy";
import { createServer } from "node:http";
import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import { isDiagnosticsEnabled } from "../infra/diagnostic-events.js";
import { formatErrorMessage } from "../infra/errors.js";
import { installRequestBodyLimitGuard } from "../infra/http-body.js";
import {
  logWebhookError,
  logWebhookProcessed,
  logWebhookReceived,
  startDiagnosticHeartbeat,
  stopDiagnosticHeartbeat,
} from "../logging/diagnostic.js";
import { defaultRuntime } from "../runtime.js";
import { resolveTelegramAllowedUpdates } from "./allowed-updates.js";
import { withTelegramApiErrorLogging } from "./api-logging.js";
import { createTelegramBot } from "./bot.js";

const TELEGRAM_WEBHOOK_MAX_BODY_BYTES = 1024 * 1024;
const TELEGRAM_WEBHOOK_BODY_TIMEOUT_MS = 30_000;
const TELEGRAM_WEBHOOK_CALLBACK_TIMEOUT_MS = 10_000;
const MIN_WEBHOOK_SECRET_LENGTH = 32;
const MIN_WEBHOOK_SECRET_ENTROPY = 3.5; // bits per character

/**
 * SECURITY: Calculate Shannon entropy of a string to detect weak secrets.
 * Returns entropy in bits per character.
 */
function calculateEntropy(str: string): number {
  if (!str.length) {
    return 0;
  }
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return Object.values(freq).reduce((entropy, count) => {
    const p = count / str.length;
    return entropy - p * Math.log2(p);
  }, 0);
}

export async function startTelegramWebhook(opts: {
  token: string;
  accountId?: string;
  config?: OpenClawConfig;
  path?: string;
  port?: number;
  host?: string;
  secret?: string;
  runtime?: RuntimeEnv;
  fetch?: typeof fetch;
  abortSignal?: AbortSignal;
  healthPath?: string;
  publicUrl?: string;
}) {
  const path = opts.path ?? "/telegram-webhook";
  const healthPath = opts.healthPath ?? "/healthz";
  const port = opts.port ?? 8787;
  const host = opts.host ?? "127.0.0.1";
  const secret = typeof opts.secret === "string" ? opts.secret.trim() : "";

  // SECURITY: Enforce strong webhook secret requirements
  if (!secret) {
    throw new Error(
      "Telegram webhook mode requires a non-empty secret token. " +
        "Set channels.telegram.webhookSecret in your config.",
    );
  }

  if (secret.length < MIN_WEBHOOK_SECRET_LENGTH) {
    throw new Error(
      `Webhook secret must be at least ${MIN_WEBHOOK_SECRET_LENGTH} characters long. ` +
        `Current length: ${secret.length}. ` +
        `Generate a secure secret with: openssl rand -base64 32`,
    );
  }

  const entropy = calculateEntropy(secret);
  if (entropy < MIN_WEBHOOK_SECRET_ENTROPY) {
    throw new Error(
      `Webhook secret has insufficient entropy (${entropy.toFixed(2)} bits/char, ` +
        `minimum ${MIN_WEBHOOK_SECRET_ENTROPY} required). ` +
        `The secret appears to be too predictable. ` +
        `Generate a secure random secret with: openssl rand -base64 32`,
    );
  }
  const runtime = opts.runtime ?? defaultRuntime;
  const diagnosticsEnabled = isDiagnosticsEnabled(opts.config);
  const bot = createTelegramBot({
    token: opts.token,
    runtime,
    proxyFetch: opts.fetch,
    config: opts.config,
    accountId: opts.accountId,
  });
  const handler = webhookCallback(bot, "http", {
    secretToken: secret,
    onTimeout: "return",
    timeoutMilliseconds: TELEGRAM_WEBHOOK_CALLBACK_TIMEOUT_MS,
  });

  if (diagnosticsEnabled) {
    startDiagnosticHeartbeat();
  }

  const server = createServer((req, res) => {
    if (req.url === healthPath) {
      res.writeHead(200);
      res.end("ok");
      return;
    }
    if (req.url !== path || req.method !== "POST") {
      res.writeHead(404);
      res.end();
      return;
    }
    const startTime = Date.now();
    if (diagnosticsEnabled) {
      logWebhookReceived({ channel: "telegram", updateType: "telegram-post" });
    }
    const guard = installRequestBodyLimitGuard(req, res, {
      maxBytes: TELEGRAM_WEBHOOK_MAX_BODY_BYTES,
      timeoutMs: TELEGRAM_WEBHOOK_BODY_TIMEOUT_MS,
      responseFormat: "text",
    });
    if (guard.isTripped()) {
      return;
    }
    const handled = handler(req, res);
    if (handled && typeof handled.catch === "function") {
      void handled
        .then(() => {
          if (diagnosticsEnabled) {
            logWebhookProcessed({
              channel: "telegram",
              updateType: "telegram-post",
              durationMs: Date.now() - startTime,
            });
          }
        })
        .catch((err) => {
          if (guard.isTripped()) {
            return;
          }
          const errMsg = formatErrorMessage(err);
          if (diagnosticsEnabled) {
            logWebhookError({
              channel: "telegram",
              updateType: "telegram-post",
              error: errMsg,
            });
          }
          runtime.log?.(`webhook handler failed: ${errMsg}`);
          if (!res.headersSent) {
            res.writeHead(500);
          }
          res.end();
        })
        .finally(() => {
          guard.dispose();
        });
      return;
    }
    guard.dispose();
  });

  const publicUrl =
    opts.publicUrl ?? `http://${host === "0.0.0.0" ? "localhost" : host}:${port}${path}`;

  await withTelegramApiErrorLogging({
    operation: "setWebhook",
    runtime,
    fn: () =>
      bot.api.setWebhook(publicUrl, {
        secret_token: secret,
        allowed_updates: resolveTelegramAllowedUpdates(),
      }),
  });

  await new Promise<void>((resolve) => server.listen(port, host, resolve));
  runtime.log?.(`webhook listening on ${publicUrl}`);

  const shutdown = () => {
    server.close();
    void bot.stop();
    if (diagnosticsEnabled) {
      stopDiagnosticHeartbeat();
    }
  };
  if (opts.abortSignal) {
    opts.abortSignal.addEventListener("abort", shutdown, { once: true });
  }

  return { server, bot, stop: shutdown };
}
