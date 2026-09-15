/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const DISABLE_DIRECTIVE =
	/^\s*eslint-disable(-next-line|-line)?(\s|$)([@a-z0-9/_-]*)/i;

type MessageId = 'noEslintDisable';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			'Program:exit'() {
				const sourceCode = context.getSourceCode();

				for (const comment of sourceCode.getAllComments()) {
					const match = comment.value.match(DISABLE_DIRECTIVE);

					if (!match) {
						continue;
					}

					context.report({
						data: {rules: match[3] || 'all rules'},
						loc: comment.loc,
						messageId: 'noEslintDisable',
					});
				}
			},
		};
	},
	meta: {
		docs: {
			category: 'Best Practices',
			description:
				'Disallow eslint-disable directives. Fix the underlying violation instead of silencing it.',
			recommended: false,
			url: '',
		},
		messages: {
			noEslintDisable:
				'Do not silence ESLint with a disable directive ({{rules}}). Fix the underlying violation: give the value a real type instead of "any", move the file so it satisfies the structure rule, or raise the rule itself for discussion.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
