import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "tailwind-preset.ts"],
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
  sourcemap: true,
  minify: false,
  target: "es2021",
  splitting: false,
  shims: true,
  external: ["react", "react-dom", "tailwindcss", "react-hook-form"],
});

