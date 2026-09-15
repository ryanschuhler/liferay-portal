/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type MessageId = 'notASlug';

function toSlug(key: string) {
	return key
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		const filename = context.getFilename().replace(/\\/g, '/');

		if (!/src\/i18n\/[a-z]{2}_[A-Z]{2}\.ts$/.test(filename)) {
			return {};
		}

		return {
			Property(node: TSESTree.Property) {
				if (
					node.key.type !== 'Literal' ||
					typeof node.key.value !== 'string'
				) {
					return;
				}

				const key = node.key.value;

				if (SLUG.test(key)) {
					return;
				}

				context.report({
					data: {expected: toSlug(key), key},
					messageId: 'notASlug',
					node: node.key,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Stylistic Issues',
			description:
				'Enforce that a language key is a lowercase kebab-case slug with no punctuation.',
			recommended: false,
			url: '',
		},
		messages: {
			notASlug:
				'"{{key}}" is not a slug. A language key carries no punctuation — the English text is the value, not the key. Rename it to "{{expected}}".',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
