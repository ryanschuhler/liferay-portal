/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const TRANSLATED_ATTRIBUTES = new Set([
	'alt',
	'aria-label',
	'label',
	'placeholder',
	'title',
]);

// Two or more words, so a token, a unit, or a symbol does not trip the rule.

const SENTENCE = /[A-Za-z]{2,}\s+[A-Za-z]/;

type MessageId = 'untranslatedAttribute' | 'untranslatedText';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			JSXAttribute(node: TSESTree.JSXAttribute) {
				if (
					node.name.type !== 'JSXIdentifier' ||
					!TRANSLATED_ATTRIBUTES.has(node.name.name) ||
					node.value?.type !== 'Literal' ||
					typeof node.value.value !== 'string' ||
					!SENTENCE.test(node.value.value)
				) {
					return;
				}

				context.report({
					data: {attribute: node.name.name, text: node.value.value},
					messageId: 'untranslatedAttribute',
					node: node.value,
				});
			},

			JSXText(node: TSESTree.JSXText) {
				const text = node.value.trim();

				if (!SENTENCE.test(text)) {
					return;
				}

				context.report({
					data: {text},
					messageId: 'untranslatedText',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Best Practices',
			description:
				'Require user facing text to go through the translation helpers rather than being written inline.',
			recommended: false,
			url: '',
		},
		messages: {
			untranslatedAttribute:
				'"{{text}}" reaches the user through {{attribute}}, so it needs a language key. Add one to src/i18n/en_US.ts and call translate(). Text written inline is invisible to every other locale.',
			untranslatedText:
				'"{{text}}" reaches the user, so it needs a language key. Add one to src/i18n/en_US.ts and render {translate(\'...\')}. Text written inline is invisible to every other locale.',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
