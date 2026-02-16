import fs from "node:fs";
import path from "node:path";

export function unscopedPackageName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.includes("/") ? (trimmed.split("/").pop() ?? trimmed) : trimmed;
}

/**
 * SECURITY: Sanitize directory name to prevent path traversal and injection.
 */
export function safeDirName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }

  // SECURITY: Reject reserved and potentially dangerous names
  const RESERVED_NAMES = [
    ".",
    "..",
    "node_modules",
    ".git",
    ".env",
    "system",
    "root",
    "admin",
    "config",
    "etc",
    "bin",
    "sbin",
    "boot",
    "dev",
    "proc",
    "sys",
  ];
  if (RESERVED_NAMES.includes(trimmed.toLowerCase())) {
    throw new Error(`Plugin ID '${trimmed}' is a reserved name`);
  }

  // SECURITY: Reject control characters, path separators, and special chars
  if (/[\x00-\x1F\x7F:*?"<>|]/.test(trimmed)) {
    throw new Error(`Plugin ID contains invalid characters`);
  }

  return trimmed.replaceAll("/", "__").replaceAll("\\", "__");
}

/**
 * SECURITY: Resolve installation directory with path traversal and symlink protection.
 */
export function resolveSafeInstallDir(params: {
  baseDir: string;
  id: string;
  invalidNameMessage: string;
}): { ok: true; path: string } | { ok: false; error: string } {
  const targetDir = path.join(params.baseDir, safeDirName(params.id));
  const resolvedBase = path.resolve(params.baseDir);
  const resolvedTarget = path.resolve(targetDir);
  const relative = path.relative(resolvedBase, resolvedTarget);

  // SECURITY: Prevent path traversal
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return { ok: false, error: params.invalidNameMessage };
  }

  // SECURITY: Check for symlink at target location (if it exists)
  try {
    if (fs.existsSync(targetDir)) {
      const stats = fs.lstatSync(targetDir);
      if (stats.isSymbolicLink()) {
        return {
          ok: false,
          error: "Cannot install to symlink location (security restriction)",
        };
      }
    }
  } catch {
    // If we can't check, allow the operation to proceed
    // The actual install will fail if there's a real problem
  }

  return { ok: true, path: targetDir };
}
