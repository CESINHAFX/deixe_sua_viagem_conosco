import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import html from "eslint-plugin-html";
import importPlugin from "eslint-plugin-import";
import promise from "eslint-plugin-promise";
import node from "eslint-plugin-node";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js, import: importPlugin, promise, node },
    extends: ["js/recommended", "plugin:import/recommended", "plugin:promise/recommended", "plugin:node/recommended", "prettier"],
    languageOptions: {
      globals: globals.browser,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "semi": ["error", "always"],
    },
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  {
    files: ["**/*.html"],
    plugins: { html },
  },
]);
