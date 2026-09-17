/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayIcon from '@clayui/icon';
import i18n, {translate} from '~/i18n';
import {getSiteName} from '~/utils/siteUtils';

import './LicenseAgreement.css';

import DOMPurify from 'dompurify';
import {useMarketplaceContext} from '~/context/MarketplaceContextProvider';

const LicenseAgreement = () => {
	const {properties} = useMarketplaceContext();

	return (
		<div className="license-agreement-container">
			<div className="border-details mb-4">
				<div className="align-items-baseline d-flex justify-content-between p-5">
					<div className="align-items-baseline d-flex justify-content-star">
						<div className="align-items-center d-flex icon-background justify-content-center mr-3">
							<ClayIcon symbol="document-text" />
						</div>

						<h3>
							{translate('liferay-publisher-license-agreement')}
						</h3>
					</div>

					<ClayButton
						className="border border-dark rounded-lg text-dark"
						displayType="secondary"
						onClick={() =>
							window.open(
								`/documents/d/${getSiteName()}/${properties.publisherLicenseAgreement}`
							)
						}
					>
						{i18n.translate('download')}
						<ClayIcon className="ml-2" symbol="download" />
					</ClayButton>
				</div>

				<div className="p-5 text-agreement">
					<strong className="text-agreement-text-primary">
						{translate('liferay-marketplace-developer-agreement')}
					</strong>

					<div className="mt-4 text-agreement-text-secondary">
						{translate(
							'please-read-this-agreement-carefully-before-using-the-marketplace-to-market-or-distribute-your-developer-products-downloading-and-or-using-the-liferay-marketplace-if-you-are-entering-into-this-agreement-on-behalf-of-a-company-or-other-legal-entity-you-represent-that-you-have-the-authority-to-bind-such-entity-to-this-agreement-in-which-case-the-terms-you-or-your-shall-refer-to-such-entity-if-you-do-not-have-such-authority-or-if-you-do-not-unconditionally-agree-to-all-of-the-terms-of-this-agreement-you-will-not-have-any-right-to-use-the-marketplace-and-liferay-software-and-you-must-immediately-discontinue-participation-in-the-marketplace-program-and-use-of-the-liferay-software'
						)}
					</div>
				</div>
			</div>

			<small
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(
						i18n.sub(
							'by-clicking-on-the-button-continue-below-i-confirm-that-i-have-read-and-agree-to-be-bound-by-the-x-i-also-confirm-that-i-am-of-the-legal-age-of-majority-in-the-jurisdiction-where-i-reside-at-least-18-years-of-age-in-many-countries',
							[
								`<strong> ${translate(
									'liferay-publisher-license-agreement'
								)}.</strong>`,
							]
						)
					),
				}}
			/>
		</div>
	);
};

export default LicenseAgreement;
