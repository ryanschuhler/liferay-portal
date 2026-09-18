/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import i18n from '../i18n';

export const LicenseType = {
	PERPETUAL: 'perpetual',
	SUBSCRIPTION: 'subscription',
} as const;

export type LicenseType = (typeof LicenseType)[keyof typeof LicenseType];

const ProductExternalReferenceCode = {
	PAAS_EXPERIENCE: 'PRDCT-PAAS',
	SAAS_EXPERIENCE: 'PRDCT-SAAS',
} as const;

type ProductExternalReferenceCode =
	(typeof ProductExternalReferenceCode)[keyof typeof ProductExternalReferenceCode];

export const ProductLicense = {
	BASE: 'base-license-usage-type',
	CLOUD: 'cloud-license-usage-type',
	DXP: 'dxp-license-usage-type',
} as const;

export type ProductLicense =
	(typeof ProductLicense)[keyof typeof ProductLicense];

export const ProductLicenseTier = {
	DEVELOPER: 'developer',
	STANDARD: 'standard',
	TRIAL: 'trial',
} as const;

export type ProductLicenseTier =
	(typeof ProductLicenseTier)[keyof typeof ProductLicenseTier];

export const ProductLicenseType = {
	MONTHLY: 'Monthly',
	PERPETUAL: 'Perpetual',
	SUBSCRIPTION: 'Subscription',
} as const;

export type ProductLicenseType =
	(typeof ProductLicenseType)[keyof typeof ProductLicenseType];

export const ProductOfferingTypes = {
	LIFERAY_PAAS: 'Liferay PaaS',
	LIFERAY_SAAS: 'Liferay SaaS',
	LIFERAY_SELF_HOSTED: 'Liferay Self-Hosted',
} as const;

export type ProductOfferingTypes =
	(typeof ProductOfferingTypes)[keyof typeof ProductOfferingTypes];

export const ProductPriceModel = {
	FREE: 'Free',
	PAID: 'Paid',
} as const;

export type ProductPriceModel =
	(typeof ProductPriceModel)[keyof typeof ProductPriceModel];

export const ProductSpecificationKey = {
	APP_BETA: 'app-beta',
	APP_BUILD_NUMBER_OF_CPUS: 'cpu',
	APP_BUILD_RAM_IN_GBS: 'ram',
	APP_DEFAULT_SKU_REF: 'default-sku-ref',
	APP_DEVELOPER_NAME: 'developer-name',
	APP_ENTRY_UUID: 'app-entry-uuid',
	APP_LICENSING_TYPE: 'license-type',
	APP_PRICING_MODEL: 'price-model',
	APP_SETTINGS: 'app-settings',
	APP_STOREFRONT_VIDEO_DESCRIPTION: 'app-storefront-video-description',
	APP_STOREFRONT_VIDEO_URL: 'app-storefront-video-url',
	APP_SUPPORT_DOCUMENTATION_URL: 'appdocumentationurl',
	APP_SUPPORT_EMAIL: 'supportemailaddress',
	APP_SUPPORT_INSTALLATION_GUIDE_URL: 'appinstallationguideurl',
	APP_SUPPORT_PHONE: 'supportphone',
	APP_SUPPORT_PUBLISHER_WEBSITE_URL: 'publisherwebsiteurl',
	APP_SUPPORT_URL: 'supporturl',
	APP_SUPPORT_USAGE_TERMS_URL: 'appusagetermsurl',
	APP_TYPE: 'type',
	APP_VERSION: 'latest-version',
	APP_VERSION_NOTES: 'product-notes',
	LAST_UPDATED_BY: 'last-updated-by',
	LIFERAY_PRODUCT_TYPE: 'liferay-product-type',
	LIFERAY_VERSION: 'liferay-version',
	SOLUTION_COMPANY_DESCRIPTION: 'solution-company-description',
	SOLUTION_COMPANY_EMAIL: 'solution-company-email',
	SOLUTION_COMPANY_PHONE: 'solution-company-phone',
	SOLUTION_COMPANY_WEBSITE: 'solution-company-website',
	SOLUTION_CONTACT_EMAIL: 'solution-contact-email',
	SOLUTION_DETAILS_BLOCKS: 'solution-details-blocks',
	SOLUTION_HEADER_DESCRIPTION: 'solution-header-description',
	SOLUTION_HEADER_TITLE: 'solution-header-title',
	SOLUTION_HEADER_VIDEO_DESCRIPTION: 'solution-header-video-description',
	SOLUTION_HEADER_VIDEO_URL: 'solution-header-video-url',
	SOLUTION_TYPE: 'solution-type',
} as const;

export type ProductSpecificationKey =
	(typeof ProductSpecificationKey)[keyof typeof ProductSpecificationKey];

export const ProductTags = {
	APP_ICON: 'app-icon',
	SOLUTION_DETAILS: 'solution-details',
	SOLUTION_HEADER: 'solution-header',
	SOLUTION_PROFILE_APP_ICON: 'solution-profile-app-icon',
} as const;

export type ProductTags = (typeof ProductTags)[keyof typeof ProductTags];

export const ProductType = {
	AI_HUB: 'ai-hub',
	CLIENT_EXTENSION: 'client-extension',
	CLOUD: 'cloud',
	COMPOSITE_APP: 'composite-app',
	DXP: 'dxp',
	LOW_CODE_CONFIGURATION: 'low-code-configuration',
	OTHER: 'other',
	SSA_SAAS: 'ssa-saas',
} as const;

export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ProductTypeVocabulary = {
	APP: 'app',
	LIFERAY_PRODUCT: 'liferay-product',
	SOLUTION: 'solution',
} as const;

export type ProductTypeVocabulary =
	(typeof ProductTypeVocabulary)[keyof typeof ProductTypeVocabulary];

export const ProductUploadType = {
	GITHUB: 'GitHub',
	LXC: 'Liferay SaaS',
	ZIP_UPLOAD: 'upload',
} as const;

export type ProductUploadType =
	(typeof ProductUploadType)[keyof typeof ProductUploadType];

export const ProductVocabulary = {
	APP_AREA: 'marketplace-app-category',
	APP_CATEGORY: 'marketplace-category',
	APP_TAGS: 'marketplace-app-tags',
	AVAILABILITY: 'marketplace-availability',
	LIFERAY_PLATFORM_OFFERING: 'marketplace-liferay-platform-offering',
	LIFERAY_VERSION: 'marketplace-liferay-version',
	PRODUCT_TYPE: 'marketplace-product-type',
	SOLUTION_CATEGORY: 'marketplace-solution-category',
	SOLUTION_TAGS: 'marketplace-solution-tags',
} as const;

export type ProductVocabulary =
	(typeof ProductVocabulary)[keyof typeof ProductVocabulary];

export const ProductWorkflowStatusCode = {
	APPROVED: 0,
	DENIED: 4,
	DRAFT: 2,
	PENDING: 1,
} as const;

export type ProductWorkflowStatusCode =
	(typeof ProductWorkflowStatusCode)[keyof typeof ProductWorkflowStatusCode];

export const SkuOptions = {
	DEVELOPER: 'developer',
	OPEN_BETA: 'open-beta',
	STANDARD: 'standard',
	TRIAL: 'trial',
} as const;

export type SkuOptions = (typeof SkuOptions)[keyof typeof SkuOptions];

export const EXPERIENCE_OFFERING_PRODUCT_EXTERNAL_REFERENCE_CODES: readonly ProductExternalReferenceCode[] =
	[
		ProductExternalReferenceCode.PAAS_EXPERIENCE,
		ProductExternalReferenceCode.SAAS_EXPERIENCE,
	];

export const ProductTypeLabels = {
	[ProductType.AI_HUB]: 'AI Hub',
	[ProductType.CLIENT_EXTENSION]: 'Client Extension',
	[ProductType.CLOUD]: 'Cloud',
	[ProductType.COMPOSITE_APP]: 'Composite App',
	[ProductType.DXP]: 'DXP',
	[ProductType.LOW_CODE_CONFIGURATION]: 'Low-Code Configuration',
	[ProductType.OTHER]: 'Other',
	[ProductType.SSA_SAAS]: 'SSA SaaS',
} as const;

export const ProductTypeLicenseOptions: Record<
	ProductType,
	ProductLicenseTier[]
> = {
	[ProductType.AI_HUB]: [ProductLicenseTier.STANDARD],
	[ProductType.CLIENT_EXTENSION]: [ProductLicenseTier.STANDARD],
	[ProductType.CLOUD]: [ProductLicenseTier.STANDARD],
	[ProductType.COMPOSITE_APP]: [ProductLicenseTier.STANDARD],
	[ProductType.DXP]: [
		ProductLicenseTier.STANDARD,
		ProductLicenseTier.DEVELOPER,
		ProductLicenseTier.TRIAL,
	],
	[ProductType.LOW_CODE_CONFIGURATION]: [ProductLicenseTier.STANDARD],
	[ProductType.OTHER]: [ProductLicenseTier.STANDARD],
	[ProductType.SSA_SAAS]: [ProductLicenseTier.STANDARD],
};

export const ProductWorkflowDisplayType = {
	[ProductWorkflowStatusCode.APPROVED]: 'success',
	[ProductWorkflowStatusCode.DRAFT]: 'secondary',
	[ProductWorkflowStatusCode.PENDING]: 'warning',
};

export const ProductWorkflowStatusLabel = {
	[ProductWorkflowStatusCode.APPROVED]: i18n.translate('approved'),
	[ProductWorkflowStatusCode.DENIED]: i18n.translate('denied'),
	[ProductWorkflowStatusCode.DRAFT]: i18n.translate('draft'),
	[ProductWorkflowStatusCode.PENDING]: i18n.translate('under-review'),
};
