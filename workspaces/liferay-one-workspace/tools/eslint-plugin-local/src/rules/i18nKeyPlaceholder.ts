/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const PLACEHOLDER = /\{\d+\}/g;

type MessageId = 'missingPlaceholderToken' | 'notX';

function getSegments(key: string) {
	return key.split('-');
}

function getStaticValue(node: TSESTree.Node): string | null {
	if (node.type === 'Literal' && typeof node.value === 'string') {
		return node.value;
	}

	if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
		return node.quasis[0].value.cooked ?? null;
	}

	return null;
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		const filename = context.getFilename().replace(/\\/g, '/');

		if (!/src\/i18n\/[a-z]{2}_[A-Z]{2}\.ts$/.test(filename)) {
			return {};
		}

		return {
			Property(node: TSESTree.Property) {
				const key = getStaticValue(node.key as TSESTree.Node);
				const value = getStaticValue(node.value as TSESTree.Node);

				if (key === null || value === null) {
					return;
				}

				const segments = getSegments(key);

				const badSegments = segments.filter(
					(segment) => segment === 'y' || segment === 'z'
				);

				if (badSegments.length) {
					context.report({
						data: {key, segments: badSegments.join('", "')},
						messageId: 'notX',
						node: node.key,
					});

					return;
				}

				const placeholderCount = (value.match(PLACEHOLDER) ?? [])
					.length;

				if (!placeholderCount) {
					return;
				}

				if (!segments.includes('x')) {
					context.report({
						data: {key},
						messageId: 'missingPlaceholderToken',
						node: node.key,
					});
				}
			},
		};
	},
	meta: {
		docs: {
			category: 'Stylistic Issues',
			description:
				'Enforce that every substitution in a language key is written as "x", never "y", "z", or a number.',
			recommended: false,
			url: '',
		},
		messages: {
			missingPlaceholderToken:
				'"{{key}}" has a substitution in its value but no "x" in the key. Every "{0}" in the value is written as "x" in the key, e.g. "showing-x-to-x-of-x".',
			notX: '"{{key}}" uses "{{segments}}" for a substitution. Every substitution is "x", however many there are — "step-x-of-x", not "step-x-of-y".',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
