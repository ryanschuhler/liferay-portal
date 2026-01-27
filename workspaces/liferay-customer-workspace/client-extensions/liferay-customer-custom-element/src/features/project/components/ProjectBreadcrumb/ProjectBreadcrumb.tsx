/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {NetworkStatus} from '@apollo/client';
import classNames from 'classnames';
import {useCallback, useEffect, useState} from 'react';
import {IconBreadcrumbs} from '~/assets';
import Skeleton from '~/components/Skeleton';
import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import useKoroneikiAccounts from '~/hooks/useKoroneikiAccounts';
import SearchBuilder from '~/lib/SearchBuilder';
import i18n from '~/utils/I18n';

import PopoverIcon from '../../containers/ActivationStatus/DXPCloud/components/PopoverIcon';
import Dropdown from './components/Dropdown';

interface IKoroneikiAccount {
	accountKey: string;
	code: string;
	dxpVersion: string;
	externalReferenceCode: string;
	id: string;
	maxRequestors: string;
	name: string;
	slaCurrent: boolean;
	slaExpired: boolean;
	slaFuture: boolean;
	status: string;
}

const ProjectBreadcrumb = () => {
	const [filter, setFilter] = useState<string>('');
	const [initialTotalCount, setInitialTotalCount] = useState<number>(0);
	const [projectStatus, setProjectStatus] = useState<string>('');

	const getFilter = useCallback((searchTerm: string): string => {
		const searchBuilder = new SearchBuilder();

		if (searchTerm) {
			searchBuilder.contains('name', searchTerm);
			searchBuilder.or();
			searchBuilder.contains('code', searchTerm);
		}

		return searchBuilder.build();
	}, []);

	const {
		data: currentKoroneikiAccountData,
		loading: currentKoroneikiAccountLoading,
	} = useCurrentKoroneikiAccount();

	const selectedKoroneikiAccount: IKoroneikiAccount | undefined =
		currentKoroneikiAccountData?.koroneikiAccountByExternalReferenceCode;

	const {data, fetchMore, networkStatus, refetch} = useKoroneikiAccounts({
		filter,
		pageSize: 5,
	});

	const handleSearch = useCallback(
		(searchTerm: string) => {
			setFilter(getFilter(searchTerm));
		},
		[getFilter]
	);

	useEffect(() => {
		refetch({filter});
	}, [filter, refetch]);

	useEffect(() => {
		if (
			data?.c.koroneikiAccounts.totalCount &&
			data?.c.koroneikiAccounts.totalCount > initialTotalCount
		) {
			setInitialTotalCount(data.c.koroneikiAccounts.totalCount);
		}

		setProjectStatus(selectedKoroneikiAccount?.status || '');
	}, [
		data?.c.koroneikiAccounts.totalCount,
		initialTotalCount,
		selectedKoroneikiAccount?.status,
	]);

	if (
		currentKoroneikiAccountLoading ||
		networkStatus === NetworkStatus.loading
	) {
		return <Skeleton height={30} width={264} />;
	}

	return (
		<div className="align-items-center bg-neutral-1 cp-breadcrumbs-container d-flex justify-content-between mb-3 p-3">
			<div>
				<IconBreadcrumbs />
			</div>

			<div className="cp-breadcrumbs-dropdown">
				<Dropdown
					fetching={networkStatus === NetworkStatus.fetchMore}
					initialTotalCount={initialTotalCount}
					koroneikiAccounts={data?.c.koroneikiAccounts}
					onIntersecting={() =>
						fetchMore({
							variables: {
								page: (data?.c.koroneikiAccounts.page || 0) + 1,
							},
						})
					}
					onSearch={handleSearch}
					searching={networkStatus === NetworkStatus.refetch}
					selectedKoroneikiAccount={
						selectedKoroneikiAccount as IKoroneikiAccount
					}
				/>

				<div
					className={classNames('cp-breadcrumbs-popover', {
						[`cp-breadcrumbs-popover-${projectStatus?.toLowerCase()}`]:
							projectStatus,
					})}
				>
					<PopoverIcon
						symbol="simple-circle"
						title={i18n.translate(`${projectStatus}`)}
					/>

					<span className="cp-breadcrumbs-status text-paragraph-sm">
						{i18n.translate(`${projectStatus}`)}
					</span>
				</div>
			</div>
		</div>
	);
};

export default ProjectBreadcrumb;
