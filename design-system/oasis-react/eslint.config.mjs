import nextPlugin from "eslint-config-next";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  ...nextPlugin,
  eslintConfigPrettier,
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: ["src/components/OasisAvatar.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    ignores: ["dist/**", "node_modules/**", "*.config.js", "*.config.mjs", "*.config.ts"],
  },
];
