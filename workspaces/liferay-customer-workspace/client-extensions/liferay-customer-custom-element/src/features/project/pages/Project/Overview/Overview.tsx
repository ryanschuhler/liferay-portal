/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import i18n from '~/utils/I18n';

import SubscriptionsOverview from './components/SubscriptionsOverview';
import SupportOverview from './components/SupportOverview';

interface IKoroneikiAccount {
	accountKey: string;

	// Add relevant properties here based on usage in child components

}

const Overview = () => {
	const {data, loading} = useCurrentKoroneikiAccount();
	const koroneikiAccount: IKoroneikiAccount | undefined =
		data?.koroneikiAccountByExternalReferenceCode;

	if (loading) {
		return <span>{i18n.translate('loading')}...</span>;
	}

	if (!koroneikiAccount) {
		return null;
	}

	return (
		<>
			<SupportOverview
				koroneikiAccount={koroneikiAccount}
				loading={loading}
			/>

			<SubscriptionsOverview
				koroneikiAccount={koroneikiAccount}
				loading={loading}
			/>
		</>
	);
};

export default Overview;
