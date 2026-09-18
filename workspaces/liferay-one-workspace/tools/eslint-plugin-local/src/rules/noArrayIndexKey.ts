/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const INDEX_NAMES = new Set(['i', 'idx', 'index']);

// A variable named "key" holds an identity, not a position. It comes from
// Object.keys, from Object.entries, or from a field that carries its own key.

type MessageId = 'noArrayIndexKey';

function isIndexExpression(node: TSESTree.Node): boolean {
	if (node.type === 'Identifier') {
		return INDEX_NAMES.has(node.name);
	}

	// `${index}` and 'prefix-' + index both still key on position.

	if (node.type === 'TemplateLiteral') {
		return node.expressions.some(isIndexExpression);
	}

	if (node.type === 'BinaryExpression' && node.operator === '+') {
		return (
			isIndexExpression(node.left as TSESTree.Node) ||
			isIndexExpression(node.right)
		);
	}

	return false;
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			JSXAttribute(node: TSESTree.JSXAttribute) {
				if (
					node.name.type !== 'JSXIdentifier' ||
					node.name.name !== 'key' ||
					node.value?.type !== 'JSXExpressionContainer' ||
					!isIndexExpression(node.value.expression as TSESTree.Node)
				) {
					return;
				}

				context.report({
					messageId: 'noArrayIndexKey',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Possible Errors',
			description:
				'Disallow the array index as a React key, which ties component state to position rather than identity.',
			recommended: false,
			url: '',
		},
		messages: {
			noArrayIndexKey:
				'The array index is a position, not an identity. Remove or reorder an item and React keeps the old state on the element that moved into that slot — a checked row stays checked, a half-typed input keeps its text. Key on something stable: an id, an externalReferenceCode, or a value unique within the list.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
