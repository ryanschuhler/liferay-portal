/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const BARE_FILES: Record<string, string> = {
	types: 'types',
	utils: 'utils',
};

type MessageId = 'mustBeFolder';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			Program(node: TSESTree.Program) {
				const filename = context.getFilename().replace(/\\/g, '/');

				if (!filename.includes('/src/')) {
					return;
				}

				const parts = filename.split('/');
				const basename = parts[parts.length - 1];
				const stem = basename.replace(/\.tsx?$/, '');

				if (stem === basename) {
					return;
				}

				const folder = BARE_FILES[stem];

				if (!folder) {
					return;
				}

				context.report({
					data: {basename, folder},
					messageId: 'mustBeFolder',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Stylistic Issues',
			description:
				'Disallow catch-all utils.ts and types.ts files. Each becomes a folder with one named file per concern.',
			recommended: false,
			url: '',
		},
		messages: {
			mustBeFolder:
				'"{{basename}}" is a catch-all. Make it a {{folder}}/ folder and give each concern its own named file, so a reader can find one by name instead of scrolling.',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
