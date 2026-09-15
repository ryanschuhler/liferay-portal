/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

type MessageId = 'timezoneNaive';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			NewExpression(node: TSESTree.NewExpression) {
				if (
					node.callee.type !== 'Identifier' ||
					node.callee.name !== 'Date' ||
					node.arguments.length !== 1
				) {
					return;
				}

				const [argument] = node.arguments;

				// A literal or a computed Date is fine. The bug is a value
				// that arrived as a string from somewhere else.

				if (
					argument.type !== 'Identifier' &&
					argument.type !== 'MemberExpression'
				) {
					return;
				}

				const {parent} = node;

				if (
					parent?.type !== 'MemberExpression' ||
					parent.property.type !== 'Identifier' ||
					parent.property.name !== 'toISOString'
				) {
					return;
				}

				context.report({
					messageId: 'timezoneNaive',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Possible Errors',
			description:
				'Disallow new Date(value).toISOString() on a value that may be a bare yyyy-MM-dd date.',
			recommended: false,
			url: '',
		},
		messages: {
			timezoneNaive:
				'A bare "yyyy-MM-dd" parses as UTC midnight, so in any UTC-negative timezone this shifts the day backward by one and the saved date is not the one that was picked. Pin it to local noon — new Date(`${value}T12:00:00`) — or use the shared helper in ~/utils/dateUtils.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
