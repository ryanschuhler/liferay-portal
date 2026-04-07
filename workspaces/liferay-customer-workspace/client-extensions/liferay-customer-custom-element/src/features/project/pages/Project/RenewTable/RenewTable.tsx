/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayTooltipProvider} from '@clayui/tooltip';
import React, {useEffect, useMemo, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import ActionTable, {IColumn} from '~/components/ActionTable';
import RenewButton from '~/features/project/containers/ActivationKeysTable/components/RenewButton/RenewButton';
import useGetActivationKeysData from '~/features/project/containers/ActivationKeysTable/hooks/useGetActivationKeysData';
import usePagination from '~/features/project/containers/ActivationKeysTable/hooks/usePagination';
import useStatusCountNavigation from '~/features/project/containers/ActivationKeysTable/hooks/useStatusCountNavigation';
import {ACTIVATE_COLUMNS} from '~/features/project/containers/ActivationKeysTable/utils/constants/columns';
import {
	EnvironmentTypeColumn,
	ExpirationDateColumn,
	KeyTypeColumn,
	StatusColumn,
} from '~/features/project/containers/ActivationKeysTable/utils/constants/columns-definitions';
import {hasAdminOrPartnerManager} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminOrPartnerManager';
import {hasAdminUserAccount} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminUserAccount';
import {useAppContext} from '~/features/project/context';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import i18n from '~/utils/I18n';
import {IActivationKey, IGraphQLUserAccount, IProject} from '~/utils/types';

import './RenewTable.css';

interface IProps {
	hasComplimentaryKey: boolean;
	isDXPTable: boolean;
	isRenewTable: boolean;
}

const RENEW_COLUMNS = ACTIVATE_COLUMNS.filter(
	(column) => column.accessor !== 'download'
);

const RenewTable: React.FC<IProps> = ({isDXPTable}) => {
	const [{project, userAccount}] = useAppContext();
	const [oAuthToken, setOAuthToken] = useState<string | null>(null);
	const {setHasSideMenu} = useOutletContext<{
		setHasSideMenu: (value: boolean) => void;
	}>();

	const productName = isDXPTable ? 'Liferay DXP' : 'Liferay Portal';

	useEffect(() => {
		const fetchToken = async () => {
			const token = await getOrRequestToken();

			setOAuthToken(token);
		};

		fetchToken();
	}, []);

	useEffect(() => {
		setHasSideMenu(false);
	}, [setHasSideMenu]);

	const {
		activationKeysState: [activationKeys],
	} = useGetActivationKeysData(project as IProject, 'renew');

	const {
		statusfilterByTitle: [statusFilter],
	} = useStatusCountNavigation(activationKeys);

	const {activationKeysByStatusPaginated, paginationConfig} = usePagination(
		activationKeys,
		statusFilter
	);

	const [activationKeysIdChecked, setActivationKeysIdChecked] = useState<
		(string | number)[]
	>([]);

	const activationKeysByStatusPaginatedChecked = useMemo(
		() =>
			activationKeys.filter(
				(key) => key && activationKeysIdChecked.includes(key.id)
			) || [],
		[activationKeys, activationKeysIdChecked]
	);

	const isAdminOrPartnerManager = useMemo(
		() =>
			hasAdminOrPartnerManager(
				project as IProject,
				userAccount as unknown as IGraphQLUserAccount
			),
		[project, userAccount]
	);

	const isAdminUserAccount = useMemo(
		() =>
			hasAdminUserAccount({
				myUserAccount: userAccount,
			}),
		[userAccount]
	);

	const columns: IColumn[] = RENEW_COLUMNS.map((column) => {
		if (column.accessor === 'environmentType') {
			return {
				...column,
				render: (_: string, activationKey: IActivationKey) => (
					<EnvironmentTypeColumn activationKey={activationKey} />
				),
			};
		}

		if (column.accessor === 'expirationDate') {
			return {
				...column,
				render: (_: string, activationKey: IActivationKey) => (
					<ExpirationDateColumn activationKey={activationKey} />
				),
			};
		}

		if (column.accessor === 'keyType') {
			return {
				...column,
				render: (_: string, activationKey: IActivationKey) => (
					<KeyTypeColumn activationKey={activationKey} />
				),
			};
		}

		if (column.accessor === 'status') {
			return {
				...column,
				render: (_: string, activationKey: IActivationKey) => (
					<StatusColumn activationKey={activationKey} />
				),
			};
		}

		return column;
	});

	if (!project) {
		return null;
	}

	return (
		<ClayTooltipProvider>
			<div className="cp-renew-table d-flex flex-column h-100 mb-4 px-4">
				<ActionTable
					checkboxConfig={{
						checkboxesChecked: activationKeysIdChecked,
						setCheckboxesChecked: setActivationKeysIdChecked,
					}}
					columns={columns}
					handleSortChange={() => {}}
					hasCheckbox={true}
					hasPagination={true}
					paginationConfig={paginationConfig}
					rows={activationKeysByStatusPaginated}
				/>

				<div className="cp-renew-table-footer d-flex justify-content-end mb-4">
					{(isAdminOrPartnerManager || isAdminUserAccount) && (
						<RenewButton
							activationKeysChecked={
								activationKeysByStatusPaginatedChecked
							}
							className="btn btn-primary font-weight-semi-bold text-paragraph"
							identifier="renew"
							oAuthToken={oAuthToken}
							productName={productName}
							project={project}
						>
							{i18n.translate('renew-keys')}
						</RenewButton>
					)}
				</div>
			</div>
		</ClayTooltipProvider>
	);
};

export default RenewTable;
