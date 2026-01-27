/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IGraphQLUserAccount, IUserAccount} from '~/utils/types';

export function toGraphQLUserAccount(
	userAccount: IUserAccount | undefined
): IGraphQLUserAccount | undefined {
	if (!userAccount) {
		return undefined;
	}

	return {
		...userAccount,
		accountBriefs: userAccount.accountBriefs?.map((brief) => ({
			...brief,
			id: String(brief.id),
		})),
		id: userAccount.id ? String(userAccount.id) : '',
	};
}
