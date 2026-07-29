// Flags (and autofixes) straight apostrophes/quotes in hardcoded JSX text --
// code-standards.md's rule that hardcoded UI copy should use curly marks
// directly. Nothing else in the toolchain enforces this: normalizeTypography()
// in lib/text/typographic.ts only runs on saved liturgical content at
// write-time, never on JSX source text, so a straight mark typed into a
// button label or heading has never been caught automatically before.
//
// The autofix reuses normalizeTypography()'s own regex heuristic (kept as a
// literal copy here, not an import, since this file runs under ESLint's own
// Node process rather than the app's TypeScript build) -- same heuristic,
// same limitation: it's a decent guess for common prose (contractions,
// quoted dialogue), not a full typesetting engine, so always eyeball the
// fix rather than trusting it blindly on anything unusual.
function smartQuotes(text) {
  return text
    .replace(/(^|[\s([{—-])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(\w)'/g, "$1’")
    .replace(/(^|[\s([{—-])'(?=\w)/g, "$1‘")
    .replace(/'/g, "’");
}

const STRAIGHT_QUOTE_RE = /['"]/;

const rule = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Disallow straight apostrophes/quotes in hardcoded JSX text -- use curly marks (code-standards.md).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXText(node) {
        if (!STRAIGHT_QUOTE_RE.test(node.value)) return;
        context.report({
          node,
          message:
            "Straight quote/apostrophe in hardcoded JSX text -- type curly marks (‘ ’ “ ”) directly, not straight ones ( ' \" ).",
          fix(fixer) {
            // Fixes node.value (the decoded text), not the raw source slice
            // -- a straight mark can arrive either as a literal character or
            // as an HTML entity (&apos;/&quot;, e.g. from an earlier
            // react/no-unescaped-entities fix), and only .value normalizes
            // both to the same plain character this regex can match. A
            // curly mark needs no entity escaping in JSX text either way.
            return fixer.replaceText(node, smartQuotes(node.value));
          },
        });
      },
    };
  },
};

export default rule;
