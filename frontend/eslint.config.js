import js from "@eslint/js";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import imports from "eslint-plugin-import";

export default [
    // Base ESLint configurations
    //js.configs.recommended,

    // React plugin
    {
        files: ["src/**/*.jsx"],
        ignores: ["dist/*", "node_modules/*", "wailsjs/*"],
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true, // Enable JSX
                },
            },
        },
        plugins: {
            react: react,
            "jsx-a11y": jsxA11y,
            "react-hooks": reactHooks,
            import: imports,
        },
        rules: {
            // React-specific rules
            "react/prop-types": "off", // Disable prop-types (use TypeScript or not required)
            "react/react-in-jsx-scope": "off", // No need to import React with React 17+
            "react/jsx-uses-react": "off", // React 17+ JSX transform
            "react/jsx-uses-vars": "error", // Prevent unused variables in JSX

            // Hooks rules
            "react-hooks/rules-of-hooks": "error", // Enforce rules of hooks
            "react-hooks/exhaustive-deps": "warn", // Check effect dependencies

            // Accessibility rules
            "jsx-a11y/anchor-is-valid": "warn", // Validate `<a>` tags

            // Import rules
            "import/order": [
                "warn",
                {
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                    "newlines-between": "always",
                },
            ],

            // General JavaScript rules
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "no-console": "warn",
            "no-debugger": "error",
        },
        settings: {
            react: {
                version: "detect", // Detect React version automatically
            },
        },
    },
];