/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import type {Catalog} from './commerce';

export type CustomField = {
	customValue: {
		data: string | string[];
	};
	dataType?: string;
	name: string;
};

export type DeliveryProduct = {
	attachments: DeliveryProductAttachment[];
	catalogName: string;
	categories: ProductCategories[];
	createDate: string;
	customFields?: CustomField[];
	description: string;
	externalReferenceCode: string;
	id: number;
	images: ProductImages[];
	modifiedDate: string;
	name: string;
	productId: number;
	productSpecifications: DeliveryProductSpecification[];
	productType: string;
	shortDescription: string;
	skus: DeliverySKU[];
	urlImage: string;
	urls: {en_US: string};
};

type DeliveryProductAttachment = {
	customFields: CustomField[];
	galleryEnabled: boolean;
	id: number;
	priority: number;
	src: string;
	tags?: string[];
	title: string;
	type: number;
};

export type DeliveryProductSpecification = {
	id: number;
	optionCategoryId: number;
	priority: number;
	specificationGroupKey: string;
	specificationGroupTitle: string;
	specificationId: number;
	specificationKey: string;
	specificationTitle: string;
	value: string;
};

export type DeliverySKU = {
	customFields?: CustomField[];
	externalReferenceCode: string;
	id: number;
	neverExpire?: boolean;
	price: {price: number; priceFormatted: string};
	purchasable: boolean;
	sku: string;
	skuOptions: DeliverySKUOption[];
	tierPrices?: TierPrice[];
};

type DeliverySKUOption = {
	skuOptionKey: string;
	skuOptionValueKey: string;
	skuOptionValueNames?: string[];
};

export type PriceEntry = {
	bulkPricing: boolean;
	hasTierPrice: boolean;
	id: number;
	price: number;
	priceEntryId: number;
	priceFormatted: string;
	product: Pick<Product, 'id' | 'name' | 'skus' | 'thumbnail'>;
	sku: SKU;
	skuId: number;
};

export type PriceList = {
	active: boolean;
	catalogId: number;
	currencyCode: string;
	id: number;
	name: string;
	type: string;
};

export type Product = {
	__marketplaceProduct: unknown;
	active: boolean;
	attachments: ProductAttachment[];
	catalog: Catalog;
	catalogExternalReferenceCode: string;
	catalogId: number;
	catalogName: string;
	categories: ProductCategories[];
	createDate: string;
	customFields?: CustomField[];
	description: {[key: string]: string};
	externalReferenceCode: string;
	finalPrice?: number;
	id: number;
	images: ProductImages[];
	modifiedDate: string;
	name: {[key: string]: string};
	price?: number;
	productId: number;
	productOptions: ProductOption[];
	productSpecifications: ProductSpecification[];
	productStatus: number;
	productType: string;
	productVirtualSettings: {
		id: string;
		productVirtualSettingsFileEntries: {
			src: string;
			version: string;
		}[];
	};
	skus: SKU[];
	thumbnail: string;
	urlImage: string;
	urls: {en_US: string};
	version: number;
	workflowStatusInfo: {
		code: number;
		label: string;
		label_i18n: string;
	};
};

type ProductAttachment = {
	customFields?: CustomField[];
	externalReferenceCode: string;
	fileEntryId: number;
	galleryEnabled: boolean;
	id: number;
	priority: number;
	src: string;
	tags?: string[];
	title: {[key: string]: string};
};

export type ProductCategories = {
	externalReferenceCode: string;
	id: number;
	name: string;
	vocabulary: string;
};

export type ProductImages = ProductAttachment;

export type ProductOption = {
	customFields: CustomField[];
	description: {[key: string]: string};
	facetable: boolean;
	fieldType: string;
	id: number;
	key: string;
	name: {[key: string]: string};
	optionExternalReferenceCode: string;
	optionId: number;
	priceType: string;
	productOptionValues: {
		id: number;
		key: string;
		name: {en_US: string};
	}[];
	required: boolean;
	skuContributor: boolean;
	typeSettings: string;
};

export type ProductSpecification = {
	id?: number;
	label?: {[key: string]: string};
	optionCategoryId?: number;
	priority?: number;
	productId?: number;
	specificationId?: number;
	specificationKey: string;
	value: {[key: string]: string};
	visible?: boolean;
};

export type SKU = {
	cost: number;
	customFields?: CustomField[];
	externalReferenceCode: string;
	id: number;
	price: number;
	productId: number;
	sku: string;
	skuOptions: {key: string; value: string}[];
};

export type TierPrice = {
	currency: string;
	externalReferenceCode: string;
	id: number;
	minimumQuantity: number;
	price: number;
	priceFormatted: string;
	quantity: number;
};

export type ProductImageFallbackCategories = 'productIcon' | 'productImage';

export type ProductLicense =
	| 'base-license-usage-type'
	| 'cloud-license-usage-type'
	| 'dxp-license-usage-type';

export type ProductLicenseTier = 'developer' | 'standard' | 'trial';

export type ProductOfferingTypes =
	| 'Liferay PaaS'
	| 'Liferay SaaS'
	| 'Liferay Self-Hosted';

export type ProductPriceModel = 'Free' | 'Paid';

export type ProductType =
	| 'ai-hub'
	| 'client-extension'
	| 'cloud'
	| 'composite-app'
	| 'dxp'
	| 'low-code-configuration'
	| 'other'
	| 'ssa-saas';

export type ProductTypeVocabulary = 'app' | 'liferay-product' | 'solution';

export type SkuOptions = 'developer' | 'standard' | 'trial';
