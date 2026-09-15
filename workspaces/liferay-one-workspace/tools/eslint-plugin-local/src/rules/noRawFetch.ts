/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const LIFERAY_URL = /(^|[`'"}])\/o\//;

type MessageId = 'noRawFetch';

function getURLText(node: TSESTree.Node): string | null {
	if (node.type === 'Literal' && typeof node.value === 'string') {
		return node.value;
	}

	if (node.type === 'TemplateLiteral') {
		return node.quasis.map((quasi) => quasi.value.raw).join('}');
	}

	return null;
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			CallExpression(node: TSESTree.CallExpression) {
				if (
					node.callee.type !== 'Identifier' ||
					node.callee.name !== 'fetch' ||
					!node.arguments.length
				) {
					return;
				}

				const url = getURLText(node.arguments[0]);

				if (url === null || !LIFERAY_URL.test(url)) {
					return;
				}

				context.report({
					messageId: 'noRawFetch',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Possible Errors',
			description:
				'Disallow calling fetch directly against a Liferay endpoint. Those calls go through the shared fetcher.',
			recommended: false,
			url: '',
		},
		messages: {
			noRawFetch:
				'Do not call fetch directly against a Liferay endpoint. The shared fetcher in src/services/fetcher attaches the CSRF token and turns a failed response into a FetcherError — a raw fetch does neither, so a write silently fails authorization and a failed read resolves as though it worked. Add a method to the service that owns this URL.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
