/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IRoleBrief, IUserAccount} from '~/utils/types';

export interface IMyAccountApollo {
	myUserAccount?: IUserAccount;
}

export function hasAdminUserAccount(
	myAccount: IMyAccountApollo | undefined
): boolean {
	const roleBriefs = myAccount?.myUserAccount?.roleBriefs;

	return (
		roleBriefs?.some(
			(roleBrief: IRoleBrief) => roleBrief.name === 'Administrator'
		) || false
	);
}
