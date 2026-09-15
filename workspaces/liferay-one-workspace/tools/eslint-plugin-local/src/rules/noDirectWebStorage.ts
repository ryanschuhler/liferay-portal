/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const STORAGES = new Set(['localStorage', 'sessionStorage']);

type MessageId = 'useStorageService';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		const filename = context.getFilename().replace(/\\/g, '/');

		if (filename.includes('/src/services/liferay/')) {
			return {};
		}

		return {
			MemberExpression(node: TSESTree.MemberExpression) {
				const {object} = node;

				const name =
					object.type === 'Identifier'
						? object.name
						: object.type === 'MemberExpression' &&
							  object.property.type === 'Identifier'
							? object.property.name
							: null;

				if (!name || !STORAGES.has(name)) {
					return;
				}

				context.report({
					data: {name},
					messageId: 'useStorageService',
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: 'Best Practices',
			description:
				'Require web storage access to go through the storage service rather than touching localStorage directly.',
			recommended: false,
			url: '',
		},
		messages: {
			useStorageService:
				'Do not touch {{name}} directly. Go through MarketplaceStorage in src/services/liferay, which owns the key names and survives a browser that refuses storage — a direct read throws in a private window and takes the render down with it.',
		},
		schema: [],
		type: 'problem',
	},
};

export = rule;
