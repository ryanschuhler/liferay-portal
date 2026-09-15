/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const CANONICAL_GRAPHQL_MODULE = 'src/services/graphql/GraphQL.ts';

const READ_ONLY_TIERS = ['commerce', 'headless', 'objects'];

const WRITE_METHODS = new Set(['delete', 'patch', 'post', 'put']);

type MessageId =
	| 'fetcherOutsideServices'
	| 'graphQLDuplicate'
	| 'writeOutsideSpringBoot';

function getTier(filename: string) {
	const match = filename.match(/\/src\/services\/([^/]+)\//);

	return match ? match[1] : null;
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		const filename = context.getFilename().replace(/\\/g, '/');
		const tier = getTier(filename);

		return {
			ImportDeclaration(node: TSESTree.ImportDeclaration) {
				const source = node.source.value;

				if (typeof source !== 'string') {
					return;
				}

				if (/(^|\/)services\/headless\/GraphQL$/.test(source)) {
					context.report({
						data: {module: CANONICAL_GRAPHQL_MODULE},
						messageId: 'graphQLDuplicate',
						node,
					});

					return;
				}

				if (
					/(^|\/)services\/fetcher\/fetcher$/.test(source) &&
					!/\/src\/services\//.test(filename) &&
					!/\/src\/main\.tsx$/.test(filename)
				) {
					context.report({
						messageId: 'fetcherOutsideServices',
						node,
					});
				}
			},

			MemberExpression(node: TSESTree.MemberExpression) {
				if (
					node.object.type !== 'Identifier' ||
					node.object.name !== 'fetcher' ||
					node.property.type !== 'Identifier'
				) {
					return;
				}

				const method = node.property.name;

				if (!WRITE_METHODS.has(method)) {
					return;
				}

				if (tier && READ_ONLY_TIERS.includes(tier)) {
					context.report({
						data: {method: method.toUpperCase(), tier},
						messageId: 'writeOutsideSpringBoot',
						node,
					});
				}
			},

			Program(node: TSESTree.Program) {
				if (
					/\/src\/services\/.*\/GraphQL\.ts$/.test(filename) &&
					!filename.endsWith(CANONICAL_GRAPHQL_MODULE)
				) {
					context.report({
						data: {module: CANONICAL_GRAPHQL_MODULE},
						messageId: 'graphQLDuplicate',
						node,
					});
				}
			},
		};
	},
	meta: {
		docs: {
			category: 'Best Practices',
			description:
				'Enforce the service layer boundary: reads may call Liferay directly, writes go through services/spring-boot, and only one GraphQL client exists.',
			recommended: false,
			url: '',
		},
		messages: {
			fetcherOutsideServices:
				'Do not call fetcher outside src/services. Add a method to the service that owns this endpoint and call that instead, so the URL and its response type live in one place.',
			graphQLDuplicate:
				'There is one GraphQL client: {{module}}. Import that, and delete the copy.',
			writeOutsideSpringBoot:
				'A {{method}} belongs in src/services/spring-boot, not services/{{tier}}. Reads may call Liferay directly; writes go through Spring Boot so the mutation is server mediated.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
