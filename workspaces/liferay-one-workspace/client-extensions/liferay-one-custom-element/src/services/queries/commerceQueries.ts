/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {isUnassignedProject} from '~/pages/MyAccount/Projects/Projects';
import SearchBuilder from '~/services/fetcher/SearchBuilder';
import fetcher from '~/services/fetcher/fetcher';
import {queryGraphQL, toGraphQLString} from '~/services/graphql/GraphQL';
import HeadlessCommerceDeliveryCatalog from '~/services/headless/HeadlessCommerceDeliveryCatalog';
import {Liferay} from '~/services/liferay/liferay';

import type {APIResponse, DataQuery} from '~/types/api';
import type {DeliveryProduct} from '~/types/product';

const FILTER_VALUE_REGEXP = /^[A-Za-z0-9_-]+$/;

const MAX_PAGES = 20;

const PAGE_SIZE = 100;

const RESTRICTED_PRODUCT_FIELDS = [
	'attachments',
	'catalogName',
	'createDate',
	'customFields',
	'expando',
	'images',
	'metaDescription',
	'metaKeyword',
	'metaTitle',
	'modifiedDate',
	'productConfiguration',
	'productSpecifications.id',
	'productSpecifications.optionCategoryId',
	'productSpecifications.priority',
	'productSpecifications.productId',
	'productSpecifications.specificationGroupKey',
	'productSpecifications.specificationGroupTitle',
	'productSpecifications.specificationId',
	'productSpecifications.specificationPriority',
	'productSpecifications.specificationTitle',
	'productType',
	'shortDescription',
	'skus.availability',
	'skus.backOrderAllowed',
	'skus.customFields',
	'skus.depth',
	'skus.discontinued',
	'skus.displayDate',
	'skus.displayDiscountLevels',
	'skus.gtin',
	'skus.height',
	'skus.id',
	'skus.incomingQuantityLabel',
	'skus.manufacturerPartNumber',
	'skus.price',
	'skus.productConfiguration',
	'skus.productId',
	'skus.published',
	'skus.purchasable',
	'skus.sku',
	'skus.skuOptions',
	'skus.skuUnitOfMeasures',
	'skus.tierPrices',
	'skus.weight',
	'skus.width',
	'slug',
	'tags',
	'urlImage',
	'urls',
].join(',');

export type EntitlementNode = {
	endDate?: string;
	entitlementDefinitionToEntitlement?: {
		displayName?: string;
		skuExternalReferenceCode?: string;
	};
	externalReferenceCode: string;
	name: string;
	r_contractToEntitlement_c_contractId?: number;
};

export type ContractNode = {
	contractTerm?: number;
	contractToEntitlement?: EntitlementNode[];
	endDate?: string;
	externalReferenceCode: string;
	id: number;
	r_projectToContract_c_projectId?: number;
	spendLimit?: number;
	startDate?: string;
};

export async function fetchAllPages<Item>(
	getPage: (page: number) => Promise<APIResponse<Item>>
): Promise<APIResponse<Item>> {
	const response = await getPage(1);

	const items = [...response.items];

	if (response.totalCount > items.length) {
		const lastPage = Math.min(
			Math.ceil(response.totalCount / PAGE_SIZE),
			MAX_PAGES
		);

		const remainingPages = await Promise.all(
			Array.from({length: lastPage - 1}, (_, index) => getPage(index + 2))
		);

		remainingPages.forEach((remainingPage) =>
			items.push(...remainingPage.items)
		);
	}

	return {...response, items};
}

function isFilterValue(value: string): boolean {
	return FILTER_VALUE_REGEXP.test(value);
}

export function channelProductsQuery(
	channelId: number | string
): DataQuery<APIResponse<DeliveryProduct>> {
	return {
		fetcher: async () => {
			const getPage = (page: number) =>
				HeadlessCommerceDeliveryCatalog.getProductsPage(
					channelId,
					new URLSearchParams({
						'accountId': '-1',
						'nestedFields': 'productSpecifications,skus',
						'page': page.toString(),
						'pageSize': PAGE_SIZE.toString(),
						'restrictFields': RESTRICTED_PRODUCT_FIELDS,
						'skus.accountId': '-1',
						'skus.currencyCode':
							Liferay.CommerceContext.currency.currencyCode,
					})
				);

			const response = await getPage(1);

			const items = [...response.items];

			if (response.totalCount > items.length) {
				const lastPage = Math.min(
					Math.ceil(response.totalCount / PAGE_SIZE),
					MAX_PAGES
				);

				const remainingPages = await Promise.all(
					Array.from({length: lastPage - 1}, (_, index) =>
						getPage(index + 2)
					)
				);

				remainingPages.forEach((remainingPage) =>
					items.push(...remainingPage.items)
				);
			}

			return {...response, items};
		},
		key: `/project-channel-products/${channelId}`,
	};
}

const CONTRACT_FIELDS =
	'contractTerm endDate externalReferenceCode id spendLimit startDate';

export function getAccountContractsPage(
	accountId: number | string | null | undefined,
	page: number,
	params: Record<string, string> = {}
) {
	return fetcher<APIResponse<ContractNode>>(
		`/o/c/contracts?${new URLSearchParams({
			...params,
			filter: SearchBuilder.eq(
				'r_accountEntryToContract_accountEntryId',
				accountId as number
			),
			page: page.toString(),
			pageSize: PAGE_SIZE.toString(),
		})}`
	);
}

export function projectEntitlementsQuery(
	projectExternalReferenceCode: string
): DataQuery<APIResponse<EntitlementNode>> {
	const enabled =
		Boolean(projectExternalReferenceCode) &&
		!isUnassignedProject(projectExternalReferenceCode) &&
		isFilterValue(projectExternalReferenceCode);

	return {
		fetcher: () =>
			fetchAllPages((page) =>
				fetcher<APIResponse<EntitlementNode>>(
					`/o/c/entitlements?${new URLSearchParams({
						fields: 'entitlementDefinitionToEntitlement.skuExternalReferenceCode,externalReferenceCode,r_contractToEntitlement_c_contractId',
						filter: SearchBuilder.eq(
							'r_projectToEntitlement_c_projectERC',
							projectExternalReferenceCode
						),
						nestedFields: 'entitlementDefinitionToEntitlement',
						nestedFieldsDepth: '1',
						page: page.toString(),
						pageSize: PAGE_SIZE.toString(),
					})}`
				)
			),
		key: enabled
			? `/project-entitlements/${projectExternalReferenceCode}`
			: null,
	};
}

export function countEntitlements(filter: string) {
	return queryGraphQL<{entitlements: {totalCount: number}}>(
		`c { entitlements(filter: ${toGraphQLString(
			filter
		)}, pageSize: 1) { totalCount } }`
	).then((data) => Boolean(data.entitlements.totalCount));
}

function getContractsPage(filter: string, page: number) {
	return queryGraphQL<{contracts: APIResponse<ContractNode>}>(
		`c { contracts(filter: ${toGraphQLString(
			filter
		)}, page: ${page}, pageSize: ${PAGE_SIZE}) { items { ${CONTRACT_FIELDS} } totalCount } }`
	).then((data) => data.contracts);
}

export function projectContractsQuery(
	projectExternalReferenceCode: string
): DataQuery<APIResponse<ContractNode>> {
	const enabled =
		Boolean(projectExternalReferenceCode) &&
		!isUnassignedProject(projectExternalReferenceCode) &&
		isFilterValue(projectExternalReferenceCode);

	return {
		fetcher: () =>
			fetchAllPages((page) =>
				getContractsPage(
					SearchBuilder.eq(
						'r_projectToContract_c_projectERC',
						projectExternalReferenceCode
					),
					page
				)
			),
		key: enabled
			? `/graphql/project-contracts/${projectExternalReferenceCode}`
			: null,
	};
}

export function accountLevelContractsQuery(
	accountId?: number | string | null
): DataQuery<APIResponse<ContractNode>> {
	return {
		fetcher: () =>
			fetchAllPages((page) =>
				getContractsPage(
					new SearchBuilder()
						.eq(
							'r_accountEntryToContract_accountEntryId',
							accountId as number
						)
						.and()
						.eq('r_projectToContract_c_projectId', '0')
						.build(),
					page
				)
			),
		key: accountId ? `/graphql/account-level-contracts/${accountId}` : null,
	};
}
