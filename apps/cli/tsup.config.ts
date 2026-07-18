import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  minify: false,
  // Bundle the workspace schema package so the published npm package
  // has no workspace: dependency.
  noExternal: ["@aieracard/schema"],
  banner: { js: "#!/usr/bin/env node" },
});
