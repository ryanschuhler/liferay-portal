/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback} from 'react';
import BadgeButton from '~/components/BadgeButton';
import Button from '~/components/Button';
import {INITIAL_FILTER} from '~/features/project/containers/ActivationKeysTable/utils/constants/initialFilter';
import i18n from '~/utils/I18n';
import {FORMAT_DATE_TYPES} from '~/utils/constants';
import getDateCustomFormat from '~/utils/getDateCustomFormat';
import {DateFilterValue, IFilters, KeyTypeFilterValue} from '~/utils/types';

const DNE_YEARS = 100;

interface BadgeFilterProps {
	activationKeysLength: number;
	filtersState: [IFilters, React.Dispatch<React.SetStateAction<IFilters>>];
	loading: boolean;
}

interface IDateFilterState {
	value: DateFilterValue;
}

interface IKeyTypeFilter {
	name: string;
	value: KeyTypeFilterValue;
}

const BadgeFilter = ({
	activationKeysLength,
	loading,
	filtersState: [filters, setFilters],
}: BadgeFilterProps) => {
	const getDatesDisplay = useCallback(
		(dateFilterState: IDateFilterState): string => {
			const dateDisplays: string[] = [];

			if (dateFilterState.value) {
				if (typeof dateFilterState.value.onOrAfter === 'string') {
					const onOrAfterDate = dateFilterState.value.onOrAfter;
					const todayDNE = new Date();
					todayDNE.setFullYear(todayDNE.getFullYear() + DNE_YEARS);

					if (new Date(onOrAfterDate) >= todayDNE) {
						return i18n.translate('dne');
					}

					const formattedDate = getDateCustomFormat(
						FORMAT_DATE_TYPES.day2DMonthSYearN,
						onOrAfterDate
					);

					if (formattedDate) {
						dateDisplays.push(formattedDate);
					}
				}

				if (typeof dateFilterState.value.onOrBefore === 'string') {
					const onOrBeforeDate = dateFilterState.value.onOrBefore;
					const formattedDate = getDateCustomFormat(
						FORMAT_DATE_TYPES.day2DMonthSYearN,
						onOrBeforeDate
					);

					if (formattedDate) {
						dateDisplays.push(formattedDate);
					}
				}
			}

			return dateDisplays.join(' – ');
		},
		[]
	);

	const getKeyTypeDisplay = useCallback(
		(filterKeyType: IKeyTypeFilter): React.ReactNode => {
			const keyTypesDisplay: string[] = [];

			if (filterKeyType.value?.hasOnPremise) {
				keyTypesDisplay.push(i18n.translate('on-premise'));
			}

			if (filterKeyType.value?.hasVirtualCluster) {
				if (
					!(
						filterKeyType.value?.minNodes ||
						filterKeyType.value?.maxNodes
					)
				) {
					keyTypesDisplay.push(i18n.translate('virtual-cluster'));
				}
				else if (
					filterKeyType.value?.minNodes ===
					filterKeyType.value?.maxNodes
				) {
					keyTypesDisplay.push(
						i18n.sub('virtual-cluster-x-nodes', [
							filterKeyType.value?.minNodes as string,
						])
					);
				}
				else {
					const nodesDisplay: string[] = [];

					if (filterKeyType.value?.minNodes) {
						nodesDisplay.push(filterKeyType.value?.minNodes);
					}

					if (filterKeyType.value?.maxNodes) {
						nodesDisplay.push(filterKeyType.value?.maxNodes);
					}

					keyTypesDisplay.push(
						i18n.sub('virtual-cluster-x-nodes', [
							nodesDisplay.join('-'),
						])
					);
				}
			}

			return (
				<BadgeButton
					filterName={filterKeyType.name}
					filterValue={keyTypesDisplay.join(', ')}
					onClick={() =>
						setFilters((previousFilters) => ({
							...previousFilters,
							keyType: {
								...previousFilters.keyType,
								value: {
									hasOnPremise: undefined,
									hasVirtualCluster: undefined,
									maxNodes: '',
									minNodes: '',
								},
							},
						}))
					}
				/>
			);
		},
		[setFilters]
	);

	return (
		<>
			<div className="d-flex">
				{!!filters.searchTerm && !loading && (
					<p className="font-weight-semi-bold m-0 mt-3 text-paragraph-sm">
						{activationKeysLength > 1
							? `${i18n.sub('x-results-for-x', [
									activationKeysLength.toString(),
									`"${filters.searchTerm}"`,
								])}`
							: `${i18n.sub('x-result-for-x', [
									activationKeysLength.toString(),
									`"${filters.searchTerm}"`,
								])}`}
					</p>
				)}
			</div>
			<div className="bd-highlight d-flex">
				<div className="bd-highlight col d-flex flex-wrap pl-0 pt-2 w-100">
					{!!Object.values(filters.keyType.value).some(
						(value) => !!value
					) && getKeyTypeDisplay(filters.keyType)}

					{!!filters.environmentTypes.value?.length && (
						<BadgeButton
							filterName={filters.environmentTypes.name}
							filterValue={filters.environmentTypes.value.join(
								', '
							)}
							onClick={() =>
								setFilters((previousFilters) => ({
									...previousFilters,
									environmentTypes: {
										...previousFilters.environmentTypes,
										value: [],
									},
								}))
							}
						/>
					)}

					{!!filters.instanceSizes.value?.length && (
						<BadgeButton
							filterName={filters.instanceSizes.name}
							filterValue={filters.instanceSizes.value.join(', ')}
							onClick={() =>
								setFilters((previousFilters) => ({
									...previousFilters,
									instanceSizes: {
										...previousFilters.instanceSizes,
										value: [],
									},
								}))
							}
						/>
					)}

					{!!filters.productVersions.value?.length && (
						<BadgeButton
							filterName={filters.productVersions.name}
							filterValue={filters.productVersions.value.join(
								', '
							)}
							onClick={() =>
								setFilters((previousFilters) => ({
									...previousFilters,
									productVersions: {
										...previousFilters.productVersions,
										value: [],
									},
								}))
							}
						/>
					)}

					{!!filters.status.value?.length && (
						<BadgeButton
							filterName={filters.status.name}
							filterValue={filters.status.value.join(', ')}
							onClick={() =>
								setFilters((previousFilters) => ({
									...previousFilters,
									status: {
										...previousFilters.status,
										value: [],
									},
								}))
							}
						/>
					)}

					{!!(
						filters.expirationDate.value.onOrAfter ||
						filters.expirationDate.value.onOrBefore
					) && (
						<BadgeButton
							filterName={filters.expirationDate.name}
							filterValue={getDatesDisplay(
								filters.expirationDate
							)}
							onClick={() =>
								setFilters((previousFilters) => ({
									...previousFilters,
									expirationDate: {
										...previousFilters.expirationDate,
										value: {
											onOrAfter: false,
											onOrBefore: false,
										},
									},
								}))
							}
						/>
					)}

					{!!(
						filters.startDate.value.onOrAfter ||
						filters.startDate.value.onOrBefore
					) && (
						<BadgeButton
							filterName={filters.startDate.name}
							filterValue={getDatesDisplay(filters.startDate)}
							onClick={() =>
								setFilters((previousFilters) => ({
									...previousFilters,
									startDate: {
										...previousFilters.startDate,
										value: {
											onOrAfter: false,
											onOrBefore: false,
										},
									},
								}))
							}
						/>
					)}
				</div>

				<div className="bd-highlight flex-shrink-2 pt-2">
					{filters.hasValue && (
						<Button
							borderless
							className="link"
							onClick={() => {
								setFilters({
									...INITIAL_FILTER,
									searchTerm: filters.searchTerm,
								});
							}}
							prependIcon="times-circle"
							small
						>
							{i18n.translate('clear-all-filters')}
						</Button>
					)}
				</div>
			</div>
		</>
	);
};

export default BadgeFilter;
