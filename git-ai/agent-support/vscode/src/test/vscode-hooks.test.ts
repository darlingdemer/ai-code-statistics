import * as assert from "assert";
import {
  hasGitAiGithubCopilotHookCommands,
  shouldSkipLegacyCopilotHooks,
} from "../utils/vscode-hooks";

suite("VS Code Hook Gating", () => {
  test("skips legacy hooks at and above 1.109.3", () => {
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.109.3"), true);
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.109.4"), true);
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.110.0"), true);
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.110.0-insider"), true);
  });

  test("keeps legacy hooks below 1.109.3", () => {
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.109.2"), false);
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.108.0"), false);
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.109.3-alpha"), false);
  });

  test("keeps legacy hooks enabled when native hooks are not installed", () => {
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.109.3", false), false);
    assert.strictEqual(shouldSkipLegacyCopilotHooks("1.110.0", false), false);
  });

  test("detects git-ai github copilot hook commands from hook config", () => {
    const config = JSON.stringify({
      hooks: {
        PreToolUse: [{ type: "command", command: "/tmp/git-ai checkpoint github-copilot --hook-input stdin" }],
        PostToolUse: [{ type: "command", command: "/tmp/git-ai checkpoint github-copilot --hook-input stdin" }],
      },
    });
    assert.strictEqual(hasGitAiGithubCopilotHookCommands(config), true);
  });

  test("ignores unrelated hook configs", () => {
    const config = JSON.stringify({
      hooks: {
        PreToolUse: [{ type: "command", command: "echo hello" }],
      },
    });
    assert.strictEqual(hasGitAiGithubCopilotHookCommands(config), false);
    assert.strictEqual(hasGitAiGithubCopilotHookCommands("{not json"), false);
  });
});
