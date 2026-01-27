/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IActivationKey, IFilters} from '~/utils/types';

interface DeactivationKeysTableHeaderProps {
	activationKeysState: [
		IActivationKey[],
		React.Dispatch<React.SetStateAction<IActivationKey[]>>,
	];
	filterState: [IFilters, React.Dispatch<React.SetStateAction<IFilters>>];
	loading: boolean;
}

const DeactivationKeysTableHeader = ({
	activationKeysState,
	filterState: [filters, setFilters],
	loading,
}: DeactivationKeysTableHeaderProps) => {
=======
}: DeactivationKeysTableHeaderProps) => {
>>>>>>> 7e8f3b93c0d1f (LRSD-12021 Convert to typescript)
	const [activationKeys] = activationKeysState;

	return (
		<div className="bg-neutral-1 d-flex flex-column pb-1 pt-3 px-3 rounded">
			<div className="d-flex">
				<Filter
					activationKeys={activationKeys}
					filtersState={[filters, setFilters]}
				/>
			</div>

			<BadgeFilter
				activationKeysLength={activationKeys?.length}
				filtersState={[filters, setFilters]}
				loading={loading}
			/>
		</div>
	);
};

export default DeactivationKeysTableHeader;
