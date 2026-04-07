/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import CheckboxFilter from '~/features/project/components/CheckboxFilter';
import DateFilter from '~/features/project/components/DateFilter';
import ExpirationDateFilter from '~/features/project/components/ExpirationDateFilter';
import KeyTypeFilter from '~/features/project/components/KeyTypeFilter';
import i18n from '~/utils/I18n';
import {IFilters} from '~/utils/types';

interface IAvailableFields {
	environmentTypes: (string | number)[];
	hasCluster: boolean;
	hasDNE: boolean;
	hasVirtualCluster: boolean;
	instanceSizes: (string | number)[];
	productVersions: (string | number)[];
	status: (string | number)[];
}

type SetFilters = React.Dispatch<React.SetStateAction<IFilters>>;

export function getDropDownAvailableFields(
	availableFields: IAvailableFields,
	filters: IFilters,
	setFilters: SetFilters
): Record<
	string,
	{
		child?: React.ReactNode;
		disabled?: boolean;
		title: string;
		type?: 'divider' | 'component' | 'item';
	}[]
> {
	return {
		x0a0: [
			{
				child: 'x0a1',
				title: i18n.translate('key-type'),
				type: 'item',
			},
			{
				child: 'x0a2',
				disabled: !availableFields.environmentTypes.length,
				title: i18n.translate('environment-type'),
				type: 'item',
			},
			{
				child: 'x0a4',
				title: i18n.translate('start-date'),
				type: 'item',
			},
			{
				child: 'x0a5',
				title: i18n.translate('expiration-date'),
				type: 'item',
			},
			{
				child: 'x0a6',
				disabled: !availableFields.status.length,
				title: i18n.translate('status'),
				type: 'item',
			},
			{
				child: 'x0a7',
				disabled: !availableFields.productVersions.length,
				title: i18n.translate('product-version'),
				type: 'item',
			},
			{
				child: 'x0a8',
				disabled: !availableFields.instanceSizes.length,
				title: i18n.translate('instance-size'),
				type: 'item',
			},
		],
		x0a1: [
			{
				child: (
					<KeyTypeFilter
						clearInputs={Object.values(filters.keyType.value).every(
							(value: any) => !value
						)}
						hasCluster={availableFields.hasCluster}
						hasVirtualCluster={availableFields.hasVirtualCluster}
						setFilters={setFilters}
					/>
				),
				title: '',
				type: 'component',
			},
		],
		x0a2: [
			{
				child: (
					<CheckboxFilter
						availableItems={availableFields.environmentTypes.map(
							(item) => String(item)
						)}
						clearCheckboxes={
							!filters.environmentTypes.value?.length
						}
						updateFilters={(checkedItems: any) =>
							setFilters((previousFilters: IFilters) => ({
								...previousFilters,
								environmentTypes: {
									...previousFilters.environmentTypes,
									value: checkedItems,
								},
							}))
						}
					/>
				),
				title: '',
				type: 'component',
			},
		],
		x0a4: [
			{
				child: (
					<DateFilter
						clearInputs={
							!filters.startDate.value?.onOrAfter &&
							!filters.startDate.value?.onOrBefore
						}
						updateFilters={(onOrAfter: any, onOrBefore: any) =>
							setFilters((previousFilters: IFilters) => ({
								...previousFilters,
								startDate: {
									...previousFilters.startDate,
									value: {
										onOrAfter,
										onOrBefore,
									},
								},
							}))
						}
					/>
				),
				title: '',
				type: 'component',
			},
		],
		x0a5: [
			{
				child: (
					<ExpirationDateFilter
						clearInputs={
							!filters.expirationDate.value?.onOrAfter &&
							!filters.expirationDate.value?.onOrBefore
						}
						hasDNE={availableFields.hasDNE}
						setFilters={setFilters}
					/>
				),
				title: '',
				type: 'component',
			},
		],
		x0a6: [
			{
				child: (
					<CheckboxFilter
						availableItems={availableFields.status.map((item) =>
							String(item)
						)}
						clearCheckboxes={!filters.status.value?.length}
						updateFilters={(checkedItems: any) =>
							setFilters((previousFilters: IFilters) => ({
								...previousFilters,
								status: {
									...previousFilters.status,
									value: checkedItems,
								},
							}))
						}
					/>
				),
				title: '',
				type: 'component',
			},
		],
		x0a7: [
			{
				child: (
					<CheckboxFilter
						availableItems={availableFields.productVersions.map(
							(item) => String(item)
						)}
						clearCheckboxes={!filters.productVersions.value?.length}
						updateFilters={(checkedItems: any) =>
							setFilters((previousFilters: IFilters) => ({
								...previousFilters,
								productVersions: {
									...previousFilters.productVersions,
									value: checkedItems,
								},
							}))
						}
					/>
				),
				title: '',
				type: 'component',
			},
		],
		x0a8: [
			{
				child: (
					<CheckboxFilter
						availableItems={availableFields.instanceSizes.map(
							(item) => String(item)
						)}
						clearCheckboxes={!filters.instanceSizes.value?.length}
						updateFilters={(checkedItems: any) =>
							setFilters((previousFilters: IFilters) => ({
								...previousFilters,
								instanceSizes: {
									...previousFilters.instanceSizes,
									value: checkedItems,
								},
							}))
						}
					/>
				),
				title: '',
				type: 'component',
			},
		],
	};
}
