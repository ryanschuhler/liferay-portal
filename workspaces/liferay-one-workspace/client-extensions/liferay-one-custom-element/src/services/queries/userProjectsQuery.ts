/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import SearchBuilder from '~/services/fetcher/SearchBuilder';
import {queryGraphQL, toGraphQLString} from '~/services/graphql/GraphQL';

import type {APIResponse, DataQuery} from '~/types/api';

type ProjectAPIItem = {
	externalReferenceCode: string;
	id: number;
	liferayVersion?: string;
	name: string;
};

export function userProjectsQuery(
	accountId?: number | string | null
): DataQuery<APIResponse<ProjectAPIItem>> {
	const filter = new SearchBuilder({useURIEncode: false})
		.eq('r_accountEntryToProject_accountEntryId', accountId ?? '')
		.build();

	return {
		fetcher: () =>
			queryGraphQL<{projects: APIResponse<ProjectAPIItem>}>(
				`c { projects(filter: ${toGraphQLString(
					filter
				)}, pageSize: 200, sort: "name:asc") { items { externalReferenceCode id liferayVersion name } totalCount } }`
			).then((data) => data.projects),
		key: accountId ? `/graphql/projects/${accountId}` : null,
	};
}
