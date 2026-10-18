import { Linter } from "eslint";
import { expect, test } from "vitest";
import noTautologicalAbsence from "./no-tautological-absence.js";

function lint(code) {
  return new Linter().verify(code, {
    plugins: { local: { rules: { "no-tautological-absence": noTautologicalAbsence } } },
    rules: { "local/no-tautological-absence": "error" },
  });
}

test.each([
  { name: "text missing from markdown", code: 'expect(view.markdown()).not.toContain("Retired Setup Hint");' },
  { name: "an action expected to be null", code: 'expect(view.action("Retired Action Title")).toBeNull();' },
  { name: "a template literal not defined", code: "expect(view.action(`Retired Action Title`)).not.toBeDefined();" },
  {
    name: "a nested call argument",
    code: 'expect(open).not.toHaveBeenCalledWith({ url: "https://retired.example" });',
  },
])("reports an absence check for text no production code contains: $name", ({ code }) => {
  // When
  const messages = lint(code);

  // Then
  expect(messages).toEqual([expect.objectContaining({ ruleId: "local/no-tautological-absence" })]);
});

test.each([
  { name: "text production can show", code: 'expect(view.markdown()).not.toContain("**Latest:**");' },
  { name: "an action production can show", code: 'expect(view.action("Install with Homebrew")).toBeNull();' },
  { name: "a command name from the manifest", code: 'expect(launched).not.toContain("cycle-listening-mode");' },
  { name: "a value comparison", code: 'expect(revision).not.toBe("retired-token");' },
  { name: "a presence check", code: 'expect(view.markdown()).toContain("Retired Setup Hint");' },
])("allows $name", ({ code }) => {
  // When
  const messages = lint(code);

  // Then
  expect(messages).toEqual([]);
});
