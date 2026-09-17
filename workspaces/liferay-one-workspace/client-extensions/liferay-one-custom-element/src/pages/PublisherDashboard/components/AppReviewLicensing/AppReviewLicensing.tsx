/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import i18n from '~/i18n';
import LicensingList from '~/pages/PublisherDashboard/components/AppReviewLicensingList/AppReviewLicensingList';
import AppReviewSection from '~/pages/PublisherDashboard/components/AppReviewSection/AppReviewSection';

import type {AppReviewProps} from '~/pages/PublisherDashboard/components/AppReview/AppReview';

const AppReviewLicensing = ({
	context,
	editNavigate,
	required = false,
}: AppReviewProps) => {
	return (
		<AppReviewSection
			editNavigate={editNavigate}
			required={required}
			title={i18n.translate('licensing')}
		>
			<LicensingList context={context} />
		</AppReviewSection>
	);
};

export default AppReviewLicensing;
