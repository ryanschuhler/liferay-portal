/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

type Relocation = {
	destination: string;
	prefix: string;
	reason: string;
};

const RELOCATIONS: Relocation[] = [
	{
		destination: 'src/types/',
		prefix: 'src/enums/',
		reason: 'An enum is a type. There is no separate enums tier.',
	},
	{
		destination: 'src/services/models/',
		prefix: 'src/models/',
		reason: 'A model wraps a service payload, so it belongs with the services that return it.',
	},
	{
		destination: 'src/schemas/',
		prefix: 'src/schema/',
		reason: 'Every other top level folder is plural — components, hooks, pages, services, types, utils.',
	},
	{
		destination: 'src/hooks/',
		prefix: 'src/hooks/data/',
		reason: 'Hooks are flat. A hook that reads data is still just a hook.',
	},
	{
		destination: 'src/services/fetcher/',
		prefix: 'src/utils/CreateFilters',
		reason: 'It builds OData query strings, which is a transport concern, not a generic helper.',
	},
	{
		destination: 'src/services/fetcher/',
		prefix: 'src/utils/SearchBuilder',
		reason: 'It builds OData query strings, which is a transport concern, not a generic helper.',
	},
];

type MessageId = 'noClassInUtils' | 'wrongFolder';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		const filename = context.getFilename().replace(/\\/g, '/');

		return {
			ClassDeclaration(node: TSESTree.ClassDeclaration) {
				if (!/\/src\/utils\//.test(filename)) {
					return;
				}

				context.report({
					data: {name: node.id?.name ?? 'The class'},
					messageId: 'noClassInUtils',
					node,
				});
			},

			Program(node: TSESTree.Program) {
				const relocation = RELOCATIONS.find(({prefix}) =>
					filename.includes(`/${prefix}`)
				);

				if (!relocation) {
					return;
				}

				context.report({
					data: {
						destination: relocation.destination,
						prefix: relocation.prefix,
						reason: relocation.reason,
					},
					messageId: 'wrongFolder',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Stylistic Issues',
			description:
				'Enforce the top level folder layout under src: no enums/, models/, schema/, or hooks/data/, and no classes in utils/.',
			recommended: false,
			url: '',
		},
		messages: {
			noClassInUtils:
				'"{{name}}" is a class, and utils/ holds plain functions. Move it to the tier that owns its behavior — a query builder to src/services/fetcher/, a payload wrapper to src/services/models/.',
			wrongFolder:
				'"{{prefix}}" is not a folder in this app. Move this file to "{{destination}}". {{reason}}',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
