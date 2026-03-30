import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { isVersionSatisfied } from "./semver";
import { MIN_VSCODE_NATIVE_HOOKS_VERSION } from "../consts";

/**
 * VS Code 1.109.3+ supports built-in Copilot hooks, so our extension should stop
 * emitting legacy before_edit/after_edit checkpoints to avoid duplicate attribution.
 */
export function shouldSkipLegacyCopilotHooks(
  vscodeVersion: string,
  nativeHooksInstalled = true,
): boolean {
  return nativeHooksInstalled && isVersionSatisfied(vscodeVersion, MIN_VSCODE_NATIVE_HOOKS_VERSION);
}

export function hasGitAiGithubCopilotHookCommands(configContent: string): boolean {
  try {
    const parsed = JSON.parse(configContent);
    const hooks = parsed?.hooks;
    if (!hooks || typeof hooks !== "object") {
      return false;
    }

    return ["PreToolUse", "PostToolUse"].some((hookName) => {
      const hookEntries = hooks[hookName];
      if (!Array.isArray(hookEntries)) {
        return false;
      }

      return hookEntries.some((entry) => {
        const command = entry?.command;
        return typeof command === "string"
          && command.includes("git-ai")
          && command.includes("checkpoint")
          && command.includes("github-copilot");
      });
    });
  } catch {
    return false;
  }
}

export function hasGitAiNativeCopilotHooksConfigured(chatUseHooks: boolean, hookLocations: Record<string, boolean> | undefined): boolean {
  if (!chatUseHooks || !hookLocations) {
    return false;
  }

  for (const [hookLocation, enabled] of Object.entries(hookLocations)) {
    if (!enabled) {
      continue;
    }

    const resolvedHookDir = resolveHookLocation(hookLocation);
    if (!resolvedHookDir) {
      continue;
    }

    const hookConfigPath = path.join(resolvedHookDir, "git-ai.json");
    if (!fs.existsSync(hookConfigPath)) {
      continue;
    }

    try {
      const configContent = fs.readFileSync(hookConfigPath, "utf-8");
      if (hasGitAiGithubCopilotHookCommands(configContent)) {
        return true;
      }
    } catch {
      // Ignore malformed/unreadable hook files and keep looking for a valid one.
    }
  }

  return false;
}

function resolveHookLocation(hookLocation: string): string | null {
  const trimmed = hookLocation.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("~/")) {
    return path.join(os.homedir(), trimmed.slice(2));
  }

  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }

  // Relative hook paths are workspace-dependent; the git-ai installer writes "~/.github/hooks".
  return null;
}
