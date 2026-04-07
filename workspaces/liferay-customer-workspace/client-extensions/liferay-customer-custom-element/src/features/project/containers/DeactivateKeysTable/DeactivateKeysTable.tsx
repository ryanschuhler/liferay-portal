/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayTooltipProvider} from '@clayui/tooltip';
import {useEffect, useMemo, useState} from 'react';
import {Navigate, useOutletContext} from 'react-router-dom';
import ActionTable from '~/components/ActionTable';
import {useAppContext} from '~/features/project/context';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import {IActivationKey, IProject} from '~/utils/types';

import useGetActivationKeysData from '../ActivationKeysTable/hooks/useGetActivationKeysData';
import usePagination from '../ActivationKeysTable/hooks/usePagination';
import useStatusCountNavigation from '../ActivationKeysTable/hooks/useStatusCountNavigation';
import {
	EnvironmentTypeColumn,
	ExpirationDateColumn,
	KeyTypeColumn,
	StatusColumn,
} from '../ActivationKeysTable/utils/constants/columns-definitions';
import {hasAdminOrPartnerManager} from '../ActivationKeysTable/utils/hasAdminOrPartnerManager';
import {hasAdminUserAccount} from '../ActivationKeysTable/utils/hasAdminUserAccount';
import DeactivateKeysSkeleton from './DeactivateKeysTableSkeleton';
import DeactivateKeysTableFooter from './components/Footer';
import DeactivationKeysTableHeader from './components/Header';
import useFilters from './components/Header/hooks/useFilters';
import {DEACTIVATE_COLUMNS} from './utils/constants';

import './DeactivateKeysTable.css';

interface IProps {
	initialFilter: string;
	productName: string;
}

export function DeactivateKeysTable({initialFilter, productName}: IProps) {
	const [oAuthToken, setOAuthToken] = useState<string | null>(null);
	const [{project, userAccount}] = useAppContext();
	const {setHasSideMenu} = useOutletContext<{
		setHasSideMenu: (value: boolean) => void;
	}>();

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

	const activationKeysState = useGetActivationKeysData(
		project as IProject,
		initialFilter
	);

	const {
		activationKeysState: [activationKeys],
		loading,
		setFilterTerm,
	} = activationKeysState;

	const {
		statusfilterByTitle: [statusFilter],
	} = useStatusCountNavigation(activationKeys);

	const {activationKeysByStatusPaginated, paginationConfig} = usePagination(
		activationKeys,
		statusFilter
	);

	const filterState = useFilters(
		setFilterTerm,
		productName,
		initialFilter
	) as [any, React.Dispatch<React.SetStateAction<any>>];

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
		() => hasAdminOrPartnerManager(project as IProject, userAccount as any),
		[project, userAccount]
	);

	const isAdminUserAccount = useMemo(
		() => hasAdminUserAccount({myUserAccount: userAccount} as any),
		[userAccount]
	);

	if (!loading && !isAdminOrPartnerManager && !isAdminUserAccount) {
		return <Navigate to="/" />;
	}

	if (loading) {
		return <DeactivateKeysSkeleton />;
	}

	const handleCheckboxesChecked: React.Dispatch<
		React.SetStateAction<(string | number)[]>
	> = (value) => {
		if (typeof value === 'function') {
			setActivationKeysIdChecked(value);
		}
		else {
			setActivationKeysIdChecked(value);
		}
	};

	const columns = DEACTIVATE_COLUMNS.map((column) => {
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

	return (
		<ClayTooltipProvider>
			<div className="cp-deactivate-keys-table d-flex flex-column h-100 mb-4 px-4">
				<DeactivationKeysTableHeader
					activationKeysState={[
						activationKeys,
						activationKeysState.activationKeysState[1],
					]}
					filterState={filterState}
					loading={loading}
				/>

				<ActionTable
					checkboxConfig={{
						checkboxesChecked: activationKeysIdChecked,
						setCheckboxesChecked: handleCheckboxesChecked,
					}}
					columns={columns as any}
					handleSortChange={() => {}}
					hasCheckbox={true}
					hasPagination={true}
					paginationConfig={paginationConfig}
					rows={activationKeysByStatusPaginated as any}
				/>

				<DeactivateKeysTableFooter
					accountKey={project?.accountKey || ''}
					activationKeysByStatusPaginatedChecked={
						activationKeysByStatusPaginatedChecked
					}
					activationKeysState={[
						activationKeys,
						activationKeysState.activationKeysState[1],
					]}
					oAuthToken={oAuthToken as string}
					productName={productName}
				/>
			</div>
		</ClayTooltipProvider>
	);
}
