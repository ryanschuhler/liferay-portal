/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {ProjectContract} from '~/hooks/useProjectCommerce';

export function resolveDefaultContractERC(
	contracts: ProjectContract[]
): string | undefined {
	const activeContracts = contracts.filter(
		(contract) => contract.status === 'active'
	);

	const selectableContracts = activeContracts.length
		? activeContracts
		: contracts;

	if (!selectableContracts.length) {
		return undefined;
	}

	return selectableContracts.reduce((costliest, contract) =>
		(contract.spendLimit ?? 0) > (costliest.spendLimit ?? 0)
			? contract
			: costliest
	).externalReferenceCode;
}

export default resolveDefaultContractERC;
