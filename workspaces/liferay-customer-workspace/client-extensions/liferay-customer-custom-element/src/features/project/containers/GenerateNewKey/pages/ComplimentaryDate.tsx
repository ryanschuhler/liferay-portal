/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayDatePicker from '@clayui/date-picker';
import {ClayCheckbox, ClayInput, ClaySelect} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import {useCallback, useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Button} from '~/components';
import Layout from '~/components/FormLayout';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import useProvisioningLicenseKeys from '~/hooks/useProvisioningLicenseKeys';
import {putSubscriptionInKey} from '~/services/liferay/rest/raysource/LicenseKeys';
import i18n from '~/utils/I18n';
import {IActivationKey} from '~/utils/types';

import {IGenerateNewKeyState} from '../types';
import {STEP_TYPES} from '../utils/constants/stepType';
import {getRenewKeySubtitle} from '../utils/renewKeySubtitle';
import useGetPurposeComplimentaryKeyList from './hooks/useGetPurposeComplimentaryKeyList';

const now = new Date();
const NAVIGATION_YEARS_RANGE = 2;
const SELECTED_PURPOSE_OTHER = 'Other, please specify';

interface ISelectedKeyData {
	licenseEntryType?: string;
	productType?: string;
	productVersion?: string;
	selectedSubscription?: {
		complimentary?: boolean;
		endDate?: string;
		instanceSize?: number;
		perpetual?: boolean;
		productKey?: string;
		provisionedCount?: number;
		quantity?: number;
		startDate?: string;
	};
	[key: string]: any;
}

interface ComplimentaryDateProps {
	accountKey: string;
	deactivateKeysStatus: string;
	filterCheckedActivationKeys: IActivationKey[];
	oAuthToken: string;
	productGroupName: string;
	purposeDescription: string;
	selectedKeyData: ISelectedKeyData | undefined;
	setDeactivateKeysStatus: (value: string) => void;
	setPurposeDescription: React.Dispatch<React.SetStateAction<string>>;
	setSelectedKeyData: React.Dispatch<
		React.SetStateAction<ISelectedKeyData | undefined>
	>;
	setStep: React.Dispatch<
		React.SetStateAction<(typeof STEP_TYPES)[keyof typeof STEP_TYPES]>
	>;
	state: IGenerateNewKeyState;
	urlPreviousPage: string;
}

const ComplimentaryDate = ({
	accountKey,
	oAuthToken,
	purposeDescription,
	selectedKeyData,
	setPurposeDescription,
	setSelectedKeyData,
	setStep,
	state,
	urlPreviousPage,
}: ComplimentaryDateProps) => {
	const navigate = useNavigate();
	const {provisioningServerAPI} = useAppPropertiesContext();
	const currentDate = now.toISOString().split('T')[0];
	const [selectedStartDate, setSelectedStartDate] =
		useState<string>(currentDate);
	const [checkedBoxSubscription, setCheckedBoxSubscription] =
		useState<boolean>(false);
	const [isLoadingGenerateKey, setIsLoadingGenerateKey] =
		useState<boolean>(false);
	const [expandedOnOrAfter, setExpandedOnOrAfter] = useState<boolean>(false);
	const [selectedPurpose, setSelectedPurpose] = useState<string>('');
	const purposeComplimentaryKeyList = useGetPurposeComplimentaryKeyList();

	const {endDate, startDate} = useMemo(() => {
		const inputStartDate = new Date(selectedStartDate);
		const timestamp = inputStartDate.getTime();
		const timezoneOffset = inputStartDate.getTimezoneOffset() * 60000;
		const startDateFormatted = new Date(timestamp + timezoneOffset);
		const startDate = new Date(timestamp + timezoneOffset);
		const endDate = new Date(
			startDateFormatted.setDate(startDateFormatted.getDate() + 30)
		);

		return {
			endDate,
			inputStartDate,
			startDate,
			startDateFormatted,
		};
	}, [selectedStartDate]);

	const {provisioningLicenseKeys: provisioningService} =
		useProvisioningLicenseKeys(
			selectedStartDate,
			endDate.toISOString().split('T')[0],
			false
		);

	const hasDateLimitExceeded = useMemo(() => {
		const daysLimit = 29;

		const startDateLimit = new Date();

		startDateLimit.setDate(startDateLimit.getDate() - daysLimit);

		return startDate < startDateLimit;
	}, [startDate]);

	const isRenew = state?.id === 'renew';
	const keyCount = state?.activationKeys?.length || 0;
	const renewKeySubtitle = getRenewKeySubtitle(state);

	const isComplimentaryKeys = state.activationKeys?.map(
		(item: IActivationKey) => {
			return item.complimentary;
		}
	);
	const isComplimentaryKey = [...new Set(isComplimentaryKeys)].join(', ');

	const hasDesiredEntry = state.activationKeys?.some(
		(item: IActivationKey) =>
			item.licenseEntryType === 'oem' ||
			item.licenseEntryType === 'virtual-cluster' ||
			item.licenseEntryType === 'enterprise'
	);

	const submitKey = useCallback(async () => {
		const selectedFields = [
			'active',
			'description',
			'hostName',
			'ipAddresses',
			'licenseEntryType',
			'macAddresses',
			'maxClusterNodes',
			'name',
			'productName',
			'productVersion',
			'sizing',
		];

		const saveSubscriptionKey = async (id: string) => {
			return putSubscriptionInKey(oAuthToken, provisioningServerAPI, id);
		};

		const generateLicenseKey = async (
			item: IActivationKey,
			isComplimentary = false
		) => {
			const licenseKey: any = {
				accountKey,
				complimentary: 'true',
				expirationDate: endDate.toISOString().split('T')[0],
				productKey: selectedKeyData?.selectedSubscription?.productKey,
				startDate: selectedStartDate,
			};
			selectedFields.forEach((field) => {
				licenseKey[field] = (item as any)[field];
			});

			if (!provisioningService) {
				throw new Error('Provisioning service not available.');
			}
			const response: any =
				await provisioningService.createNewGenerateKey(
					accountKey,
					licenseKey
				);

			if (checkedBoxSubscription && isComplimentary) {
				await saveSubscriptionKey(response?.items?.[0]?.id as string);
			}
		};

		setIsLoadingGenerateKey(true);

		try {
			const updatedActivationKeysItem = state.activationKeys?.map(
				(item) => ({
					...item,
					description: purposeDescription,
				})
			);

			if (hasDesiredEntry) {
				const createKeyPromises = updatedActivationKeysItem?.map(
					async (item: IActivationKey) => {
						await generateLicenseKey(item);
					}
				);

				await Promise.all(createKeyPromises || []);

				setIsLoadingGenerateKey(false);

				navigate(urlPreviousPage, {
					state: {
						isMultipleKeys: keyCount > 1,
						newKeyGeneratedAlert: true,
					},
				});

				return true;
			}
			else {
				const results = await Promise.all(
					updatedActivationKeysItem?.map(
						async (item: IActivationKey) => {
							await generateLicenseKey(
								item,
								isComplimentaryKey === 'true'
							);
						}
					) || []
				);

				await Promise.all(results);

				setIsLoadingGenerateKey(false);

				navigate(urlPreviousPage, {
					state: {
						isMultipleKeys: keyCount > 1,
						newKeyGeneratedAlert: true,
					},
				});

				return true;
			}
		}
		catch (error: any) {
			Liferay.Util.openToast({
				message:
					error?.info?.title ??
					i18n.translate('an-unexpected-error-occurred'),
				title: i18n.translate('error'),
				type: 'danger',
			});

			console.error(error);
			setIsLoadingGenerateKey(false);

			return false;
		}
	}, [
		accountKey,
		checkedBoxSubscription,
		endDate,
		hasDesiredEntry,
		isComplimentaryKey,
		selectedKeyData,
		navigate,
		oAuthToken,
		provisioningServerAPI,
		provisioningService,
		purposeDescription,
		selectedStartDate,
		state.activationKeys,
		urlPreviousPage,
		keyCount,
	]);

	return (
		<div>
			<Layout
				footerProps={{
					footerClass: 'mx-5 mb-2',
					leftButton: (
						<Link to={urlPreviousPage}>
							<Button
								className="btn btn-borderless btn-style-neutral"
								displayType="secondary"
							>
								{i18n.translate('cancel')}
							</Button>
						</Link>
					),
					middleButton: (
						<div>
							<Button
								className="btn btn-secondary mr-3"
								displayType="secondary"
								onClick={() => {
									setSelectedKeyData(() => ({
										selectedSubscription: {},
									}));
									setStep('selectDescriptions');
								}}
							>
								{i18n.translate('previous')}
							</Button>

							<Button
								disabled={
									!checkedBoxSubscription ||
									!purposeDescription ||
									!selectedStartDate ||
									hasDateLimitExceeded ||
									isLoadingGenerateKey
								}
								displayType="primary"
								isLoading={isLoadingGenerateKey}
								onClick={submitKey}
							>
								{isRenew && keyCount > 1
									? i18n.sub('renew-x-keys', [
											keyCount.toString(),
										])
									: i18n.translate('next')}
							</Button>
						</div>
					),
				}}
				headerProps={{
					headerClass: 'ml-5 mt-4 mb-3',
					helper: isRenew
						? renewKeySubtitle
						: i18n.translate(
								'select-the-subscription-and-key-type-you-would-like-to-generate'
							),
					title: i18n.translate(
						isRenew
							? 'renew-activation-keys'
							: 'generate-activation-keys'
					),
				}}
				layoutType="cp-generateKey"
			>
				<div className="h-50 mx-6">
					<h2>{i18n.translate('complimentary')}</h2>

					<p>
						{i18n.translate(
							'you-can-use-this-option-to-generate-complimentary-activation-keys-with-a-duration-of-30-days'
						)}
					</p>

					<h5>{i18n.translate('start-date')}</h5>

					<ClayDatePicker
						dateFormat="yyyy-MM-dd"
						expanded={expandedOnOrAfter}
						onChange={(value: string) => {
							setSelectedStartDate(value);

							if (!value) {
								setExpandedOnOrAfter(false);
							}
						}}
						onExpandedChange={setExpandedOnOrAfter}
						placeholder={i18n.translate('yyyy-mm-dd')}
						value={selectedStartDate}
						years={{
							end: now.getFullYear() + NAVIGATION_YEARS_RANGE,
							start:
								now.getFullYear() -
								(now.getMonth() === 0 ? 1 : 0),
						}}
					/>

					{hasDateLimitExceeded && (
						<p className="text-danger">
							{i18n.translate(
								'the-start-date-must-be-less-than-30-days-ago'
							)}
						</p>
					)}

					<p>
						{i18n.translate(
							'choose-the-date-you-would-like-this-option-to-start'
						)}
					</p>

					<h5>{i18n.translate('purpose-of-complimentary-key')}</h5>

					<div className="position-relative">
						<ClaySelect
							className="mr-2 pr-6 w-100"
							onChange={({target}) => {
								setSelectedPurpose(target.value);
								setPurposeDescription(() =>
									target.value === SELECTED_PURPOSE_OTHER
										? ''
										: target.value
								);
							}}
							value={selectedPurpose}
						>
							{[
								...purposeComplimentaryKeyList,
								{
									label: i18n.translate(
										'other-please-specify'
									),
									value: SELECTED_PURPOSE_OTHER,
								},
							]?.map((item) => (
								<ClaySelect.Option
									key={item.label}
									label={item.label}
									value={item.value}
								/>
							))}
						</ClaySelect>

						<ClayIcon
							aria-label="Caret Icon Bottom"
							className="select-icon"
							symbol="caret-bottom"
						/>
					</div>

					{selectedPurpose === SELECTED_PURPOSE_OTHER && (
						<div className="pt-3">
							<ClayInput
								component="textarea"
								name="description"
								onChange={(
									event: React.ChangeEvent<HTMLInputElement>
								) => setPurposeDescription(event.target.value)}
								placeholder={i18n.translate(
									'enter-the-purpose'
								)}
								type="text"
								value={purposeDescription}
							/>
						</div>
					)}

					<h5 className="mt-4">
						{i18n.translate('confirmation-terms')}
					</h5>

					<div className="d-flex mt-4">
						<div className="pr-2 pt-1">
							<ClayCheckbox
								checked={checkedBoxSubscription}
								id="expiration-checkbox"
								onChange={() =>
									setCheckedBoxSubscription(
										(checkedBoxSubscription) =>
											!checkedBoxSubscription
									)
								}
							/>
						</div>

						<label>
							{i18n.translate(
								'the-requested-activation-key-exceeds-the-purchased-subscriptions-for-this-liferay-project-in-case-of-unauthorized-use-liferay-can-request-financial-compensation-for-breach-of-use'
							)}
						</label>
					</div>

					<div className="dropdown-divider mt-6"></div>
				</div>
			</Layout>
		</div>
	);
};

export default ComplimentaryDate;
