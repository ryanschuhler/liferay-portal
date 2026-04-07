/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useRef, useState} from 'react';
import {Button} from '~/components';
import FilterDropdown from '~/components/Filter/components/FilterDropdown';
import SearchBar from '~/components/SearchBar';
import {
	getDoesNotExpire,
	getDropDownAvailableFields,
	getEnvironmentType,
	getInstanceSize,
	getProductDescription,
	getStatusActivationTag,
	hasVirtualCluster,
} from '~/features/project/containers/ActivationKeysTable/utils';
import {hasCluster} from '~/features/project/containers/ActivationKeysTable/utils/hasCluster';
import i18n from '~/utils/I18n';
import {IActivationKey, IFilters} from '~/utils/types';

import getAvailableFieldsCheckboxs from '../../utils/getAvailableFieldsCheckboxs';

const MAX_UPDATE = 3;

interface IAvailableFields {
	environmentTypes: (string | number)[];
	hasCluster: boolean;
	hasDNE: boolean;
	hasVirtualCluster: boolean;
	instanceSizes: (string | number)[];
	productVersions: (string | number)[];
	status: (string | number)[];
}

interface IProps {
	activationKeys: IActivationKey[];
	filtersState: [IFilters, React.Dispatch<React.SetStateAction<IFilters>>];
}

const Filter = ({
	activationKeys,
	filtersState: [filters, setFilters],
}: IProps) => {
	const countFetchActivationKeysRef = useRef<number>(0);

	const [availableFields, setAvailableFields] = useState<IAvailableFields>({
		environmentTypes: [],
		hasCluster: false,
		hasDNE: false,
		hasVirtualCluster: false,
		instanceSizes: [],
		productVersions: [],
		status: [],
	});

	useEffect(() => {
		if (activationKeys) {
			countFetchActivationKeysRef.current =
				++countFetchActivationKeysRef.current;
		}
	}, [activationKeys]);

	useEffect(() => {
		if (
			activationKeys &&
			countFetchActivationKeysRef?.current < MAX_UPDATE
		) {
			setAvailableFields({
				environmentTypes: [
					...getAvailableFieldsCheckboxs(
						activationKeys,
						(activationKey: IActivationKey) =>
							activationKey &&
							getEnvironmentType(activationKey.productName)
					),
					...getAvailableFieldsCheckboxs(
						activationKeys,
						(activationKey: IActivationKey) =>
							activationKey &&
							getProductDescription(activationKey.complimentary)
					),
				],
				hasCluster: activationKeys?.some(
					(activationKey: IActivationKey) =>
						activationKey &&
						hasCluster(activationKey.licenseEntryType)
				),
				hasDNE: activationKeys?.some(
					(activationKey: IActivationKey) =>
						activationKey &&
						getDoesNotExpire(activationKey.expirationDate)
				),
				hasVirtualCluster: activationKeys?.some(
					(activationKey: IActivationKey) =>
						activationKey &&
						hasVirtualCluster(activationKey.licenseEntryType)
				),
				instanceSizes: getAvailableFieldsCheckboxs(
					activationKeys,
					(activationKey: IActivationKey) =>
						activationKey && +getInstanceSize(activationKey.sizing)
				),
				productVersions: getAvailableFieldsCheckboxs(
					activationKeys,
					(activationKey: IActivationKey) =>
						activationKey && activationKey.productVersion
				),
				status: getAvailableFieldsCheckboxs(
					activationKeys,
					(activationKey: IActivationKey) =>
						activationKey &&
						getStatusActivationTag(activationKey)?.title
				),
			});
		}
	}, [activationKeys]);

	return (
		<div className="d-flex flex-column">
			<div className="d-flex">
				<SearchBar
					onSearchSubmit={(term: string) => {
						setFilters((previousFilters) => ({
							...previousFilters,
							searchTerm: term,
						}));
					}}
				/>

				<FilterDropdown
					className="align-items-center d-flex"
					initialActiveMenu="x0a0"
					menus={getDropDownAvailableFields(
						availableFields,
						filters,
						setFilters
					)}
					trigger={
						<Button
							borderless
							className="btn-secondary px-3 py-2"
							prependIcon="filter"
						>
							{i18n.translate('filter')}
						</Button>
					}
				/>
			</div>
		</div>
	);
};

export default Filter;
