/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

const path = require('path');

const jsxA11y = require('eslint-plugin-jsx-a11y');

// The accessibility defects are real, and they predate the rule, so each one is
// a warning until the count reaches zero. Reading the plugin's own recommended
// set keeps this list correct when the plugin adds a rule.
//
// A rule that the recommended set turns off stays off. The set disables a
// deprecated rule this way, and a map of every key to a warning would turn the
// deprecated rule back on.

const accessibilityRules = Object.fromEntries(
	Object.entries(jsxA11y.configs.recommended.rules)
		.filter(([, severity]) => severity !== 'off' && severity !== 0)
		.map(([rule]) => [rule, 'warn'])
);

const config = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: ['plugin:@liferay/portal', 'plugin:local/recommended'],
	globals: {
		Liferay: true,
		configuration: true,
		fragmentElement: true,
		fragmentNamespace: true,
		layoutMode: true,
		themeDisplay: true,
	},
	ignorePatterns: ['!*', '**/build/**', 'tools/eslint-plugin-local/dist/**'],
	overrides: [
		{
			files: [
				'client-extensions/liferay-one-custom-element/@vite/**/*.ts',
			],
			rules: {
				'@liferay/no-absolute-import': 'off',
			},
		},
		{
			files: ['*.json'],
			parser: 'jsonc-eslint-parser',
			plugins: ['jsonc'],
			rules: {
				// The TypeScript aware rules need a program, which the JSON
				// parser cannot build. Leaving them on crashes the whole run.

				'@typescript-eslint/naming-convention': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'jsonc/no-dupe-keys': 'error',
				'jsonc/sort-keys': 'error',
				'notice/notice': 'off',
			},
		},
	],
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 2023,
	},
	plugins: ['@liferay', 'jsx-a11y', 'local'],
	root: true,
	rules: {
		...accessibilityRules,
		'@liferay/empty-line-between-elements': 'off',
		'@liferay/import-extensions': 'off',
		'@liferay/portal/deprecation': 'off',
		'@liferay/portal/no-document-cookie': 'off',
		'@liferay/portal/no-explicit-extend': 'off',
		'@liferay/portal/no-global-fetch': 'off',
		'@liferay/portal/no-global-storage': 'off',
		'@liferay/portal/no-loader-import-specifier': 'off',
		'@liferay/portal/no-localhost-reference': 'off',
		'@liferay/portal/no-react-dom-create-portal': 'off',
		'@liferay/portal/no-react-dom-render': 'off',
		'@liferay/portal/no-side-navigation': 'off',
		'@liferay/portal/unexecuted-ismounted': 'off',
		'@typescript-eslint/naming-convention': [
			'error',
			{
				filter: {
					match: false,
					regex: '^Window$',
				},
				format: ['PascalCase'],
				prefix: ['I'],
				selector: 'interface',
			},
		],
		'@typescript-eslint/no-explicit-any': 'error',
		'no-empty': ['error', { allowEmptyCatch: true }],
		'notice/notice': [
			'error',
			{
				nonMatchingTolerance: 0.7,
				onNonMatchingHeader: 'replace',
				templateFile: path.join(__dirname, 'copyright.js'),
			},
		],
	},
};

module.exports = config;
