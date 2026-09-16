/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';

type Options = [{maxHooks: number; maxLines: number}];

const DEFAULTS: Options[0] = {maxHooks: 12, maxLines: 400};

type MessageId = 'tooManyHooks' | 'tooManyLines';

// Language files are data, and a test file grows with what it covers, so
// neither is held to the budget.

const rule: TSESLint.RuleModule<MessageId, Options> = {
	create(context) {
		const {maxHooks, maxLines} = {...DEFAULTS, ...context.options[0]};
		const filename = context.getFilename().replace(/\\/g, '/');

		if (
			/\/src\/i18n\//.test(filename) ||
			/\.test\.tsx?$/.test(filename)
		) {
			return {};
		}

		let hookCalls = 0;

		return {
			'CallExpression'(node: TSESTree.CallExpression) {
				const {callee} = node;

				if (
					callee.type === 'Identifier' &&
					/^use[A-Z]/.test(callee.name)
				) {
					hookCalls++;
				}
			},

			'Program:exit'(node: TSESTree.Program) {
				const lines = context.getSourceCode().lines.length;

				if (lines > maxLines) {
					context.report({
						data: {lines, maxLines},
						messageId: 'tooManyLines',
						node,
					});
				}

				if (hookCalls > maxHooks) {
					context.report({
						data: {hookCalls, maxHooks},
						messageId: 'tooManyHooks',
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
				'Cap file length and the number of hook calls in one module.',
			recommended: false,
			url: '',
		},
		messages: {
			tooManyHooks:
				'This module calls {{hookCalls}} hooks, over the budget of {{maxHooks}}. That many means it is coordinating several concerns at once. Move a related group behind one hook of its own, or split the component.',
			tooManyLines:
				'This file is {{lines}} lines, over the budget of {{maxLines}}. Split it along the seam it already has — a sub-component, a hook, or the service call it is wrapping.',
		},
		schema: [
			{
				additionalProperties: false,
				properties: {
					maxHooks: {type: 'number'},
					maxLines: {type: 'number'},
				},
				type: 'object',
			},
		],
		type: 'suggestion',
	},
};

export = rule;
