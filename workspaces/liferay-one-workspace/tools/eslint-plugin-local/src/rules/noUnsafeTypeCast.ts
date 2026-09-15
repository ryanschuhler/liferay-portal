/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

type MessageId = 'doubleCast';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			TSAsExpression(node: TSESTree.TSAsExpression) {
				const inner = node.expression;

				if (
					inner.type !== 'TSAsExpression' ||
					inner.typeAnnotation.type !== 'TSUnknownKeyword'
				) {
					return;
				}

				context.report({
					messageId: 'doubleCast',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Best Practices',
			description:
				'Disallow the "as unknown as" double cast, which disables type checking between two unrelated types.',
			recommended: false,
			url: '',
		},
		messages: {
			doubleCast:
				'"as unknown as" turns off the check that these two types have anything to do with each other, so the next field rename compiles and fails at runtime. Fix the type the value actually has: widen the DTO, narrow with a type guard, or model the difference the cast is hiding.',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
