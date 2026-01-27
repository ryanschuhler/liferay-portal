/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useMemo, useState} from 'react';
import i18n from '~/utils/I18n';
import {IActivationKey} from '~/utils/types';

import {ACTIVATION_KEYS_LICENSE_FILTER_TYPES} from '../utils/constants';

export type ActivationKeysLicenseFilterType =
	| 'activated'
	| 'all'
	| 'expired'
	| 'notActivated';

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

export default function usePagination(
	activationKeys: IActivationKey[],
	statusFilter: ActivationKeysLicenseFilterType,
	setAllActivationKeys: React.Dispatch<
		React.SetStateAction<IActivationKey[]>
	> = () => {}
) {
	const [activePage, setActivePage] = useState<number>(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(5);
	const [currentTotalCount, setCurrentTotalCount] = useState<number>(0);

	useEffect(() => {
		if (statusFilter) {
			setActivePage(1);
		}
	}, [statusFilter]);

	const activationKeysFilteredByStatus = useMemo(() => {
		return (
			activationKeys?.filter((activationKey: IActivationKey) =>
				ACTIVATION_KEYS_LICENSE_FILTER_TYPES[statusFilter](
					activationKey
				)
			) || []
		);
	}, [activationKeys, statusFilter]);

	useEffect(() => {
		setAllActivationKeys(activationKeysFilteredByStatus);
	}, [activationKeysFilteredByStatus, setAllActivationKeys]);

	useEffect(() => {
		setCurrentTotalCount(activationKeysFilteredByStatus.length);
	}, [activationKeysFilteredByStatus]);

	const totalPages = useMemo(
		() => Math.ceil(currentTotalCount / itemsPerPage),
		[currentTotalCount, itemsPerPage]
	);

	const paginationConfig: IPaginationConfig = useMemo(
		() => ({
			activePage,
			currentPage: activePage,
			itemsPerPage,
			labels: {
				paginationResults: i18n.translate('showing-x-to-x-of-x'),
				perPageItems: i18n.translate('show-x-items'),
				selectPerPageItems: i18n.translate('x-items'),
			},
			listItemsPerPage: [
				{label: 5},
				{label: 10},
				{label: 20},
				{label: 50},
			],
			onItemsPerPageChange: setItemsPerPage,
			onPageChange: setActivePage,
			setActivePage,
			setItemsPerPage,
			showDeltasDropDown: true,
			totalCount: currentTotalCount,
			totalPages,
		}),
		[activePage, currentTotalCount, itemsPerPage, totalPages]
	);

	const activationKeysByStatusPaginated = useMemo(() => {
		const activationKeysFilteredByStatusPerPage =
			activationKeysFilteredByStatus.slice(
				itemsPerPage * activePage - itemsPerPage,
				itemsPerPage * activePage
			);

		return activationKeysFilteredByStatusPerPage?.length
			? activationKeysFilteredByStatusPerPage
			: activationKeysFilteredByStatus;
	}, [activationKeysFilteredByStatus, activePage, itemsPerPage]);

	return {activationKeysByStatusPaginated, paginationConfig};
}
