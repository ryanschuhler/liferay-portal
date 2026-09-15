/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

const HOOK_CALL = /^use[A-Z]/;

const TYPE_ONLY_DECLARATIONS = new Set([
	'TSEnumDeclaration',
	'TSInterfaceDeclaration',
	'TSTypeAliasDeclaration',
]);

type MessageId = 'notAHook' | 'noHookCall';

function isHookName(name: string) {
	return HOOK_CALL.test(name) || name === 'use';
}

const rule: TSESLint.RuleModule<MessageId, []> = {
	create(context) {
		const filename = context.getFilename().replace(/\\/g, '/');
		const parts = filename.split('/');
		const basename = parts[parts.length - 1];

		if (
			!parts.includes('hooks') ||
			!/\.tsx?$/.test(basename) ||
			basename.endsWith('.d.ts')
		) {
			return {};
		}

		let callsHook = false;
		const offenders: TSESTree.Node[] = [];

		function check(name: string, node: TSESTree.Node) {
			if (!isHookName(name)) {
				offenders.push(node);
			}
		}

		return {
			'CallExpression'(node: TSESTree.CallExpression) {
				const {callee} = node;

				if (callee.type === 'Identifier' && isHookName(callee.name)) {
					callsHook = true;
				}
				else if (
					callee.type === 'MemberExpression' &&
					callee.property.type === 'Identifier' &&
					isHookName(callee.property.name)
				) {
					callsHook = true;
				}
			},

			'ExportNamedDeclaration'(node: TSESTree.ExportNamedDeclaration) {
				if (node.exportKind === 'type') {
					return;
				}

				const {declaration} = node;

				if (!declaration) {
					for (const specifier of node.specifiers) {
						check(specifier.exported.name, specifier);
					}

					return;
				}

				if (TYPE_ONLY_DECLARATIONS.has(declaration.type)) {
					return;
				}

				if (
					declaration.type === 'FunctionDeclaration' &&
					declaration.id
				) {
					check(declaration.id.name, declaration.id);
				}
				else if (declaration.type === 'VariableDeclaration') {
					for (const declarator of declaration.declarations) {
						if (declarator.id.type === 'Identifier') {
							check(declarator.id.name, declarator.id);
						}
					}
				}
			},

			'Program:exit'(node: TSESTree.Program) {
				for (const offender of offenders) {
					context.report({
						data: {basename},
						messageId: 'notAHook',
						node: offender,
					});
				}

				if (!callsHook) {
					context.report({
						data: {basename},
						messageId: 'noHookCall',
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
				'Enforce that files in a hooks folder export only hooks, and that each one actually calls a hook.',
			recommended: false,
			url: '',
		},
		messages: {
			noHookCall:
				'"{{basename}}" is in hooks/ but calls no hook, so it is a plain function. Move it to utils/ if it only transforms its arguments, or to the service that owns the endpoint it talks to.',
			notAHook:
				'This export is not a hook, so it does not belong in "{{basename}}". A query string builder or a pure transform moves to utils/ or to services/; only the hook stays here.',
		},
		schema: [],
		type: 'suggestion',
	},
};

export = rule;
