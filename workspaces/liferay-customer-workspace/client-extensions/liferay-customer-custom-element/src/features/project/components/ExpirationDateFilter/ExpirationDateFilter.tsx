/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayCheckbox} from '@clayui/form';
import {useCallback, useEffect, useState} from 'react';
import i18n from '~/utils/I18n';
import {IFilters} from '~/utils/types';

import DateFilter from '../DateFilter';

const DNE_YEARS = 100;

interface ExpirationDateFilterProps {
	clearInputs: boolean;
	hasDNE: boolean;
	setFilters: React.Dispatch<React.SetStateAction<IFilters>>;
}

export default function ExpirationDateFilter({
	clearInputs,
	hasDNE,
	setFilters,
}: ExpirationDateFilterProps) {
	const [dneChecked, setDNEChecked] = useState<boolean>(false);

	const getOnOrAfterValue = useCallback(
		(currentValue: Date | boolean): Date | boolean => {
			if (dneChecked) {
				const today = new Date();
				today.setFullYear(today.getFullYear() + DNE_YEARS);

				return today;
			}

			return currentValue;
		},
		[dneChecked]
	);

	useEffect(() => {
		if (clearInputs) {
			setDNEChecked(false);
		}
	}, [clearInputs]);

	return (
		<DateFilter
			clearInputs={clearInputs}
			onOrAfterDisabled={dneChecked}
			onOrBeforeDisabled={dneChecked}
			updateFilters={(
				onOrAfter: Date | boolean,
				onOrBefore: Date | boolean
			) =>
				setFilters((previousFilters: IFilters) => ({
					...previousFilters,
					expirationDate: {
						...previousFilters.expirationDate,
						value: {
							onOrAfter: getOnOrAfterValue(onOrAfter),
							onOrBefore,
						},
					},
				}))
			}
		>
			{hasDNE && (
				<ClayCheckbox
					checked={dneChecked}
					label={i18n.translate('does-not-expire')}
					onChange={() =>
						setDNEChecked(
							(previousDNEChecked) => !previousDNEChecked
						)
					}
				/>
			)}
		</DateFilter>
	);
}
