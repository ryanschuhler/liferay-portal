/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IGraphQLUserAccount, IProject} from '~/utils/types';

export function hasAdminOrPartnerManager(
	project: IProject | undefined,
	userAccount: IGraphQLUserAccount | undefined
) {
	const currentAccountBrief = userAccount?.accountBriefs?.find(
		(accountBrief) =>
			accountBrief.externalReferenceCode === project?.accountKey
	);

	return currentAccountBrief?.roleBriefs?.some(
		(roleBrief) =>
			roleBrief?.name === 'Administrator' ||
			roleBrief?.name === 'Partner Manager'
	);
}
