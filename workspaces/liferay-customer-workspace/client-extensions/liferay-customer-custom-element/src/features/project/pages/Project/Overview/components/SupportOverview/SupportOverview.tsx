/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IKoroneikiAccount} from '~/utils/types';

import LiferayContacts from './components/LiferayContacts';
import SLACardsList from './components/SLACardsList';

interface IProps {
	koroneikiAccount: IKoroneikiAccount;
	loading: boolean;
}

const SupportOverview = ({koroneikiAccount, loading}: IProps) => (
	<div className="d-flex flex-column flex-xl-row">
		<SLACardsList koroneikiAccount={koroneikiAccount} loading={loading} />

		<LiferayContacts
			koroneikiAccount={koroneikiAccount}
			loading={loading}
		/>
	</div>
);

export default SupportOverview;
