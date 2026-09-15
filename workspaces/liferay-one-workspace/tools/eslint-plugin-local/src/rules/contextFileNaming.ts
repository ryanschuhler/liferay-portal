/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const SUFFIX = 'ContextProvider';

type MessageId = 'mustBeInContextFolder' | 'mustEndWithProvider';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		const filename = context.getFilename().replace(/\\/g, '/');
		const parts = filename.split('/');
		const basename = parts[parts.length - 1];
		const stem = basename.replace(/\.tsx?$/, '');
		const inContextFolder = parts.includes('context');

		return {
			CallExpression(node: TSESTree.CallExpression) {
				if (inContextFolder) {
					return;
				}

				const {callee} = node;

				const isCreateContext =
					(callee.type === 'Identifier' &&
						callee.name === 'createContext') ||
					(callee.type === 'MemberExpression' &&
						callee.property.type === 'Identifier' &&
						callee.property.name === 'createContext');

				if (!isCreateContext) {
					return;
				}

				context.report({
					data: {basename},
					messageId: 'mustBeInContextFolder',
					node,
				});
			},

			Program(node: TSESTree.Program) {
				if (
					!inContextFolder ||
					!/\.tsx?$/.test(basename) ||
					stem === 'index' ||
					stem.endsWith(SUFFIX)
				) {
					return;
				}

				const name = stem.replace(/Context$|Provider$/, '');

				context.report({
					data: {basename, expected: `${name}${SUFFIX}`},
					messageId: 'mustEndWithProvider',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Stylistic Issues',
			description:
				'Enforce that every React context lives in a context/ folder and is named <Name>ContextProvider.',
			recommended: false,
			url: '',
		},
		messages: {
			mustBeInContextFolder:
				'"{{basename}}" calls createContext but does not live in a context/ folder. Contexts sit together: src/context/ when more than one page reads them, otherwise a context/ folder beside the page or component that owns them.',
			mustEndWithProvider:
				'"{{basename}}" must be named "{{expected}}.tsx". The file exports the provider, so the name says so — one suffix across the app, not Context here and ContextProvider there.',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
