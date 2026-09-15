/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

type MessageId = 'mustSanitize';

function isSanitizeCall(node: TSESTree.Node): boolean {
	if (node.type !== 'CallExpression') {
		return false;
	}

	const {callee} = node;

	return (
		(callee.type === 'MemberExpression' &&
			callee.property.type === 'Identifier' &&
			callee.property.name === 'sanitize') ||
		(callee.type === 'Identifier' && callee.name === 'sanitize')
	);
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			JSXAttribute(node: TSESTree.JSXAttribute) {
				if (
					node.name.type !== 'JSXIdentifier' ||
					node.name.name !== 'dangerouslySetInnerHTML' ||
					node.value?.type !== 'JSXExpressionContainer' ||
					node.value.expression.type !== 'ObjectExpression'
				) {
					return;
				}

				for (const property of node.value.expression.properties) {
					if (
						property.type !== 'Property' ||
						property.key.type !== 'Identifier' ||
						property.key.name !== '__html' ||
						isSanitizeCall(property.value as TSESTree.Node)
					) {
						continue;
					}

					context.report({
						messageId: 'mustSanitize',
						node: property,
					});
				}
			},
		};
	},
	meta: {
		docs: {
			category: 'Possible Errors',
			description:
				'Require DOMPurify.sanitize on anything assigned to dangerouslySetInnerHTML.',
			recommended: false,
			url: '',
		},
		messages: {
			mustSanitize:
				'Wrap this in DOMPurify.sanitize(). Anything rendered as HTML has to be sanitized, including a translated string — i18n.sub and translate interpolate their arguments verbatim, so an account or product name that came from Salesforce, Jira, Koroneiki, or Marketplace reaches the DOM as markup.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
