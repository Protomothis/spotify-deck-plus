import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["node_modules/", "dist/", "*.sdPlugin/bin/", "*.sdPlugin/logs/"] },
	js.configs.recommended,
	{ languageOptions: { globals: { ...globals.node } } },
	...tseslint.configs.recommended,
	{
		files: ["**/*.ts"],
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		},
	},
);
