/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {IGraphQLUserAccount} from '~/utils/types';

interface IUserAccountsData {
	items: IGraphQLUserAccount[];
}

export default function useSupportSeatsCount(
	userAccounts: IUserAccountsData | undefined,
	searching: boolean
) {
	const [supportSeatsCount, setSupportSeatsCount] = useState<
		number | undefined
	>();

	useEffect(() => {
		if (!searching) {
			setSupportSeatsCount(
				userAccounts?.items.filter(
					(item) =>
						item?.selectedAccountSummary?.hasSupportSeatRole &&
						!item?.isLiferayStaff
				).length
			);
		}
	}, [searching, userAccounts?.items]);

	return supportSeatsCount;
}
