/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import ActivationKeysTable from '~/features/project/containers/ActivationKeysTable';
import RenewTableFooter from '~/features/project/containers/ActivationKeysTable/components/RenewTableFooter';
import {hasAdminUserAccount} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminUserAccount';
import {useAppContext} from '~/features/project/context';
import {useGetMyUserAccount} from '~/services/liferay/graphql/user-accounts';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import {IActivationKey, IProject} from '~/utils/types';

interface IProps {
	hasComplimentaryKey: boolean;
	isDXPTable: boolean;
	isRenewTable: boolean;
}

const RenewTable = ({
	hasComplimentaryKey,
	isDXPTable,
	isRenewTable,
}: IProps) => {
	const productName = isDXPTable ? 'DXP' : 'Portal';

	const [{project}] = useAppContext();
	const {data: myAccount} = useGetMyUserAccount();
	const [oAuthToken, setOAuthToken] = useState<string | undefined>();

	const isAdminUserAccount = hasAdminUserAccount(myAccount);

	useEffect(() => {
		const fetchToken = async () => {
			const token = await getOrRequestToken();

			setOAuthToken(token);
		};

		fetchToken();
	}, []);

	const [keysSelectedCount, setKeysSelectedCount] = useState<number>(0);
	const [activationKeysChecked, setActivationKeysChecked] = useState<
		IActivationKey[]
	>([]);
	const [renewKeysFilterChecked, setRenewKeysFilterChecked] =
		useState<string>('');

	const initialFilter = isDXPTable
		? "(startswith(productName,'DXP') or startswith(productName,'Digital'))"
		: "startswith(productName,'Portal')";

	return (
		<div className="container renew-table">
			<ActivationKeysTable
				hasComplimentaryKey={hasComplimentaryKey}
				initialFilter={initialFilter}
				isRenewTable={isRenewTable}
				oAuthToken={oAuthToken ?? ''}
				productName={productName}
				project={project as IProject}
				setActivationKeysChecked={setActivationKeysChecked}
				setKeysSelectedCount={setKeysSelectedCount}
				setRenewKeysFilterChecked={setRenewKeysFilterChecked}
			/>

			<RenewTableFooter
				activationKeysChecked={activationKeysChecked}
				isAdminUserAccount={isAdminUserAccount}
				isRenewTable={isRenewTable}
				keysSelectedCount={keysSelectedCount}
				productName={productName}
				project={project as IProject}
				renewKeysFilterChecked={renewKeysFilterChecked}
			/>
		</div>
	);
};

export default RenewTable;
