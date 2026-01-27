/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useMemo, useState} from 'react';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {IActivationKey} from '~/utils/types';

import ProvisioningLicenseKeys from '../services/liferay/rest/raysource/ProvisioningLicenseKeys';
import {getOrRequestToken} from '../services/liferay/security/auth/getOrRequestToken';

const useProvisioningLicenseKeys = (
	startDate: string,
	endDate: string,
	includeAll: boolean
) => {
	const [oAuthToken, setOAuthToken] = useState<string | null>(null);
	const {provisioningServerAPI} = useAppPropertiesContext();
	const [allLicenseKeys, setAllLicenseKeys] = useState<IActivationKey[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchToken = async () => {
			const token = await getOrRequestToken();

			setOAuthToken(token);
		};

		fetchToken();
	}, []);

	const provisioningLicenseKeysService = useMemo(() => {
		if (!oAuthToken) {
			return null;
		}

		return new ProvisioningLicenseKeys({
			oAuthToken,
			provisioningServerAPI,
		});
	}, [oAuthToken, provisioningServerAPI]);

	useEffect(() => {
		if (provisioningLicenseKeysService) {
			const fetchLicenseKeys = async () => {
				try {
					setLoading(true);

					// This method needs to be implemented in ProvisioningLicenseKeys.ts
					// For now, returning an empty array

					const keys: IActivationKey[] = []; // await provisioningLicenseKeysService.getAllLicenseKeys(startDate, endDate, includeAll);
					setAllLicenseKeys(keys);
				}
				catch (error) {
					console.error('Error fetching license keys:', error);
					setAllLicenseKeys([]);
				}
				finally {
					setLoading(false);
				}
			};

			fetchLicenseKeys();
		}
	}, [provisioningLicenseKeysService, startDate, endDate, includeAll]);

	return {
		allLicenseKeys,
		loading,
		provisioningLicenseKeys: provisioningLicenseKeysService,
	};
};

export default useProvisioningLicenseKeys;
