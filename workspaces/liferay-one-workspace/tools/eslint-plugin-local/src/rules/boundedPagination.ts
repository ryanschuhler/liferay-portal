/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const UNBOUNDED = /pageSize=-1/;

type MessageId = 'unboundedPageSize';

// ALL_ROWS names the claim that the collection is a fixed reference set, so
// the rule takes it as the answer. The raw -1 is what it asks about.

function isUnbounded(node: TSESTree.Node): boolean {
	if (node.type === 'Identifier') {
		return false;
	}

	if (node.type === 'Literal') {
		return node.value === '-1' || node.value === -1;
	}

	if (node.type === 'UnaryExpression' && node.operator === '-') {
		return node.argument.type === 'Literal' && node.argument.value === 1;
	}

	return false;
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			Literal(node: TSESTree.Literal) {
				if (
					typeof node.value !== 'string' ||
					!UNBOUNDED.test(node.value)
				) {
					return;
				}

				context.report({
					messageId: 'unboundedPageSize',
					node,
				});
			},

			Property(node: TSESTree.Property) {
				const key =
					node.key.type === 'Identifier'
						? node.key.name
						: node.key.type === 'Literal'
							? String(node.key.value)
							: null;

				if (key !== 'pageSize' || !isUnbounded(node.value)) {
					return;
				}

				context.report({
					messageId: 'unboundedPageSize',
					node,
				});
			},

			TemplateElement(node: TSESTree.TemplateElement) {
				if (!UNBOUNDED.test(node.value.raw)) {
					return;
				}

				context.report({
					messageId: 'unboundedPageSize',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Best Practices',
			description:
				'Disallow an unbounded page size on a collection that grows.',
			recommended: false,
			url: '',
		},
		messages: {
			unboundedPageSize:
				"pageSize -1 asks for every row. That is fine for a fixed reference set — countries, currencies, an account's roles — and a time bomb on anything company scoped, where it grows until the request times out. Paginate and cap the total, or say in a comment why this set is bounded.",
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
