/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const FILTER_KEYS = new Set(['filter', 'filters', 'search']);

const ODATA_OPERATOR =
	/\b(eq|ne|gt|ge|lt|le|and|or|contains|startswith|any|all)\b/i;

const ODATA_COMPARISON_BEFORE_VALUE =
	/\b(eq|ne|gt|ge|lt|le|contains|startswith)\s+'$/i;

type MessageId = 'useSearchBuilder';

function usesSearchBuilder(
	node: TSESTree.TemplateLiteral,
	context: Readonly<TSESLint.RuleContext<MessageId, []>>
) {
	const text = context.getSourceCode().getText(node);

	return text.includes('SearchBuilder');
}

function isFilterProperty(node: TSESTree.Property) {
	const key =
		node.key.type === 'Identifier'
			? node.key.name
			: node.key.type === 'Literal'
				? String(node.key.value)
				: null;

	return Boolean(key && FILTER_KEYS.has(key));
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			TemplateLiteral(node: TSESTree.TemplateLiteral) {
				const {parent} = node;

				if (
					parent &&
					parent.type === 'Property' &&
					isFilterProperty(parent)
				) {
					return;
				}

				const quotesAValue = node.quasis.some(
					(quasi, index) =>
						index < node.expressions.length &&
						ODATA_COMPARISON_BEFORE_VALUE.test(quasi.value.raw) &&
						node.quasis[index + 1].value.raw.startsWith("'")
				);

				if (!quotesAValue || usesSearchBuilder(node, context)) {
					return;
				}

				context.report({
					messageId: 'useSearchBuilder',
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

				if (
					!key ||
					!FILTER_KEYS.has(key) ||
					node.value.type !== 'TemplateLiteral' ||
					!node.value.expressions.length
				) {
					return;
				}

				const raw = node.value.quasis
					.map((quasi) => quasi.value.raw)
					.join(' ');

				if (
					!ODATA_OPERATOR.test(raw) ||
					usesSearchBuilder(node.value, context)
				) {
					return;
				}

				context.report({
					messageId: 'useSearchBuilder',
					node: node.value,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Possible Errors',
			description:
				'Require SearchBuilder for OData filters instead of interpolating values into a template literal.',
			recommended: false,
			url: '',
		},
		messages: {
			useSearchBuilder:
				'Build this filter with SearchBuilder rather than interpolating into a template literal. A value pasted into a filter is pasted into a query: an ID or name carrying a quote changes what the filter matches, and SearchBuilder escapes it. Use SearchBuilder.eq, .contains, or .lambda.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
