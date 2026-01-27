/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useLocation, useOutletContext} from 'react-router-dom';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {DOWNLOADABLE_LICENSE_KEYS} from '~/features/project/containers/ActivationKeysTable/utils/constants/downloadableLicenseKeys';
import {hasAdminUserAccount} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminUserAccount';
import {isBulkRenewAvailable} from '~/features/project/containers/ActivationKeysTable/utils/isBulkRenewAvailable';
import {useGetMyUserAccount} from '~/services/liferay/graphql/user-accounts/queries/useGetMyUserAccount';
import i18n from '~/utils/I18n';
import {
	ALERT_ACTIVATION_AGGREGATED_KEYS_DOWNLOAD_TEXT,
	ALERT_ACTIVATION_MULTIPLE_KEYS_DOWNLOAD_TEXT,
	ALERT_DOWNLOAD_TYPE,
} from '~/utils/constants/alerts';
import {ROLE_TYPES} from '~/utils/constants/roleTypes';
import {
	IActivationKey,
	IFilters,
	IMyAccountApollo,
	IProject,
	IRoleBrief,
	ISelectedKey,
	IUserAccount,
} from '~/utils/types';

import ActionButton from '../ActionButton';
import BadgeFilter from '../BadgeFilter';
import DeactivateButton from '../DeactivateButton';
import DownloadAlert, {DownloadStatusType} from '../DownloadAlert';
import Filter from '../Filter';
import RenewButton from '../RenewButton';
import useGetAccountUserAccount from './hooks/useGetAccountUserAccount';

interface ActivationKeysTableHeaderProps {
	activationKeysByStatusPaginatedChecked: IActivationKey[];
	activationKeysState: [
		IActivationKey[],
		React.Dispatch<React.SetStateAction<IActivationKey[]>>,
	];
	filterState: [IFilters, React.Dispatch<React.SetStateAction<IFilters>>];
	hasRenewalSubscription: boolean;
	isRenewTable: boolean;
	loading: boolean;
	oAuthToken: string | undefined;
	productName: string;
	project: IProject;
	setRenewKeysFilterChecked: React.Dispatch<React.SetStateAction<string>>;
}

interface IStatusState {
	deactivate: string;
	downloadAggregated: string;
	downloadMultiple: string;
}

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

declare const Liferay: any;

const ActivationKeysTableHeader = ({
	activationKeysByStatusPaginatedChecked,
	activationKeysState,
	filterState: [filters, setFilters],
	hasRenewalSubscription,
	isRenewTable,
	loading,
	oAuthToken,
	productName,
	project,
	setRenewKeysFilterChecked,
}: ActivationKeysTableHeaderProps) => {
	const [activationKeys, setActivationKeys] = activationKeysState;

	useLocation();
	const {setHasSideMenu} = useOutletContext<IOutletContext>();

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	const {userAccounts} = useGetAccountUserAccount(project);

	const {data: myAccount} = useGetMyUserAccount();

	const isAdminUserAccount = hasAdminUserAccount(
		myAccount as IMyAccountApollo
	);

	const isAdminOrPartnerManager = useMemo(() => {
		const currentUser = userAccounts?.find(
			(user: IUserAccount) =>
				user.id === Number(Liferay.ThemeDisplay.getUserId())
		);

		if (currentUser) {
			const hasAdminRoles =
				currentUser?.accountBriefs?.[0]?.roleBriefs?.some(
					(role: IRoleBrief) =>
						role.name === ROLE_TYPES.admin.key ||
						role.name === ROLE_TYPES.partnerManager.key
				);

			return hasAdminRoles ?? false;
		}

		return false;
	}, [userAccounts]);

	const {featureFlags} = useAppPropertiesContext();

	const [status, setStatus] = useState<IStatusState>({
		deactivate: '',
		downloadAggregated: '',
		downloadMultiple: '',
	});

	const filterCheckedActivationKeys = useMemo(
		() =>
			activationKeysByStatusPaginatedChecked
				.map((key) => key.id)
				.join(','),
		[activationKeysByStatusPaginatedChecked]
	);

	const isAbleToDownloadAggregateKeys = useMemo(() => {
		const [firstActivationKeyChecked, ...restActivationKeysChecked] =
			activationKeysByStatusPaginatedChecked;

		const toSelectedKey = (key: IActivationKey): ISelectedKey => ({
			expirationDate: key.expirationDate,
			licenseEntryType: key.licenseEntryType,
			licenseVersion: key.licenseVersion ?? 0,
			productVersion: key.productVersion,
			sizing: key.sizing,
			startDate: key.startDate,
		});

		const firstSelectedKey = toSelectedKey(firstActivationKeyChecked);

		return restActivationKeysChecked.every(
			(activationKeyChecked: IActivationKey) => {
				const selectedKey = toSelectedKey(activationKeyChecked);

				return (
					DOWNLOADABLE_LICENSE_KEYS.above71DXPVersion(
						firstSelectedKey,
						selectedKey
					) ||
					DOWNLOADABLE_LICENSE_KEYS.below71DXPVersion(
						firstSelectedKey,
						selectedKey
					)
				);
			}
		);
	}, [activationKeysByStatusPaginatedChecked]);

	const handleDeactivate = useCallback(
		() =>
			setActivationKeys((previousActivationKeys: IActivationKey[]) =>
				previousActivationKeys.filter(
					(activationKey: IActivationKey) =>
						!activationKeysByStatusPaginatedChecked.find(
							({id}) => activationKey.id === id
						)
				)
			),
		[activationKeysByStatusPaginatedChecked, setActivationKeys]
	);

	const allowSelfProvisioning = project.allowSelfProvisioning;

	const bulkRenewAvailable = isBulkRenewAvailable(
		activationKeysByStatusPaginatedChecked
	);

	const isComplimentaryKey = activationKeysByStatusPaginatedChecked.some(
		(activationKey: IActivationKey) => activationKey.complimentary
	);

	useEffect(() => {
		if (isRenewTable) {
			setRenewKeysFilterChecked(filterCheckedActivationKeys);
		}
	}, [filterCheckedActivationKeys, isRenewTable, setRenewKeysFilterChecked]);

	return (
		<>
			<div className="bg-neutral-1 d-flex flex-column pb-1 pt-3 px-3 rounded">
				<div className="d-flex">
					<Filter
						activationKeys={activationKeys}
						filtersState={[filters, setFilters]}
					/>

					<div className="align-items-center d-flex ml-auto">
						{!!activationKeysByStatusPaginatedChecked.length &&
							!isRenewTable && (
								<>
									<p className="font-weight-semi-bold m-0 ml-auto pr-2 text-neutral-10">
										{i18n.sub('x-of-x-keys-selected', [
											activationKeysByStatusPaginatedChecked.length.toString(),
											activationKeys.length.toString(),
										])}
									</p>

									{(isAdminUserAccount ||
										isAdminOrPartnerManager) &&
										allowSelfProvisioning && (
											<DeactivateButton
												deactivateKeysStatus={
													status.deactivate
												}
												filterCheckedActivationKeys={
													activationKeysByStatusPaginatedChecked
												}
												handleDeactivate={
													handleDeactivate
												}
												oAuthToken={oAuthToken}
												setDeactivateKeysStatus={(
													value: string
												) =>
													setStatus(
														(
															previousStatus: IStatusState
														) => ({
															...previousStatus,
															deactivate: value,
														})
													)
												}
											/>
										)}
								</>
							)}

						{featureFlags.includes('ISSD-78') &&
							(isAdminUserAccount || isAdminOrPartnerManager) &&
							allowSelfProvisioning &&
							activationKeysByStatusPaginatedChecked.length >=
								2 &&
							bulkRenewAvailable &&
							!isRenewTable && (
								<RenewButton
									activationKeysByStatusPaginatedChecked={
										activationKeysByStatusPaginatedChecked
									}
									filterCheckedActivationKeys={
										filterCheckedActivationKeys
									}
									identifier="renew"
									isComplimentaryKey={isComplimentaryKey}
								>
									{i18n.translate('renew')}
								</RenewButton>
							)}

						{!isRenewTable && (
							<ActionButton
								activationKeysByStatusPaginatedChecked={
									activationKeysByStatusPaginatedChecked
								}
								filterCheckedActivationKeys={
									activationKeysByStatusPaginatedChecked
								}
								hasRenewalSubscription={hasRenewalSubscription}
								identifier="action"
								isAbleToDownloadAggregateKeys={
									isAbleToDownloadAggregateKeys
								}
								isAdminOrPartnerManager={
									isAdminOrPartnerManager
								}
								isAdminUserAccount={isAdminUserAccount}
								oAuthToken={oAuthToken as string}
								productName={productName}
								project={project}
								setStatus={setStatus}
							/>
						)}
					</div>
				</div>

				<BadgeFilter
					activationKeysLength={activationKeys?.length}
					filtersState={[filters, setFilters]}
					loading={loading}
				/>
			</div>

			{status.downloadAggregated && (
				<DownloadAlert
					downloadStatus={
						status.downloadAggregated as 'success' | 'danger'
					}
					message={
						ALERT_ACTIVATION_AGGREGATED_KEYS_DOWNLOAD_TEXT[
							status.downloadAggregated as 'success' | 'danger'
						]
					}
					setDownloadStatus={(value: DownloadStatusType) =>
						setStatus((previousStatus: IStatusState) => ({
							...previousStatus,
							downloadAggregated: value,
						}))
					}
				/>
			)}

			{status.downloadMultiple && (
				<DownloadAlert
					downloadStatus={
						status.downloadMultiple as 'success' | 'danger'
					}
					message={
						ALERT_ACTIVATION_MULTIPLE_KEYS_DOWNLOAD_TEXT[
							status.downloadMultiple as 'success' | 'danger'
						]
					}
					setDownloadStatus={(value: DownloadStatusType) =>
						setStatus((previousStatus: IStatusState) => ({
							...previousStatus,
							downloadMultiple: value,
						}))
					}
				/>
			)}

			{status.deactivate === ALERT_DOWNLOAD_TYPE.success && (
				<DownloadAlert
					downloadStatus="success"
					message={i18n.translate(
						'activation-keys-were-deactivated-successfully'
					)}
					setDownloadStatus={(value: DownloadStatusType) =>
						setStatus((previousStatus: IStatusState) => ({
							...previousStatus,
							deactivate: value,
						}))
					}
				/>
			)}

			{!isAbleToDownloadAggregateKeys && (
				<ClayAlert className="my-2" displayType="info">
					<div
						dangerouslySetInnerHTML={{
							__html: i18n.sub(
								'to-download-an-aggregate-key-select-keys-for-a-valid-liferay-version-with-identical-type-start-date-end-date-and-instance-size-to-learn-more-click-x-here-x',
								[
									'<a href="https://support.liferay.com/w/how-do-i-download-my-liferay-dxp-portal-activation-keys" target="_blank">',
									'</a>',
								]
							),
						}}
					/>
				</ClayAlert>
			)}
		</>
	);
};

export default ActivationKeysTableHeader;
