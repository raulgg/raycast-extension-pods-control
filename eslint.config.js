import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import extensionConfig from "./extension/eslint.config.js";

export default defineConfig([
  ...extensionConfig,
  {
    files: ["extension/src/**/*.{ts,tsx}"],
    settings: { "import-x/resolver": { node: { extensions: [".js", ".jsx", ".ts", ".tsx", ".json"] } } },
    rules: {
      "import-x/no-restricted-paths": [
        "error",
        {
          basePath: fileURLToPath(new URL(".", import.meta.url)),
          zones: [
            {
              target: "./extension/src",
              from: "./tests",
              message: "Production code must not import tests.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["tests/**/*.test.{ts,tsx}"],
    rules: {
      // `using fixture = ...` keeps a resource alive without reading the variable.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreUsingDeclarations: true }],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "vitest",
              importNames: [
                "describe",
                "suite",
                "it",
                "spyOn",
                "beforeEach",
                "afterEach",
                "beforeAll",
                "afterAll",
                "aroundEach",
                "aroundAll",
              ],
              message: "Use top-level test with explicit Given/When/Then and local resource cleanup. See TESTING.md.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value='vitest'] > ImportNamespaceSpecifier",
          message: "Import test and helpers explicitly so testing conventions remain enforceable.",
        },
        {
          selector:
            "CallExpression[callee.name=/^(describe|suite|it|beforeEach|afterEach|beforeAll|afterAll|aroundEach|aroundAll)$/]",
          message: "Use top-level test with explicit Given/When/Then and local resource cleanup. See TESTING.md.",
        },
        {
          selector: "MemberExpression[object.name='test'][property.name='concurrent']",
          message: "Keep tests sequential in a file. Console expectations are module-scoped. See TESTING.md.",
        },
        {
          selector: "CallExpression[callee.property.name='spyOn']:has(Identifier[name='console'])",
          message: "Declare expected logs through tests/console.ts instead of replacing console spies.",
        },
        {
          selector: "CallExpression[callee.name='spyOn']:has(Identifier[name='console'])",
          message: "Declare expected logs through tests/console.ts instead of replacing console spies.",
        },
        {
          selector: "AssignmentExpression[left.object.name='console'][left.property.name=/^(error|warn)$/]",
          message: "Declare expected logs through tests/console.ts instead of replacing console spies.",
        },
      ],
    },
  },
]);
