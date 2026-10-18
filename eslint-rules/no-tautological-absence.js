import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const absenceMatchers = new Set([
  "toContain",
  "toContainEqual",
  "toHaveProperty",
  "toHaveBeenCalledWith",
  "toHaveBeenLastCalledWith",
  "toHaveBeenNthCalledWith",
]);
const emptyMatchers = new Set(["toBeNull", "toBeUndefined", "toBeFalsy"]);
const negatedEmptyMatchers = new Set(["toBeTruthy", "toBeDefined"]);

// Production source and the manifest: everything a live code path can show.
function productionText() {
  const files = readdirSync(join(root, "src"), { recursive: true, encoding: "utf8" }).filter(
    (file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !/^test[\\/]/.test(file),
  );
  return [join(root, "package.json"), ...files.map((file) => join(root, "src", file))]
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

function strings(node) {
  if (!node) return [];
  if (node.type === "Literal" && typeof node.value === "string") return [node];
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return [node];
  if (node.type === "ArrayExpression") return node.elements.flatMap(strings);
  if (node.type === "ObjectExpression") return node.properties.flatMap((property) => strings(property.value));
  return [];
}

function text(node) {
  return node.type === "Literal" ? node.value : node.quasis[0].value.cooked;
}

// expect(subject).not.matcher(...args) or expect(subject).matcher(...args)
function assertion(node) {
  const { callee } = node;
  if (callee.type !== "MemberExpression" || callee.property.type !== "Identifier") return null;
  const negated = callee.object.type === "MemberExpression" && callee.object.property.name === "not";
  const expectCall = negated ? callee.object.object : callee.object;
  if (expectCall.type !== "CallExpression" || expectCall.callee.name !== "expect") return null;
  return { matcher: callee.property.name, negated, subject: expectCall.arguments[0], args: node.arguments };
}

// The literals an assertion claims are absent: `not.toContain("X")`, or `action("X")` expected to be null.
function absentStrings({ matcher, negated, subject, args }) {
  if (negated && absenceMatchers.has(matcher)) return args.flatMap(strings);
  const expectsEmpty = negated ? negatedEmptyMatchers.has(matcher) : emptyMatchers.has(matcher);
  if (expectsEmpty && subject?.type === "CallExpression") return subject.arguments.flatMap(strings);
  return [];
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Reject absence assertions for text that no production code contains." },
    schema: [],
    messages: {
      tautological:
        'No production code contains "{{value}}", so this absence check cannot fail. Assert absence only where a live path could still show it. See TESTING.md.',
    },
  },
  create(context) {
    let production;
    return {
      CallExpression(node) {
        const parsed = assertion(node);
        if (!parsed) return;
        for (const literal of absentStrings(parsed)) {
          const value = text(literal);
          production ??= productionText();
          if (value && !production.includes(value)) {
            context.report({ node: literal, messageId: "tautological", data: { value } });
          }
        }
      },
    };
  },
};
