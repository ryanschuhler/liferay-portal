/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	PRODUCT_DISPLAY_EXCEPTION,
	PRODUCT_DISPLAY_EXCEPTION_INSTANCE_SIZE,
	SUBSCRIPTION_TYPES,
} from '~/utils/constants/subscriptionCardsCount';

export interface IAccountBrief {
	externalReferenceCode: string;
	id: number;
	name: string;
	roleBriefs: IRoleBrief[] | undefined;
}

export interface IAccountRole {
	id?: number;
	label?: string;
	name?: string;
	raysourceName?: string;
}

export interface IAccountSubscription {
	accountKey: string;
	accountSubscriptionGroupERC: string;
	accountSubscriptionId: number;
	endDate: string;
	externalReferenceCode: string;
	instanceSize: string;
	name: string;
	productKey: string;
	quantity: number;
	startDate: string;
}

export interface IAccountSubscriptionGroup {
	accountSubscriptionGroupId?: number;
	activationProductName?: string;
	activationStatus: string;
	externalReferenceCode?: string;
	hasActivation?: boolean;
	hasPartnership?: boolean;
	name: string;
}

export interface IBusinessEvent {
	actualGoLiveDate?: string;
	actualGoLiveDateTime?: string;
	actualGoLiveTime?: string;
	associatedTickets?: string;
	currentLiferayVersion?: {
		key: string;
		name: string;
	};
	dateModified?: string;
	description?: string;
	details?: string;
	eventStatus?: {
		key: string;
		name: string;
	};
	eventType?: {
		key: string;
		name: string;
	};
	id?: number;
	lastComment?: string;
	name?: string;
	newLiferayVersion?: {
		key: string;
		name: string;
	};
	r_accountEntryToBusinessEvents_accountEntryId?: number;
	targetGoLiveDate?: string;
	targetGoLiveDateTime?: string;
	targetGoLiveTime?: string;
	timeZone?: {
		key: string;
		name: string;
	};
}

export interface IBusinessEventVersion {
	change?: {
		key: string;
		name: string;
	};
	comment?: string;
	creator?: {
		name: string;
	};
	dateModified?: string;
	r_accountEntryToBusinessEventVersions_accountEntryId?: number;
	r_businessEventToBusinessEventVersions_c_businessEventId?: number;
}

export interface IKoroneikiAccount {
	accountKey: string;
	code: string;
	dxpVersion?: string;
	id: number;
	maxRequestors?: number;
	name: string;
	partnershipCurrent?: string;
	partnershipCurrentEndDate?: string;
	partnershipExpired?: string;
	partnershipExpiredEndDate?: string;
	partnershipFuture?: string;
	partnershipFutureStartDate?: string;
	region: string;
	slaCurrent?: string;
	slaCurrentEndDate?: string;
	slaExpired?: string;
	slaExpiredEndDate?: string;
	slaFuture?: string;
	slaFutureStartDate?: string;
	status: string;
}

export interface IOption {
	disabled?: boolean;
	label: string;
	value: string | number;
}

export interface IOrganizationBrief {
	id: string;
	name: string;
}

export interface IProject {
	acWorkspaceGroupId: string;
	accountKey: string;
	allowSelfProvisioning?: boolean;
	code: string;
	dxpVersion: string;
	externalReferenceCode?: string;
	id: string;
	liferayContactEmailAddress?: string;
	liferayContactName?: string;
	maxRequestors: number;
	name: string;
	partner?: any;
	slaCurrent?: string;
}

export interface IRole {
	id: string;
	name: string;
	raysourceName: string;
	[key: string]: any;
}

export interface IInvite {
	email: string;
	familyName: string;
	givenName: string;
	role: IAccountRole[];
	[key: string]: any;
}

export interface IActivationKey {
	active?: boolean;
	complimentary: boolean;
	createDate?: string;
	description: string;
	expirationDate: string | Date;
	hostName: string;
	id: string;
	ipAddresses: string;
	isLiferayManaged?: boolean;
	keyType?: string;
	licenseEntryType: string;
	licenseVersion?: number;
	macAddresses: string;
	maxClusterNodes: number;
	name: string;
	productName: string;
	productVersion: string;
	sizing: string;
	startDate: string | Date;
	status: string;
	version?: string;
}

export interface IRoleBrief {
	id: string;
	name: string;
}

export interface IGraphQLUserAccount {
	accountBriefs?: {
		externalReferenceCode: string;
		id: string;
		name: string;
		roleBriefs?: IRoleBrief[];
	}[];
	dateCreated?: string;
	emailAddress?: string;
	id: string;
	isLiferayStaff?: boolean;
	isLoggedUser?: boolean;
	isPartner?: boolean;
	lastLoginDate?: string;
	name?: string;
	organizationBriefs?: {
		id: string;
		name: string;
	}[];
	roleBriefs?: IRoleBrief[];
	uuid?: string;
}

export interface IMyAccountApollo {
	myUserAccount: IGraphQLUserAccount;
}

export interface ISelectedSubscription {
	complimentary?: boolean;
	endDate?: string;
	instanceSize?: number;
	perpetual?: boolean;
	productKey?: string;
	productPurchaseKey?: string;
	provisionedCount?: number;
	quantity?: number;
	startDate?: string;
}

export interface ISelectedKeyData {
	hasNotPermanentLicense?: boolean;
	licenseEntryType?: string;
	productType?: string;
	productVersion?: string;
	selectedSubscription?: ISelectedSubscription;
	[key: string]: any;
}

export interface ITicket {
	link: string;
	selected?: boolean;
	status: string;
	subject: string;
	ticketId: string | number;
}

export interface ITicketAttachment {
	accountKey: string;
	creator: {
		id: string;
		name: string;
	};
	dateCreated: string;
	downloadUrl?: string;
	fileName: string;
	fileSize: string;
	id: number;
	jiraIssueKey: string;
}

export interface ITimeInput {
	hours: string;
	minutes: string;
}

export interface IUpload {
	accountKey?: string;
	attachmentName?: string;
	errorCode?: string;
	errorMessage?: string;
	gcsSessionURL?: string;
	ticketAttachmentId?: string;
	ticketId?: string;
	uploadAccountKey?: string;
}

export interface IUserAccount {
	accountBriefs?: IAccountBrief[];
	accountKey?: string;
	code?: string;
	dateCreated?: string;
	email?: string;
	emailAddress?: string;
	familyName?: string;
	firstName?: string;
	givenName?: string;
	id?: number;
	isAccountAdmin: boolean;
	isLoggedUser?: boolean;
	isOmniAdmin: boolean;
	isPartner?: boolean;
	isProvisioning: boolean;
	isStaff: boolean;
	lastLoginDate?: string;
	lastName?: string;
	organizationBriefs?: IOrganizationBrief[];
	partnershipCurrent?: string;
	partnershipCurrentEndDate?: string;
	partnershipExpired?: string;
	partnershipExpiredEndDate?: string;
	partnershipFuture?: string;
	partnershipFutureStartDate?: string;
	region: string;
	roleBriefs?: IRoleBrief[];
	screenName?: string;
	slaCurrent?: string;
	slaCurrentEndDate?: string;
	slaExpired?: string;
	slaExpiredEndDate?: string;
	slaFuture?: string;
	slaFutureStartDate?: string;
	status: string;
	userId?: number;
	userName?: string;
	uuid?: string;
}

export interface FilterValue<T> {
	name: string;
	value: T;
}

export interface DateFilterValue {
	onOrAfter: Date | boolean;
	onOrBefore: Date | boolean;
}

export interface KeyTypeFilterValue {
	hasCluster?: boolean;
	hasOnPremise?: boolean;
	hasVirtualCluster?: boolean;
	maxNodes?: string;
	minNodes?: string;
}

export interface IFilters {
	environmentTypes: FilterValue<string[]>;
	expirationDate: FilterValue<DateFilterValue>;
	hasValue: boolean;
	instanceSizes: FilterValue<string[]>;
	keyType: FilterValue<KeyTypeFilterValue>;
	productVersions: FilterValue<string[]>;
	searchTerm: string;
	startDate: FilterValue<DateFilterValue>;
	status: FilterValue<string[]>;
}

// Types for SUBSCRIPTION_TYPES

export type BlankSubscriptionType = (typeof SUBSCRIPTION_TYPES.Blank)[number];
export type PurchasedSubscriptionType =
	(typeof SUBSCRIPTION_TYPES.Purchased)[number];
export type PurchasedAndProvisionedSubscriptionType =
	(typeof SUBSCRIPTION_TYPES.PurchasedAndProvisioned)[number];

// Types for PRODUCT_DISPLAY_EXCEPTION

export type ProductDisplayExceptionBlankProducts =
	(typeof PRODUCT_DISPLAY_EXCEPTION.blankProducts)[number];
export type ProductDisplayExceptionNonBlankProducts =
	(typeof PRODUCT_DISPLAY_EXCEPTION.nonBlankProducts)[number];
export type ProductDisplayExceptionPurchasedProduct =
	(typeof PRODUCT_DISPLAY_EXCEPTION.purchasedProduct)[number];

// Types for PRODUCT_DISPLAY_EXCEPTION_INSTANCE_SIZE

export type ProductDisplayExceptionInstanceSizePurchasedProduct =
	(typeof PRODUCT_DISPLAY_EXCEPTION_INSTANCE_SIZE.purchasedProductInstanceSize)[number];

export interface ISelectedKey {
	expirationDate: string | Date;
	licenseEntryType: string;
	licenseVersion: number;
	productVersion: string;
	sizing: string;
	startDate: string | Date;
}
