/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
    project: undefined,
  },
  settings: {
    next: { rootDir: ["./"] },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-this-alias": "error",
  },
  overrides: [
    // Potpuno ignoriraj generirani kod
    {
      files: ["lib/generated/**", "prisma/**"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-this-alias": "off",
        "no-unused-expressions": "off",
      },
    },
  ],
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "dist/",
    "coverage/",
    "lib/generated/",
    "prisma/",
  ],
};
