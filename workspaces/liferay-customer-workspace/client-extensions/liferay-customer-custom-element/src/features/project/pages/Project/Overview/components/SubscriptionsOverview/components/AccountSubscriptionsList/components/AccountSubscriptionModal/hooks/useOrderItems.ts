/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {NetworkStatus} from '@apollo/client';
import {useEffect, useState} from 'react';
import useGetOrderItems from '~/services/liferay/graphql/order-items/queries/useGetOrderItems';

const PAGE_SIZE = 5;
const FIRST_PAGE = 1;

export default function useOrderItems(
	accountSubscriptionExternalReferenceCode: string
) {
	const [activePage, setActivePage] = useState(FIRST_PAGE);
	const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE);

	const {data, fetchMore, networkStatus}: any = useGetOrderItems({
		filter: `customFields/accountSubscriptionERC eq '${accountSubscriptionExternalReferenceCode}'`,
		notifyOnNetworkStatusChange: true,
		page: activePage,
		pageSize: itemsPerPage,
		skip: !accountSubscriptionExternalReferenceCode,
	});

	useEffect(() => {
		if (activePage !== FIRST_PAGE) {
			fetchMore({
				variables: {
					page: activePage,
				},
			});
		}
	}, [activePage, fetchMore]);

	return {
		activePage,
		data,
		itemsPerPage,
		loading: networkStatus === NetworkStatus.loading,
		setActivePage,
		setItemsPerPage,
	};
}
