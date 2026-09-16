/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import fs = require('fs');

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

type MessageId = 'indexNotAllowed' | 'missingRouter' | 'mustMatchFolderName';

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		return {
			Program(node: TSESTree.Program) {
				const filename = context.getFilename().replace(/\\/g, '/');

				const match = filename.match(/src\/pages\/(.+)$/);

				if (!match) {
					return;
				}

				const parts = match[1].split('/');
				const fileName = parts[parts.length - 1];

				if (!/\.tsx?$/.test(fileName) || /\.test\.tsx?$/.test(fileName)) {
					return;
				}

				const stem = fileName.replace(/\.tsx?$/, '');
				const extension = fileName.slice(stem.length);
				const pageName = parts[0];

				if (stem === 'index') {
					context.report({
						data: {fileName, pageName},
						messageId: 'indexNotAllowed',
						node,
					});

					return;
				}

				if (parts.length > 1) {
					const folderName = parts[parts.length - 2];

					if (
						stem.toLowerCase() === folderName.toLowerCase() &&
						stem !== folderName
					) {
						context.report({
							data: {extension, fileName, folderName},
							messageId: 'mustMatchFolderName',
							node,
						});

						return;
					}
				}

				if (parts.length === 2 && stem === pageName) {
					const folder = context
						.getFilename()
						.replace(/[^/\\]+$/, '');

					if (!fs.existsSync(`${folder}${pageName}Router.tsx`)) {
						context.report({
							data: {pageName},
							messageId: 'missingRouter',
							node,
						});
					}
				}
			},
		};
	},
	meta: {
		docs: {
			category: 'Stylistic Issues',
			description:
				'Enforce page folder structure: no index files, a file matching its folder name matches its casing, and every top level page has a Router.',
			recommended: false,
			url: '',
		},
		messages: {
			indexNotAllowed:
				'"{{fileName}}" tells a reader nothing about what it holds. Name the file after what it exports. A top level page is entered through "{{pageName}}Router.tsx", which is what main.tsx registers.',
			missingRouter:
				'The "{{pageName}}" page has no "{{pageName}}Router.tsx". Every top level page owns its routes: a Router that main.tsx lazy loads, and a routes file beside it once it has more than one route.',
			mustMatchFolderName:
				'"{{fileName}}" must match its folder name exactly. Expected "{{folderName}}{{extension}}".',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
