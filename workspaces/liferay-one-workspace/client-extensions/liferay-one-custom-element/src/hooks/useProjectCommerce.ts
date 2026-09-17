/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useMemo} from 'react';
import useSWR from 'swr';
import {useDataQuery} from '~/hooks/useDataQuery';
import i18n from '~/i18n';
import {getProductContactRoleExternalReferenceCodes} from '~/pages/MyAccount/ProjectMembers/projectRoles';
import {ONE_TIME_PURCHASES} from '~/pages/MyAccount/Projects/Projects';
import {useUserProjects} from '~/pages/MyAccount/Projects/hooks/useUserProjects';
import resolveDefaultContractERC from '~/pages/MyAccount/Projects/utils/resolveDefaultContractERC';
import SearchBuilder from '~/services/fetcher/SearchBuilder';
import {Liferay} from '~/services/liferay/liferay';
import {
	accountLevelContractsQuery,
	channelProductsQuery,
	countEntitlements,
	fetchAllPages,
	getAccountContractsPage,
	projectContractsQuery,
	projectEntitlementsQuery,
} from '~/services/queries/commerceQueries';
import {EXPERIENCE_OFFERING_PRODUCT_EXTERNAL_REFERENCE_CODES} from '~/types/productEnums';

import type {
	ContractNode,
	EntitlementNode,
} from '~/services/queries/commerceQueries';
import type {
	DeliveryProduct,
	DeliveryProductSpecification,
} from '~/types/product';

const CHANNEL_PRODUCTS_DEDUPING_INTERVAL = 60000;

const MAX_FILTER_CLAUSES = 50;

export type ProjectContract = {
	endDate?: string;
	externalReferenceCode: string;
	name: string;
	spendLimit?: number;
	startDate?: string;
	status?: string;
	termMonths?: number;
};

export type ProjectProduct = {
	description: string;
	externalReferenceCode: string;
	id: string;
	name: string;
	publisher: string;
	saleType: string;
	specifications: DeliveryProductSpecification[];
	startDate: string;
	status: string;
	type: string;
};

type ProductEntitlement = {
	endDate?: string;
	skuExternalReferenceCode?: string;
};

function toProjectContract(contractNode: ContractNode): ProjectContract {
	return {
		endDate: contractNode.endDate,
		externalReferenceCode: contractNode.externalReferenceCode,
		name: contractNode.externalReferenceCode,
		spendLimit: contractNode.spendLimit,
		startDate: contractNode.startDate,
		status: getContractStatus(contractNode.startDate, contractNode.endDate),
		termMonths: contractNode.contractTerm,
	};
}

function getEntitlementStatus(endDate?: string): string {
	if (endDate && new Date(endDate) < new Date()) {
		return 'expired';
	}

	return 'active';
}

function getContractStatus(startDate?: string, endDate?: string): string {
	const now = new Date();

	if (startDate && new Date(startDate) > now) {
		return 'future';
	}

	if (endDate && new Date(endDate) < now) {
		return 'expired';
	}

	return 'active';
}

function toProductEntitlements(
	entitlementNodes?: EntitlementNode[]
): ProductEntitlement[] {
	return (entitlementNodes ?? [])
		.map((entitlement) => ({
			endDate: entitlement.endDate,
			skuExternalReferenceCode:
				entitlement.entitlementDefinitionToEntitlement
					?.skuExternalReferenceCode,
		}))
		.filter((entitlement) => entitlement.skuExternalReferenceCode);
}

function toProductsBySkuExternalReferenceCode(
	products: DeliveryProduct[]
): Map<string, DeliveryProduct> {
	const productsBySkuExternalReferenceCode = new Map<
		string,
		DeliveryProduct
	>();

	products.forEach((product) =>
		(product.skus ?? []).forEach((sku) =>
			productsBySkuExternalReferenceCode.set(
				sku.externalReferenceCode,
				product
			)
		)
	);

	return productsBySkuExternalReferenceCode;
}

export function useChannelProducts() {
	return useDataQuery(
		channelProductsQuery(Liferay.CommerceContext.commerceChannelId),
		{dedupingInterval: CHANNEL_PRODUCTS_DEDUPING_INTERVAL}
	);
}

export function useProjectCommerce(
	projectExternalReferenceCode: string,
	contractExternalReferenceCode?: string
) {
	const {loading: projectsLoading, projects} = useUserProjects();

	const project = projects.find(
		(userProject) =>
			userProject.externalReferenceCode === projectExternalReferenceCode
	);

	const {
		data: projectContractData,
		error: projectContractError,
		isLoading: projectContractsLoading,
	} = useProjectContracts(projectExternalReferenceCode);

	const {
		data: accountContractData,
		error,
		isLoading: accountLoading,
	} = useAccountLevelContracts(Boolean(projectExternalReferenceCode));

	const projectContractNodes = projectContractData?.items ?? [];

	const accountContractNodes = accountContractData?.items ?? [];

	const usingAccountFallback = !projectContractNodes.length;

	const contractNodes = usingAccountFallback
		? accountContractNodes
		: projectContractNodes;

	const countsOneTimeEntitlements =
		!usingAccountFallback || !contractNodes.length;

	const {entitlements, loading: entitlementsLoading} = useProjectEntitlements(
		projectExternalReferenceCode
	);

	const projectContractIds = new Set(
		projectContractNodes.map((node) => node.id)
	);

	const hasOneTimeEntitlements =
		countsOneTimeEntitlements &&
		entitlements.some(
			(entitlement) =>
				!projectContractIds.has(
					entitlement.r_contractToEntitlement_c_contractId ?? 0
				)
		);

	const contracts = [
		...contractNodes.map(toProjectContract),
		...(hasOneTimeEntitlements
			? [
					{
						externalReferenceCode: ONE_TIME_PURCHASES,
						name: i18n.translate('one-time-purchases'),
					},
				]
			: []),
	];

	const selectedContractExists = contracts.some(
		(contract) =>
			contract.externalReferenceCode === contractExternalReferenceCode
	);

	const resolvedContractERC = selectedContractExists
		? contractExternalReferenceCode
		: resolveDefaultContractERC(contracts);

	const oneTimeSelected = resolvedContractERC === ONE_TIME_PURCHASES;

	const contractNode = oneTimeSelected
		? undefined
		: contractNodes.find(
				(node) => node.externalReferenceCode === resolvedContractERC
			);

	const contract = contractNode ? toProjectContract(contractNode) : undefined;

	return {
		contract,
		contracts,
		error: error ?? projectContractError,
		loading:
			accountLoading ||
			entitlementsLoading ||
			projectContractsLoading ||
			projectsLoading,
		projectContractIds,
		projectName: project?.name,
		resolvedContractERC,
		resolvedContractId: contractNode?.id,
		usingAccountFallback,
	};
}

export function useProjectEntitlements(projectExternalReferenceCode: string) {
	const {data, error, isLoading} = useDataQuery(
		projectEntitlementsQuery(projectExternalReferenceCode)
	);

	return {
		entitlements: data?.items ?? [],
		error,
		loading: isLoading,
	};
}

function useProjectContracts(projectExternalReferenceCode: string) {
	return useDataQuery(projectContractsQuery(projectExternalReferenceCode));
}

function useAccountLevelContracts(enabled = true) {
	const accountId = Liferay.CommerceContext?.account?.accountId;

	return useDataQuery(accountLevelContractsQuery(enabled ? accountId : null));
}

function useAccountContractsWithEntitlements() {
	const accountId = Liferay.CommerceContext?.account?.accountId;

	return useSWR(
		accountId ? `/account-contract-entitlements/${accountId}` : null,
		() =>
			fetchAllPages((page) =>
				getAccountContractsPage(accountId, page, {
					nestedFields:
						'contractToEntitlement,entitlementDefinitionToEntitlement',
					nestedFieldsDepth: '2',
				})
			)
	);
}

export function useUnassignedCommerce(enabled = true) {
	const {
		data: contractData,
		error: contractError,
		isLoading: contractLoading,
	} = useAccountLevelContracts(enabled);

	const projectlessContractNodes = (contractData?.items ?? []).slice(
		0,
		MAX_FILTER_CLAUSES
	);

	const unassignedEntitlementFilter = projectlessContractNodes
		.reduce(
			(searchBuilder, node, index) =>
				index
					? searchBuilder
							.or()
							.eq('r_contractToEntitlement_c_contractId', node.id)
					: searchBuilder.eq(
							'r_contractToEntitlement_c_contractId',
							node.id
						),
			new SearchBuilder().group('OPEN')
		)
		.group('CLOSE')
		.and()
		.eq('r_projectToEntitlement_c_projectId', 0)
		.and()
		.ne('r_entitlementDefinitionToEntitlement_c_entitlementDefinitionId', 0)
		.build();

	const {data, error, isLoading} = useSWR(
		projectlessContractNodes.length
			? `/graphql/unassigned-entitlements/${unassignedEntitlementFilter}`
			: null,
		() => countEntitlements(unassignedEntitlementFilter)
	);

	return {
		error: contractError ?? error,
		hasUnassignedEntitlements: Boolean(data),
		loading: contractLoading || isLoading,
	};
}

export function useAccountProducts() {
	const {data: contractsData, isLoading: contractsLoading} =
		useAccountContractsWithEntitlements();

	const {data: productsData, isLoading: productsLoading} =
		useChannelProducts();

	const products = useMemo<DeliveryProduct[]>(() => {
		const productsBySkuExternalReferenceCode =
			toProductsBySkuExternalReferenceCode(productsData?.items ?? []);

		const accountProducts = new Map<string, DeliveryProduct>();

		(contractsData?.items ?? []).forEach((contract) => {
			toProductEntitlements(contract.contractToEntitlement).forEach(
				(entitlement) => {
					const product = productsBySkuExternalReferenceCode.get(
						entitlement.skuExternalReferenceCode as string
					);

					if (product) {
						accountProducts.set(
							product.externalReferenceCode,
							product
						);
					}
				}
			);
		});

		return [...accountProducts.values()];
	}, [contractsData, productsData]);

	return {loading: contractsLoading || productsLoading, products};
}

export function useHasActiveExperienceOffering() {
	const {
		data,
		error,
		isLoading: loading,
	} = useAccountContractsWithEntitlements();

	const {
		data: productsData,
		error: productsError,
		isLoading: productsLoading,
	} = useChannelProducts();

	const hasActiveExperienceOffering = useMemo(() => {
		const productsBySkuExternalReferenceCode =
			toProductsBySkuExternalReferenceCode(productsData?.items ?? []);

		return (data?.items ?? [])
			.flatMap((contract) =>
				toProductEntitlements(contract.contractToEntitlement)
			)
			.some((entitlement) => {
				const product = productsBySkuExternalReferenceCode.get(
					entitlement.skuExternalReferenceCode as string
				);

				return (
					!!product &&
					EXPERIENCE_OFFERING_PRODUCT_EXTERNAL_REFERENCE_CODES.some(
						(code) => code === product.externalReferenceCode
					) &&
					getEntitlementStatus(entitlement.endDate) === 'active'
				);
			});
	}, [data, productsData]);

	return {
		error: error ?? productsError,
		hasActiveExperienceOffering,
		loading: loading || productsLoading,
	};
}

export function useAccountProjectContactRoles() {
	const {data: contractsData, isLoading: contractsLoading} =
		useAccountContractsWithEntitlements();

	const {data: productsData, isLoading: productsLoading} =
		useChannelProducts();

	const contactRoleExternalReferenceCodesByProjectId = useMemo(() => {
		const productsBySkuExternalReferenceCode =
			toProductsBySkuExternalReferenceCode(productsData?.items ?? []);

		const externalReferenceCodesByProjectId = new Map<
			number,
			Set<string>
		>();

		(contractsData?.items ?? []).forEach((contract) => {
			const projectId = contract.r_projectToContract_c_projectId;

			if (!projectId) {
				return;
			}

			const externalReferenceCodes =
				externalReferenceCodesByProjectId.get(projectId) ??
				new Set<string>();

			toProductEntitlements(contract.contractToEntitlement).forEach(
				(entitlement) => {
					const product = productsBySkuExternalReferenceCode.get(
						entitlement.skuExternalReferenceCode as string
					);

					if (!product) {
						return;
					}

					getProductContactRoleExternalReferenceCodes(
						product.productSpecifications ?? []
					).forEach((externalReferenceCode) =>
						externalReferenceCodes.add(externalReferenceCode)
					);
				}
			);

			externalReferenceCodesByProjectId.set(
				projectId,
				externalReferenceCodes
			);
		});

		return new Map(
			[...externalReferenceCodesByProjectId].map(
				([projectId, externalReferenceCodes]) => [
					projectId,
					[...externalReferenceCodes],
				]
			)
		);
	}, [contractsData, productsData]);

	return {
		contactRoleExternalReferenceCodesByProjectId,
		loading: contractsLoading || productsLoading,
	};
}
