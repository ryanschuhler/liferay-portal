/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {useGetActivationKeys} from '~/services/liferay/graphql/activation-keys';
import {IActivationKey, IProject} from '~/utils/types';

const MAX_ITEMS = 9999;
const PAGE = 1;

export default function useGetActivationKeysData(
	project: IProject,
	initialFilter: string
): {
	activationKeysState: [
		IActivationKey[],
		React.Dispatch<React.SetStateAction<IActivationKey[]>>,
	];
	loading: boolean;
	setFilterTerm: React.Dispatch<React.SetStateAction<string>>;
} {
	const [activationKeys, setActivationKeys] = useState<IActivationKey[]>([]);
	const [filterTerm, setFilterTerm] = useState<string>(
		`active eq true and ${initialFilter}`
	);

	const {data, loading} = useGetActivationKeys(
		project?.accountKey,
		encodeURI(filterTerm),
		PAGE,
		MAX_ITEMS
	);

	useEffect(() => {
		if (!loading && data?.getActivationKeys) {
			setActivationKeys(data.getActivationKeys.items);
		}
	}, [data, loading]);

	return {
		activationKeysState: [activationKeys, setActivationKeys],
		loading,
		setFilterTerm,
	};
}
