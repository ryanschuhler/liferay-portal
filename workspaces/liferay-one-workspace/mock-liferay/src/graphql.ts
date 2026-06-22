/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {type Router as ExpressRouter, Router} from 'express';

// The custom element only uses GraphQL for dashboard metrics (see
// HeadlessGraphQL.ts) and already degrades to empty aggregates on failure.
// The mock parses the aliased operations out of the query and returns an empty
// aggregate per alias, which is enough to render the dashboards without errors.

export function createGraphQLRouter(): ExpressRouter {
	const router = Router();

	router.post('/o/graphql', (request, response) => {
		const query = String(request.body?.query ?? '');

		const aliases = [...query.matchAll(/(\w+):\s*\w+\s*\(/g)].map(
			(match) => match[1]
		);

		const metrics: Record<string, {items: unknown[]; totalCount: number}> =
			{};

		for (const alias of aliases) {
			if (alias === 'metrics') {
				continue;
			}

			metrics[alias] = {items: [], totalCount: 0};
		}

		response.json({data: {metrics}});
	});

	return router;
}
