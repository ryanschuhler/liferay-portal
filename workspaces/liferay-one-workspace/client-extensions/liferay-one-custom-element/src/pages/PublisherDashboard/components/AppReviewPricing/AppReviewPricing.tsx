/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import i18n from '~/i18n';
import AppReviewSection from '~/pages/PublisherDashboard/components/AppReviewSection/AppReviewSection';
import {PRICING_OPTIONS} from '~/pages/PublisherDashboard/pages/NewAppFlow/constants/newAppConstants';

import type {AppReviewProps} from '~/pages/PublisherDashboard/components/AppReview/AppReview';

type PriceOptionsType = {
	description: string;
	icon?: string;
	title: string;
	tooltip: string;
};

const AppReviewPricing = ({
	context,
	editNavigate,
	required = false,
}: AppReviewProps) => {
	const pricingOption = PRICING_OPTIONS.find(
		(pricingOption) => pricingOption.title === context.pricing.priceModel
	) as PriceOptionsType;

	return (
		<AppReviewSection
			editNavigate={editNavigate}
			required={required}
			title={i18n.translate('pricing')}
		>
			<div className="border p-4 rounded-lg">
				<div>
					{pricingOption && (
						<>
							<div className="align-items-center d-flex">
								<span className="app-review-pricing-title mr-2">
									{pricingOption?.title}
								</span>{' '}
								{pricingOption?.icon && (
									<ClayIcon
										className="app-review-pricing-icon"
										symbol={pricingOption?.icon}
									/>
								)}
							</div>

							<span className="app-review-pricing-description">
								{pricingOption?.description}
							</span>
						</>
					)}
				</div>
			</div>
		</AppReviewSection>
	);
};

export default AppReviewPricing;
