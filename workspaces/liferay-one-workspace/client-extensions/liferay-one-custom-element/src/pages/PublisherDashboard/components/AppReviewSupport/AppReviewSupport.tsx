/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import i18n from '~/i18n';
import AppReviewSection from '~/pages/PublisherDashboard/components/AppReviewSection/AppReviewSection';
import SupportList from '~/pages/PublisherDashboard/components/AppReviewSupportList/AppReviewSupportList';

import type {AppReviewProps} from '~/pages/PublisherDashboard/components/AppReview/AppReview';

const AppReviewSupport = ({
	context,
	editNavigate,
	isLastSection,
	required = false,
}: AppReviewProps) => {
	return (
		<AppReviewSection
			editNavigate={editNavigate}
			isLastSection={isLastSection}
			required={required}
			title={i18n.translate('support-and-help')}
		>
			<SupportList context={context} />
		</AppReviewSection>
	);
};

export default AppReviewSupport;
