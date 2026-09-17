/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {preloadDataQuery} from '~/services/fetcher/preloadDataQuery';
import HeadlessAdminUser, {
	MY_USER_ACCOUNT_URL,
} from '~/services/headless/HeadlessAdminUser';
import {Liferay} from '~/services/liferay/liferay';
import {
	accountsQuery,
	currentAccountQuery,
} from '~/services/queries/accountQueries';
import {
	accountLevelContractsQuery,
	channelProductsQuery,
	projectContractsQuery,
	projectEntitlementsQuery,
} from '~/services/queries/commerceQueries';
import {projectOrdersQuery} from '~/services/queries/orderQueries';
import {userProjectsQuery} from '~/services/queries/userProjectsQuery';

const MY_ACCOUNT_ROUTE = 'my-account';

const preloadedRoutes = new Set<string>();

function getProjectExternalReferenceCode(): string {
	const [, section, projectExternalReferenceCode = ''] = window.location.hash
		.replace(/^#\/?/, '')
		.split('/');

	return section === 'project' ? projectExternalReferenceCode : '';
}

function getContractScopedProjectExternalReferenceCode(): string {
	const [, , , projectSection = ''] = window.location.hash
		.replace(/^#\/?/, '')
		.split('/');

	if (projectSection && projectSection !== 'products') {
		return '';
	}

	return getProjectExternalReferenceCode();
}

export default function preloadAppData(route: string) {
	const accountId = Liferay.CommerceContext?.account?.accountId;

	if (
		!Liferay.ThemeDisplay.isSignedIn() ||
		!accountId ||
		preloadedRoutes.has(route)
	) {
		return;
	}

	preloadedRoutes.add(route);

	preloadDataQuery({
		fetcher: HeadlessAdminUser.getMyUserAccount,
		key: MY_USER_ACCOUNT_URL,
	});
	preloadDataQuery(currentAccountQuery(accountId));
	preloadDataQuery(accountsQuery(accountId));

	if (route !== MY_ACCOUNT_ROUTE) {
		return;
	}

	preloadDataQuery(userProjectsQuery(accountId));
	preloadDataQuery(accountLevelContractsQuery(accountId));
	preloadDataQuery(projectContractsQuery(getProjectExternalReferenceCode()));
	preloadDataQuery(
		projectEntitlementsQuery(
			getContractScopedProjectExternalReferenceCode()
		)
	);
	preloadDataQuery(
		channelProductsQuery(Liferay.CommerceContext.commerceChannelId)
	);
	preloadDataQuery(projectOrdersQuery(accountId));
}
