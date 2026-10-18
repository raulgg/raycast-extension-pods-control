# Testing

How to write and run this extension's Vitest suites.

## Rules

1. One test is one workflow: setup, actions, and the assertions that prove it. Prefer fewer, longer tests.
2. Expected values must not come from the code under test. See [What to assert](#what-to-assert).
3. Each test builds its own state. No `describe`, hooks, or module-level state shared between tests.
4. Use the lightest [environment](#environments) that can falsify the claim.
5. Tests stay offline and in process: no Homebrew, public internet, real device, or Raycast window.
6. No test-only code in production: no `_resetForTests` exports, `NODE_ENV` or `VITEST` branches, or parameters only tests pass. Would production keep it if every test were deleted?
7. Keep the bar high. Do not add a test for a bug that cannot happen again. Coverage finds gaps; it is not a target.

## Writing a test

Use top-level `test` and named `test.each` rows. Names say the condition, the action, and the outcome. Mark each case with `// Given` (fixtures and stubs), `// When` (call the subject), and `// Then` (observable result). Repeat When/Then for a multi-step journey such as install, retry, or disconnect.

```ts
test("returns the Homebrew path when the CLI is there", () => {
  // Given
  mockGetPreferenceValues.mockReturnValue({} as never);
  mockStatSync.mockReturnValue({ isFile: () => true } as never);
  mockInstalledAt("/opt/homebrew/bin/pods-control", "/usr/local/bin/pods-control");

  // When
  const result = findCliPath();

  // Then
  expect(result).toBe("/opt/homebrew/bin/pods-control");
});
```

Both default locations exist, so reversing the search order fails the test. Asserting `CLI_SEARCH_PATHS[0]` would not.

For an async failure, keep the promise in When and assert `rejects` in Then. Attach the matcher before you advance timers or release a deferred failure.

## Isolation

- Call shared factories from `src/test/` inside the test (`const cli = installedCliSetup()`), never at module level.
- Mocks reset after every test (`clearMocks`, `mockReset`, `restoreMocks`), so stub behavior in Given. A bare `vi.fn()` returns `undefined` after a reset. Reset mid-test only between steps of one workflow.
- Register cleanup as soon as you acquire a resource, with `try/finally` or `onTestFinished`. Do not use `using`; keep one cleanup style.
- Await pending installer prompts, Homebrew operations, and child processes before restoring timers or deleting directories, even after a failed assertion. Clearing mocks does not clear the installer's pending promises.
- `setupFiles` may verify mocks or logs, as `src/test/console.ts` does, but must not plant scenario state.

## What to assert

Assert what a caller or user observes: CLI arguments, confirmed states, toasts and their actions, copied text, opened URLs, launched commands, subtitles, lock ownership, exit codes, and `CliError` fields. Click actions and check where they lead. Write expected values as literals, not production constants such as `CLI_INSTALL_COMMAND`.

```ts
expect(compareVersions(version, version)).toBe(0); // no: cannot fail
expect(normalizeVersion(" v0.05.0 ")).toBe("0.5.0"); // yes: fails if parsing breaks
```

Do not assert:

- A production helper on both sides, or a predicate on the constant it looks up.
- An exported constant against its own literal.
- Instructional copy: setup guidance, toast messages, preference descriptions, tooltips, HUD text.
- Absence of something no code path can produce, such as a deleted action. Assert absence only where a live path could still show it: loading vs ready, connected vs not connected.
- What TypeScript already enforces. Launch context still needs runtime checks.

Logs are part of the contract. Any `console.error` or `console.warn` you have not declared fails the test. Declare each one with `expectConsoleError(tag, error)` or `expectConsoleWarning(tag, error)`, passing the stable tag and the error object production logs.

## Environments

| Project       | Files                                           | Use when                                                 | Avoid when                                    |
| ------------- | ----------------------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| `unit`        | `src/**/*.test.ts`                              | Logic in Node, with Raycast and tools stubbed.           | The claim needs a process, a lock, or React.  |
| `component`   | `src/**/*.test.tsx`                             | Actions, navigation, and React lifecycle in happy-dom.   | The claim is about native rendering or HUD.   |
| `integration` | `src/test/integration/**/*.integration.test.ts` | Composed modules with fake CLI and supervisor processes. | A unit test can falsify the claim.            |
| `macos`       | `src/test/integration/**/*.macos.test.ts`       | Real `lockf`, file descriptors, revision files.          | The claim is not about locks or process life. |

Every `macos` case uses `test.skipIf(process.platform !== "darwin")`. Do not stub `lockf`, cut timeouts, or turn off file isolation to speed suites up. Real devices, native Raycast rendering, HUD fallback, and a real `brew install` are checked manually.

Run one file with its project, or a pair with `npm run test:unit` (`unit`, `component`) and `npm run test:integration` (`integration`, `macos`):

```sh
npx --no-install vitest run --project unit src/cli/client.test.ts
```

## Before you finish

```sh
npm test
npm run type-check
npm run lint
npx --no-install prettier --check src .prettierrc eslint.config.js package.json tsconfig.json vitest.config.ts
npm run build
```

After isolation changes, also run `npx --no-install vitest run --sequence.shuffle --sequence.seed <n>` and record the seed.
