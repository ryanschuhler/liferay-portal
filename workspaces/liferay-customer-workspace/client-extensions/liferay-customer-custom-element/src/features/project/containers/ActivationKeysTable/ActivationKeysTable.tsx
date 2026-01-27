/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ButtonWithIcon} from '@clayui/core';
import {useModal} from '@clayui/modal';
import {ClayTooltipProvider} from '@clayui/tooltip';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useLocation, useOutletContext} from 'react-router-dom';
import ActionTable from '~/components/ActionTable';
import RoundedGroupButtons from '~/components/RoundedGroupButtons';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {ALERT_DOWNLOAD_TYPE} from '~/features/project/utils/constants';
import i18n from '~/utils/I18n';
import {IActivationKey, IProject} from '~/utils/types';

import {getLicenseKeyPermanentStatus} from '../GenerateNewKey/utils/licenseKeyPermanentStatus';
import DownloadAlert from './components/DownloadAlert';
import ActivationKeysTableHeader from './components/Header/ActivationKeysTableHeader';
import useFilters from './components/Header/hooks/useFilters';
import ModalKeyDetails from './components/ModalKeyDetails/ModalKeyDetails';
import useGetActivationKeysData from './hooks/useGetActivationKeysData';
import usePagination from './hooks/usePagination';
import useStatusCountNavigation from './hooks/useStatusCountNavigation';
import {ALERT_ACTIVATION_AGGREGATED_KEYS_DOWNLOAD_TEXT} from './utils/constants/alertAggregateKeysDownloadText';
import {ACTIVATE_COLUMNS} from './utils/constants/columns';
import {EnvironmentTypeColumn} from './utils/constants/columns-definitions/EnvironmentTypeColumn';
import {ExpirationDateColumn} from './utils/constants/columns-definitions/ExpirationDateColumn';
import {KeyTypeColumn} from './utils/constants/columns-definitions/KeyTypeColumn';
import {StatusColumn} from './utils/constants/columns-definitions/StatusColumn';
import {getActivationKeyDownload} from './utils/getActivationKeyDownload';
import {getTooltipContentRenderer} from './utils/getTooltipContentRenderer';

import type {DownloadStatusType} from './components/DownloadAlert';
import type {ActivationKeysLicenseFilterType} from './hooks/usePagination';

interface IPaginationConfig {
	activePage: number;
	currentPage: number;
	itemsPerPage: number;
	labels: {
		paginationResults: string;
		perPageItems: string;
		selectPerPageItems: string;
	};
	listItemsPerPage: {label: number}[];
	onItemsPerPageChange: (itemsPerPage: number) => void;
	onPageChange: (page: number) => void;
	setActivePage: React.Dispatch<React.SetStateAction<number>>;
	setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
	showDeltasDropDown: boolean;
	totalCount: number;
	totalPages: number;
}

interface ActivationKeysTableProps {
	hasComplimentaryKey: boolean;
	initialFilter: string;
	isRenewTable?: boolean;
	oAuthToken: string;
	productName: string;
	project: IProject;
	setActivationKeysChecked?: React.Dispatch<
		React.SetStateAction<IActivationKey[]>
	>;
	setKeysSelectedCount?: React.Dispatch<React.SetStateAction<number>>;
	setRenewKeysFilterChecked?: React.Dispatch<React.SetStateAction<string>>;
}

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

declare const Liferay: any;

const messageNewKeyGeneratedAlert = i18n.translate(
	'your-activation-key-was-generated-successfully'
);

const messageDeactivateKey = i18n.translate(
	'your-activation-key-was-deactivated-successfully'
);

const ActivationKeysTable = ({
	hasComplimentaryKey,
	initialFilter,
	isRenewTable = false,
	oAuthToken,
	productName,
	project,
	setActivationKeysChecked = () => {},
	setKeysSelectedCount = () => {},
	setRenewKeysFilterChecked = () => {},
}: ActivationKeysTableProps) => {
	const {provisioningServerAPI} = useAppPropertiesContext();
	const [isVisibleModal, setIsVisibleModal] = useState<boolean>(false);
	const [downloadStatus, setDownloadStatus] =
		useState<DownloadStatusType>('');
	const [
		activationKeysFilteredByRenewable,
		setActivationKeysFilteredByRenewable,
	] = useState<IActivationKey[]>([]);
	const {state} = useLocation();
	const {setHasSideMenu} = useOutletContext<IOutletContext>();

	const messageNewKeyGeneratedAlertForComplimentary = i18n.translate(
		state?.isMultipleKeys
			? 'complimentary-keys-were-generated-successfully'
			: 'complimentary-key-was-generated-successfully'
	);

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	const [newKeyGeneratedAlertStatus, setNewKeyGeneratedAlertStatus] =
		useState<DownloadStatusType>(
			state?.newKeyGeneratedAlert ? 'success' : ''
		);

	const [deactivatedKeyAlertStatus, setDeactivatedKeyAlertStatus] =
		useState<DownloadStatusType>(
			state?.deactivateKeyAlert ? 'success' : ''
		);

	const {
		activationKeysState: [activationKeys, setActivationKeys],
		loading,
		setFilterTerm,
	} = useGetActivationKeysData(project, initialFilter);

	useEffect(() => {
		if (activationKeys) {
			const filteredKeys = (activationKeys as IActivationKey[]).filter(
				(activationKey: IActivationKey) => {
					const isPermanentLicenseKey = getLicenseKeyPermanentStatus(
						activationKey?.startDate,
						activationKey?.expirationDate
					);

					return !isPermanentLicenseKey;
				}
			);
			setActivationKeysFilteredByRenewable(filteredKeys);
		}
	}, [activationKeys]);

	const {
		navigationGroupButtons,
		statusfilterByTitle: [statusFilterValue, setStatusFilter],
	} = useStatusCountNavigation(activationKeys as IActivationKey[]);

	const [allActivationKeys, setAllActivationKeys] = useState<
		IActivationKey[]
	>([]);
	const [hasRenewalSubscription, setHasRenewalSubscription] =
		useState<boolean>(false);
	const [filters, setFilters] = useFilters(
		setFilterTerm,
		productName,
		initialFilter
	);

	const {
		activationKeysByStatusPaginated,
		paginationConfig: rawPaginationConfig,
	} = usePagination(
		isRenewTable
			? activationKeysFilteredByRenewable
			: (activationKeys as IActivationKey[]),
		statusFilterValue as ActivationKeysLicenseFilterType,
		setAllActivationKeys
	);

	const paginationConfig: IPaginationConfig = rawPaginationConfig;

	const [currentActivationKey, setCurrentActivationKey] = useState<
		IActivationKey | undefined
	>(undefined);
	const [activationKeysIdChecked, setActivationKeysIdChecked] = useState<
		(string | number)[]
	>([]);

	const {observer, onClose} = useModal({
		onClose: () => setIsVisibleModal(false),
	});

	const activationKeysByStatusPaginatedChecked: IActivationKey[] = useMemo(
		() =>
			(activationKeys as IActivationKey[]).filter((key: IActivationKey) =>
				activationKeysIdChecked.includes(key.id)
			) || [],
		[activationKeys, activationKeysIdChecked]
	);

	useEffect(() => {
		const renewKeysSelected = () => {
			if (isRenewTable) {
				setActivationKeysChecked(
					activationKeysByStatusPaginatedChecked
				);

				setKeysSelectedCount(activationKeysIdChecked?.length);
			}
		};
		renewKeysSelected();
	}, [
		activationKeysByStatusPaginatedChecked,
		activationKeysIdChecked?.length,
		allActivationKeys,
		isRenewTable,
		setActivationKeysChecked,
		setKeysSelectedCount,
	]);

	useEffect(() => {
		const hasRenewSubscription = (
			allActivationKeys as IActivationKey[]
		).some(
			(item: IActivationKey) =>
				!getLicenseKeyPermanentStatus(
					item?.startDate,
					item?.expirationDate
				)
		);

		setHasRenewalSubscription(hasRenewSubscription);
	}, [allActivationKeys]);

	const handleAlertStatus = useCallback(
		(hasSuccessfullyDownloadedKeys: boolean) => {
			setDownloadStatus(
				hasSuccessfullyDownloadedKeys
					? (ALERT_DOWNLOAD_TYPE.success as DownloadStatusType)
					: (ALERT_DOWNLOAD_TYPE.danger as DownloadStatusType)
			);
		},
		[]
	);

	const getActivationKeysRows = useCallback(
		(activationKey: IActivationKey) => ({
			customClickOnRow: () => {
				setCurrentActivationKey(activationKey);
				setIsVisibleModal(true);
			},
			download: (
				<ButtonWithIcon
					aria-label={i18n.translate('download-key')}
					className="text-dark"
					displayType="unstyled"
					onClick={() =>
						getActivationKeyDownload(
							oAuthToken,
							provisioningServerAPI,
							handleAlertStatus,
							activationKey,
							project.name
						)
					}
					onPointerEnterCapture={() => {}}
					onPointerLeaveCapture={() => {}}
					placeholder=""
					small
					spritemap={(Liferay as any).Icons.spritemap}
					symbol="download"
				/>
			),
			envName: (
				<div
					title={`${activationKey.name}, ${activationKey.description}`}
				>
					<p className="font-weight-bold m-0 text-neutral-10 text-truncate">
						{activationKey.name}
					</p>

					<p className="font-weight-normal m-0 text-neutral-7 text-paragraph-sm text-truncate">
						{activationKey.description}
					</p>
				</div>
			),
			envType: <EnvironmentTypeColumn activationKey={activationKey} />,
			expirationDate: (
				<ExpirationDateColumn activationKey={activationKey} />
			),
			id: activationKey.id,
			keyType: <KeyTypeColumn activationKey={activationKey} />,
			status: <StatusColumn activationKey={activationKey} />,
		}),
		[handleAlertStatus, oAuthToken, provisioningServerAPI, project.name]
	);

	return (
		<>
			{isVisibleModal && currentActivationKey && (
				<ModalKeyDetails
					currentActivationKey={currentActivationKey}
					oAuthToken={oAuthToken}
					observer={observer}
					onClose={onClose}
					productName={productName}
					project={project}
					provisioningServerAPI={provisioningServerAPI}
				/>
			)}
			<ClayTooltipProvider
				contentRenderer={({title}: {title: string}) =>
					getTooltipContentRenderer(title)
				}
				delay={100}
			>
				<div>
					<div className="align-center cp-activation-key-container d-flex justify-content-between mb-2">
						<h3 className="m-0">
							{isRenewTable
								? i18n.sub('renew-x-activation-key', [
										productName,
									])
								: i18n.translate('activation-keys')}
						</h3>

						{!isRenewTable && (
							<RoundedGroupButtons<ActivationKeysLicenseFilterType>
								groupButtons={navigationGroupButtons}
								handleOnChange={setStatusFilter}
							/>
						)}
					</div>

					{isRenewTable && (
						<h6 className="text-neutral-6">
							{i18n.translate(
								'select-the-activation-key-you-wish-to-renew'
							)}
						</h6>
					)}

					<div className="mt-4 py-2">
						<ActivationKeysTableHeader
							activationKeysByStatusPaginatedChecked={
								activationKeysByStatusPaginatedChecked
							}
							activationKeysState={[
								isRenewTable
									? activationKeysFilteredByRenewable
									: (activationKeys as IActivationKey[]),
								setActivationKeys as React.Dispatch<
									React.SetStateAction<IActivationKey[]>
								>,
							]}
							filterState={[filters, setFilters]}
							hasRenewalSubscription={hasRenewalSubscription}
							isRenewTable={isRenewTable}
							loading={loading}
							oAuthToken={oAuthToken}
							productName={productName}
							project={project as IProject}
							setRenewKeysFilterChecked={
								setRenewKeysFilterChecked
							}
						/>
					</div>

					{!!activationKeysByStatusPaginated.length && (
						<ActionTable
							checkboxConfig={{
								checkboxesChecked: activationKeysIdChecked,
								setCheckboxesChecked:
									setActivationKeysIdChecked,
							}}
							className="border-0 cp-activation-key-table"
							columns={ACTIVATE_COLUMNS}
							handleSortChange={() => {}}
							hasCheckbox
							hasPagination
							isLoading={loading}
							paginationConfig={paginationConfig}
							rows={(
								activationKeysByStatusPaginated as IActivationKey[]
							).map((activationKey: IActivationKey) =>
								getActivationKeysRows(activationKey)
							)}
						/>
					)}

					{!activationKeysByStatusPaginated.length &&
						(filters.searchTerm || filters.hasValue) && (
							<div className="d-flex justify-content-center py-4">
								{i18n.translate(
									'no-activation-keys-found-with-this-search-criteria'
								)}
							</div>
						)}
				</div>
			</ClayTooltipProvider>

			{!!downloadStatus && (
				<DownloadAlert
					downloadStatus={downloadStatus}
					message={
						ALERT_ACTIVATION_AGGREGATED_KEYS_DOWNLOAD_TEXT[
							downloadStatus
						]
					}
					setDownloadStatus={setDownloadStatus}
				/>
			)}

			{!!newKeyGeneratedAlertStatus && (
				<DownloadAlert
					downloadStatus={newKeyGeneratedAlertStatus}
					message={
						!hasComplimentaryKey
							? messageNewKeyGeneratedAlert
							: messageNewKeyGeneratedAlertForComplimentary
					}
					setDownloadStatus={setNewKeyGeneratedAlertStatus}
				/>
			)}

			{!!deactivatedKeyAlertStatus && (
				<DownloadAlert
					downloadStatus={deactivatedKeyAlertStatus}
					message={messageDeactivateKey}
					setDownloadStatus={setDeactivatedKeyAlertStatus}
				/>
			)}
		</>
	);
};

export default ActivationKeysTable;
