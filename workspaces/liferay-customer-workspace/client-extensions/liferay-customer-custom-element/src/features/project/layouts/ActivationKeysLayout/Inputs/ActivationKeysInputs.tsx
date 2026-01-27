/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ApolloClient, NormalizedCacheObject} from '@apollo/client';
import {ClaySelect} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import {useEffect, useMemo, useState} from 'react';
import {Button} from '~/components';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {useAppContext} from '~/features/project/context';
import {
	EXTENSION_FILE_TYPES,
	STATUS_CODE,
} from '~/features/project/utils/constants';
import {getYearlyTerms} from '~/features/project/utils/getYearlyTerms';
import {
	getAccountSubscriptions,
	getCommerceOrderItems,
} from '~/services/liferay/graphql/queries';
import {getCommonLicenseKey} from '~/services/liferay/rest/raysource/LicenseKeys';
import i18n from '~/utils/I18n';
import {FORMAT_DATE_TYPES, ROLE_TYPES} from '~/utils/constants';
import downloadFromBlob from '~/utils/downloadFromBlob';
import getDateCustomFormat from '~/utils/getDateCustomFormat';
import getKebabCase from '~/utils/getKebabCase';
import {IAccountBrief, IAccountSubscription, IRoleBrief} from '~/utils/types';

import './ActivationKeysInputs.css';

interface OrderItemDate {
	endDate: Date;
	startDate: Date;
}

interface AccountSubscription extends IAccountSubscription {
	accountSubscriptionId: number;
	externalReferenceCode: string;
}

interface ActivationKeysInputsProps {
	accountKey: string;
	accountSubscriptionGroupName: string;
	oAuthToken: string;
	productTitle: string;
	projectName: string;
}

const ActivationKeysInputs = ({
	accountKey,
	accountSubscriptionGroupName,
	oAuthToken,
	productTitle,
	projectName,
}: ActivationKeysInputsProps) => {
	const [{project, userAccount}] = useAppContext();

	const {
		articleGettingStartedWithLiferayEnterpriseSearchURL,
		client,
		featureFlags,
		provisioningServerAPI,
		submitSupportTicketURL,
	} = useAppPropertiesContext();

	const [accountSubscriptions, setAccountSubscriptions] = useState<
		AccountSubscription[]
	>([]);

	const [
		selectedAccountSubscriptionName,
		setSelectedAccountSubscriptionName,
	] = useState('');
	const [selectedAccountSubscriptionERC, setSelectedAccountSubscriptionERC] =
		useState('');

	const [orderItemsDates, setAccountOrderItemsDates] = useState<
		OrderItemDate[]
	>([]);
	const [selectDateInterval, setSelectedDateInterval] = useState<
		OrderItemDate | undefined
	>(undefined);

	const [hasLicenseDownloadError, setLicenseDownloadError] = useState(false);

	useEffect(() => {
		const fetchAccountSubscriptions = async () => {
			const {data} = await (
				client as ApolloClient<NormalizedCacheObject>
			).query({
				query: getAccountSubscriptions,
				variables: {
					filter: `accountSubscriptionGroupERC eq '${accountKey}_${accountSubscriptionGroupName}'`,
				},
			});

			if (data) {
				const items: AccountSubscription[] =
					data.c?.accountSubscriptions?.items;
				setAccountSubscriptions(items);

				setSelectedAccountSubscriptionERC(
					items[0].externalReferenceCode
				);
				setSelectedAccountSubscriptionName(
					getKebabCase(items[0].name || '')
				);
			}
		};

		fetchAccountSubscriptions();
	}, [accountKey, accountSubscriptionGroupName, client]);

	useEffect(() => {
		const getOrderItems = async () => {
			const filterAccountSubscriptionERC = `customFields/accountSubscriptionERC eq '${selectedAccountSubscriptionERC}'`;

			const {data} = await (
				client as ApolloClient<NormalizedCacheObject>
			).query({
				fetchPolicy: 'network-only',
				query: getCommerceOrderItems,
				variables: {
					filter: filterAccountSubscriptionERC,
				},
			});

			if (data) {
				const orderItems: any[] = data?.orderItems?.items || [];

				if (orderItems.length) {
					const orderItemsByYearlyTerms = orderItems
						.map((orderItem) => getYearlyTerms(orderItem.options))
						.flat()
						.sort(
							(a: OrderItemDate, b: OrderItemDate) =>
								a.startDate.getTime() - b.startDate.getTime()
						);

					setAccountOrderItemsDates(orderItemsByYearlyTerms);
					setSelectedDateInterval(orderItemsByYearlyTerms[0]);
				}
			}
		};

		if (selectedAccountSubscriptionName) {
			getOrderItems();
		}
	}, [
		client,
		selectedAccountSubscriptionERC,
		selectedAccountSubscriptionName,
	]);

	useEffect(() => {
		if (selectedAccountSubscriptionName && selectDateInterval) {
			setLicenseDownloadError(false);
		}
	}, [selectDateInterval, selectedAccountSubscriptionName]);

	const handleClick = async () => {
		if (!selectDateInterval) {
			return;
		}

		const license = await getCommonLicenseKey(
			accountKey,
			selectDateInterval.endDate,
			selectDateInterval.startDate,
			selectedAccountSubscriptionName.toLowerCase(),
			oAuthToken,
			provisioningServerAPI,
			encodeURI(productTitle)
		);

		const formatText = (text: string) =>
			text.replaceAll(/[^a-zA-Z0-9]/g, '').toLowerCase();
		const productName = [productTitle, selectedAccountSubscriptionName]
			.map(formatText)
			.join('');

		if (license.status === STATUS_CODE.success) {
			const contentType = license.headers.get('content-type');
			const extensionFile =
				EXTENSION_FILE_TYPES[
					contentType as keyof typeof EXTENSION_FILE_TYPES
				] || '.txt';
			const licenseBlob = await license.blob();

			downloadFromBlob(
				licenseBlob,
				`activation-key-${productName}-${formatText(
					projectName
				)}${extensionFile}`
			);

			return;
		}

		setLicenseDownloadError(true);
	};

	const accountBrief: IAccountBrief | undefined =
		userAccount?.accountBriefs?.find(
			(accountBrief: IAccountBrief) =>
				accountBrief.externalReferenceCode === project?.accountKey
		);

	const errorDownloadMessage = useMemo(
		() => ({
			messageRequestersAdministrators: (
				<p className="mt-3 text-neutral-7 text-paragraph">
					<span className="mt-3 text-danger text-paragraph">
						{i18n.sub(
							'the-requested-activation-key-is-not-yet-available',
							[getKebabCase(productTitle)]
						)}
					</span>

					{i18n.sub(
						'for-more-information-about-the-availability-of-your-x-activation-keys-please',
						[getKebabCase(productTitle)]
					)}

					<a
						href={submitSupportTicketURL}
						rel="noreferrer"
						target="_blank"
					>
						<u className="font-weight-bold text-neutral-9">
							{` ${i18n.translate('contact-the-support-team')}`}
						</u>
					</a>
				</p>
			),
			messageUsers: (
				<p className="mt-3 text-danger text-paragraph">
					{i18n.sub(
						'the-requested-activation-key-is-not-yet-available',
						[getKebabCase(productTitle)]
					)}

					<span className="mt-3 text-neutral-7 text-paragraph">
						{i18n.sub(
							'if-you-need-more-information-about-the-availability-of-your-x-activation-keys-please-ask-one-of-your-administrator-team-members-to-update-your-permissions-so-you-can-contact-liferay-support-alternatively-team-members-with-administrator-or-requester-role-can-submit-a-support-ticket-on-your-behalf',
							[getKebabCase(productTitle)]
						)}
					</span>
				</p>
			),
		}),
		[submitSupportTicketURL, productTitle]
	);

	const currentEnterpriseMessage = useMemo(() => {
		const isRequester = accountBrief?.roleBriefs?.some(
			({name}: IRoleBrief) => name === ROLE_TYPES.requester.key
		);
		if (userAccount?.isAccountAdmin || isRequester) {
			return errorDownloadMessage.messageRequestersAdministrators;
		}

		return errorDownloadMessage.messageUsers;
	}, [accountBrief, errorDownloadMessage, userAccount]);

	return (
		<div className="mt-3">
			<p className="text-paragraph">
				{i18n.sub(
					'select-an-active-liferay-x-subscription-to-download-the-activation-key',
					[getKebabCase(productTitle)]
				)}
				.
			</p>

			<div className="d-flex mb-3">
				<label className="cp-subscription-select mr-3">
					{i18n.sub('subscription', [])}

					<div className="position-relative">
						<ClayIcon
							className="select-icon"
							symbol="caret-bottom"
						/>

						<ClaySelect
							onChange={(
								event: React.ChangeEvent<HTMLSelectElement>
							) => {
								setSelectedAccountSubscriptionERC(
									event.target.value
								);
								setSelectedAccountSubscriptionName(
									getKebabCase(
										event.target.options[
											event.target.selectedIndex
										].label
									)
								);
							}}
						>
							{accountSubscriptions.map(
								(accountSubscription: AccountSubscription) => (
									<ClaySelect.Option
										key={
											accountSubscription.accountSubscriptionId
										}
										label={accountSubscription.name}
										value={
											accountSubscription.externalReferenceCode
										}
									/>
								)
							)}
						</ClaySelect>
					</div>
				</label>

				<label className="cp-subscription-term-select">
					{i18n.translate('subscription-term')}

					<div className="position-relative">
						<ClayIcon
							className="select-icon"
							symbol="caret-bottom"
						/>

						<ClaySelect
							onChange={(
								event: React.ChangeEvent<HTMLSelectElement>
							) => {
								setSelectedDateInterval(
									orderItemsDates[
										parseInt(event.target.value, 10)
									]
								);
							}}
						>
							{orderItemsDates.map((dateInterval, index) => {
								const formattedDate = `${getDateCustomFormat(
									FORMAT_DATE_TYPES.day2DMonthSYearN,
									dateInterval.startDate
								)} - ${getDateCustomFormat(
									FORMAT_DATE_TYPES.day2DMonthSYearN,
									dateInterval.endDate
								)}`;

								return (
									<ClaySelect.Option
										className="options"
										key={index}
										label={formattedDate}
										value={index}
									/>
								);
							})}
						</ClaySelect>
					</div>
				</label>
			</div>

			<Button
				className="btn btn-outline-primary"
				disabled={
					hasLicenseDownloadError ||
					!(selectedAccountSubscriptionName && selectDateInterval)
				}
				onClick={handleClick}
				prependIcon="download"
				type="button"
			>
				{i18n.translate('download-key')}
			</Button>

			{hasLicenseDownloadError && currentEnterpriseMessage}

			{accountSubscriptionGroupName === 'enterprise-search' &&
				featureFlags.includes('LPS-185004') && (
					<p className="pt-3 text-neutral-7">
						{`${i18n.translate(
							'for-instructions-on-how-to-setup-your-liferay-enterprise-search-software-please-read-the'
						)} `}

						<a
							href={
								articleGettingStartedWithLiferayEnterpriseSearchURL
							}
							rel="noreferrer noopener"
							target="_blank"
						>
							<u className="font-weight-semi-bold text-neutral-7">
								{i18n.translate(
									'getting-started-with-liferay-enterprise-search-article'
								)}
							</u>
						</a>
					</p>
				)}
		</div>
	);
};

export default ActivationKeysInputs;
