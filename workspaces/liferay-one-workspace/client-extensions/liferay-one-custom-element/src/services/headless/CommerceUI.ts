/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import fetcher from '~/services/fetcher/fetcher';
import {Liferay} from '~/services/liferay/liferay';

export default class CommerceUI {
	static async selectAccount(accountId: string | number) {
		const body = new FormData();

		body.append('accountId', accountId as string);

		return fetcher.post(
			`/o/commerce-ui/set-current-account?groupId=${Liferay.ThemeDisplay.getScopeGroupId()}&p_auth=${
				Liferay.authToken
			}`,
			body
		);
	}
}
