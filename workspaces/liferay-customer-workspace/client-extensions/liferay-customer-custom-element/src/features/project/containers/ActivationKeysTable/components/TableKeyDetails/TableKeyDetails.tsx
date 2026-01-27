/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import classNames from 'classnames';
import {useEffect, useState} from 'react';
import {DXPIcon, PortalIcon} from '~/assets/NavigationMenu';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import PopoverIconButton from '~/features/project/components/PopoverIconButton';
import {PRODUCT_TYPES} from '~/features/project/utils/constants';
import i18n from '~/utils/I18n';
import {FORMAT_DATE_TYPES} from '~/utils/constants';
import getDateCustomFormat from '~/utils/getDateCustomFormat';
import {IActivationKey} from '~/utils/types';

import {getLicenseKeyPermanentStatus} from '../../../GenerateNewKey/utils/licenseKeyPermanentStatus';
import {
	getEnvironmentType,
	getFormattedProductName,
	getInstanceSize,
	getProductDescription,
	getStatusActivationTag,
	hasVirtualCluster,
} from '../../utils/index';

interface ITableKeyDetailsProps {
	activationKeys: IActivationKey;
	setValueToCopyToClipboard: React.Dispatch<
		React.SetStateAction<string | null>
	>;
}

const TableKeyDetails = ({
	activationKeys,
	setValueToCopyToClipboard,
}: ITableKeyDetailsProps) => {
	const [actionToCopy, setActionToCopy] = useState('');
	const instanceSizeFormated = getInstanceSize(activationKeys.sizing);

	const {articleWhatIsMyInstanceSizingValueURL} = useAppPropertiesContext();

	const hasVirtualClusterForActivationKeys = hasVirtualCluster(
		activationKeys?.licenseEntryType
	);
	const statusActivationTag = getStatusActivationTag(activationKeys);

	const isPermanentLicenseKey = getLicenseKeyPermanentStatus(
		activationKeys.startDate,
		activationKeys?.expirationDate
	);

	const formattedProductName = getFormattedProductName(
		activationKeys?.productName
	);

	const handleExpiredDate = isPermanentLicenseKey
		? i18n.translate('does-not-expire')
		: getDateCustomFormat(
				FORMAT_DATE_TYPES.day2DMonthSYearN,
				activationKeys.expirationDate
			);

	useEffect(() => {
		if (actionToCopy) {
			navigator.clipboard.writeText(actionToCopy);
		}
	}, [actionToCopy]);

	const handleCopyToClipboard = (value: string) => {
		setValueToCopyToClipboard(value);
	};

	const Logo =
		formattedProductName === PRODUCT_TYPES.portal ? PortalIcon : DXPIcon;

	return (
		<div className="container">
			<div className="row">
				<div className="col-5">
					<h5>{i18n.translate('environment')}</h5>
				</div>

				<div className="col-4">
					<h5>{i18n.translate('server')}</h5>
				</div>

				<div className="col-3">
					<h5>{i18n.translate('activation-status')}</h5>
				</div>
			</div>

			<div className="row">
				<div className="col-2">
					<p className="text-neutral-8 text-paragraph-sm">
						{i18n.translate('product')}
					</p>
				</div>

				<div className="col-3">
					<p className="text-neutral-8 text-paragraph-sm">
						{i18n.translate('version')}
					</p>
				</div>

				<div className="col-4">
					<p className="text-neutral-8 text-paragraph-sm">
						{i18n.translate('key-type')}
					</p>
				</div>

				<div className="col-3">
					<p className="text-neutral-8 text-paragraph-sm">
						{i18n.translate('status')}
					</p>
				</div>
			</div>

			<div className="row">
				<div className="col-2">
					<p className="align-items-center bg-brand-primary-lighten-5 cp-key-details-paragraph d-flex px-3 py-2 rounded">
						<Logo className="mr-2" />

						{formattedProductName}
					</p>
				</div>

				<div className="col-3">
					<p className="bg-brand-primary-lighten-5 cp-key-details-paragraph px-3 py-2 rounded">
						{activationKeys.productVersion}
					</p>
				</div>

				<div className="col-4">
					<p className="bg-neutral-1 cp-key-details-paragraph px-3 py-2 rounded">
						{hasVirtualClusterForActivationKeys
							? i18n.translate('virtual-cluster')
							: i18n.translate('on-premise')}
					</p>
				</div>

				<div className="col-3">
					<p
						className={`cp-key-details-paragraph label-tonal-${statusActivationTag?.color} px-3 py-2 rounded`}
					>
						{statusActivationTag?.title}
					</p>
				</div>
			</div>

			<div className="row">
				<div className="col-5">
					<p className="text-neutral-8 text-paragraph-sm">
						{i18n.translate('environment-type')}
					</p>
				</div>

				<div className="col-4">
					<p className="text-neutral-8 text-paragraph-sm">
						{hasVirtualClusterForActivationKeys
							? i18n.translate('cluster-nodes')
							: i18n.translate('host-name')}
					</p>
				</div>

				<div className="col-3">
					<p className="text-neutral-8 text-paragraph-sm">
						{i18n.translate('start-date')}
					</p>
				</div>
			</div>

			<div className="row">
				<div className="col-2">
					<p className="bg-brand-primary-lighten-5 cp-key-details-paragraph px-3 py-2 rounded">
						{getEnvironmentType(activationKeys.productName)}
					</p>
				</div>

				<div className="col-3">
					<p className="bg-brand-primary-lighten-5 cp-key-details-paragraph px-3 py-2 rounded">
						{getProductDescription(activationKeys?.complimentary)}
					</p>
				</div>

				<div className="col-4">
					<p className="bg-neutral-1 cp-key-details-paragraph d-flex px-3 py-2 rounded">
						{hasVirtualClusterForActivationKeys
							? activationKeys.maxClusterNodes
							: activationKeys.hostName || '-'}

						{activationKeys.hostName && (
							<ClayIcon
								className="cp-copy-clipboard-icon ml-3 mt-1 text-neutral-5"
								onClick={() => {
									handleCopyToClipboard(
										i18n.translate('host-name')
									);
									setActionToCopy(activationKeys.hostName);
								}}
								symbol="copy"
							/>
						)}
					</p>
				</div>

				<div className="col-3">
					<p className="bg-neutral-1 cp-key-details-paragraph px-3 py-2 rounded">
						{getDateCustomFormat(
							FORMAT_DATE_TYPES.day2DMonthSYearN,
							activationKeys.startDate
						)}
					</p>
				</div>
			</div>

			<div
				className={classNames('row', {
					'justify-content-between':
						hasVirtualClusterForActivationKeys,
				})}
			>
				<div className="col-5">
					{!!activationKeys.sizing && (
						<p className="text-neutral-8 text-paragraph-sm">
							{i18n.translate('instance-size')}

							<PopoverIconButton
								popoverLink={{
									textLink: i18n.translate(
										'learn-more-about-instance-sizing'
									),
									url: articleWhatIsMyInstanceSizingValueURL,
								}}
							/>
						</p>
					)}
				</div>

				{!hasVirtualClusterForActivationKeys && (
					<div className="col-4">
						<p className="text-neutral-8 text-paragraph-sm">
							{i18n.translate('ip-addresses')}
						</p>
					</div>
				)}

				<div className="col-3">
					<p className="text-neutral-8 text-paragraph-sm">
						{i18n.translate('expiration-date')}
					</p>
				</div>
			</div>

			<div
				className={classNames('row', {
					'justify-content-between':
						hasVirtualClusterForActivationKeys,
				})}
			>
				<div className="col-5">
					{!!activationKeys.sizing && (
						<p className="bg-brand-primary-lighten-5 cp-key-details-paragraph px-3 py-2 rounded">
							{instanceSizeFormated}
						</p>
					)}
				</div>

				{!hasVirtualClusterForActivationKeys && (
					<div className="col-4">
						<p className="bg-neutral-1 cp-key-details-paragraph d-flex px-3 py-2 rounded">
							{activationKeys.ipAddresses || '-'}

							{activationKeys.ipAddresses && (
								<ClayIcon
									className="cp-copy-clipboard-icon ml-3 mt-1 text-neutral-5"
									onClick={() => {
										handleCopyToClipboard(
											i18n.translate('ip-addresses')
										);
										setActionToCopy(
											activationKeys.ipAddresses
										);
									}}
									symbol="copy"
								/>
							)}
						</p>
					</div>
				)}

				<div className="col-3">
					<p className="bg-neutral-1 cp-key-details-paragraph px-3 py-2 rounded">
						{handleExpiredDate}
					</p>
				</div>
			</div>

			{!hasVirtualClusterForActivationKeys && (
				<>
					<div className="justify-content-center row">
						<div className="col-2">
							<p className="text-neutral-8 text-paragraph-sm">
								{i18n.translate('mac-addresses')}
							</p>
						</div>
					</div>
					<div className="justify-content-center row">
						<div className="col-4 ml-8">
							<p className="bg-neutral-1 cp-key-details-paragraph d-flex px-3 py-2 rounded">
								{activationKeys.macAddresses || '-'}

								{activationKeys.macAddresses && (
									<ClayIcon
										className="cp-copy-clipboard-icon ml-3 mt-1 text-neutral-5"
										onClick={() => {
											handleCopyToClipboard(
												i18n.translate('mac-addresses')
											);
											setActionToCopy(
												activationKeys.macAddresses
											);
										}}
										symbol="copy"
									/>
								)}
							</p>
						</div>
					</div>
				</>
			)}
		</div>
	);
};
export default TableKeyDetails;
