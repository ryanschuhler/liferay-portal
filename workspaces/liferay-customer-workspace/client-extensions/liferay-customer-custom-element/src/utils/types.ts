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
	id: string | number;
	name: string;
	roleBriefs?: IRoleBrief[];
}

export interface IAccountRole {
	active?: boolean;
	disabled?: boolean;
	id: number;
	key?: string;
	label?: string;
	name?: string;
	raysourceName?: string;
	value?: number;
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
	activationStatus?: string;
	displayName?: string;
	externalReferenceCode?: string;
	hasActivation?: boolean;
	hasPartnership?: boolean;
	name: string;
}

export interface IActivationKey {
	active?: boolean;
	complimentary: boolean;
	createDate?: string;
	description: string;
	expirationDate: string;
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
	startDate: string;
	status: string;
	version?: string;
}

export interface IActivationValues extends IBaseActivationValues {
	allowedEmailDomains: string;
	incidentReportContact: IContact[];
	ownerEmailAddress: string;
	timeZone: string;
	workspaceFriendlyUrl: string;
	workspaceName: string;
	workspaceURL: string;
}

export interface IAdmin {
	email: string;
	firstName: string;
	github: string;
	lastName: string;
}

export interface IAnalyticsCloudWorkspace {
	accountKey: string;
	allowedEmailDomains: string;
	dataCenterLocation: string;
	id: string;
	ownerEmailAddress: string;
	timeZone: string;
	workspaceFriendlyUrl: string;
	workspaceName: string;
}

export interface IBaseActivationValues {
	dataCenterLocation?: string;
	disasterDataCenterLocation?: string;
	projectId?: string;
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

export interface ICloudNativeEnvironment {
	cloudNativeEnvironmentId: string;
	maxClusterNodes: number;
	nonProductionSubscriptionUuid: string;
	productionSubscriptionUuid: string;
}

export interface ICommerceOrderItem {
	options: {
		endDate: string;
		startDate: string;
	};
	quantity: number;
}

export interface IContact {
	category?: {
		role: string;
	};
	contact?: string;
	email: string;
	filter?: string;
	filterId?: string;
	filterLabel?: string;
	firstName?: string;
	id: number | string;
	key: string;
	label: string;
	labelRole?: string;
	lastName?: string;
	name?: string;
	role?: string;
	roleId?: string;
	value: string;
}

export interface IDateFilterValue {
	onOrAfter: Date | boolean;
	onOrBefore: Date | boolean;
}

export interface IDXPCloudEnvironment {
	projectId: string;
}

export interface IDXPValues extends IBaseActivationValues {
	admins: IAdmin[];
	dataCenterRegion: string;
	disasterDataCenterRegion: string;
	version: string;
}

export interface IFilters {
	environmentTypes: IFilterValue<string[]>;
	expirationDate: IFilterValue<IDateFilterValue>;
	hasValue: boolean;
	instanceSizes: IFilterValue<string[]>;
	keyType: IFilterValue<IKeyTypeFilterValue>;
	productVersions: IFilterValue<string[]>;
	searchTerm: string;
	startDate: IFilterValue<IDateFilterValue>;
	status: IFilterValue<string[]>;
}

export interface IFilterValue<T> {
	name: string;
	value: T;
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
	familyName?: string;
	givenName?: string;
	id: string;
	isAccountAdmin?: boolean;
	isLiferayStaff?: boolean;
	isLoggedUser?: boolean;
	isOmniAdmin?: boolean;
	isPartner?: boolean;
	isProvisioning?: boolean;
	isStaff?: boolean;
	lastLoginDate?: string;
	name?: string;
	organizationBriefs?: {
		id: string;
		name: string;
	}[];
	roleBriefs?: IRoleBrief[];
	selectedAccountSummary?: {
		hasAdministratorRole: boolean;
		hasSupportSeatRole: boolean;
		roleBriefs: IRoleBrief[];
	};
	userAccountContactInformation?: {
		telephones: {phoneNumber: string; primary: boolean}[];
	};
	uuid?: string;
}

export interface IInvite {
	email: string;
	familyName: string;
	givenName: string;
	role: IAccountRole[];
	[key: string]: unknown;
}

export interface IKeyTypeFilterValue {
	hasCluster?: boolean;
	hasOnPremise?: boolean;
	hasVirtualCluster?: boolean;
	maxNodes?: string;
	minNodes?: string;
}

export interface IKoroneikiAccount {
	accountKey: string;
	code: string;
	dxpVersion?: string;
	externalReferenceCode?: string;
	id: string | number;
	liferayContactEmailAddress?: string;
	liferayContactName?: string;
	liferayContactRole?: string;
	maxRequestors?: string | number;
	name: string;
	partnershipCurrent?: string;
	partnershipCurrentEndDate?: string;
	partnershipExpired?: string;
	partnershipExpiredEndDate?: string;
	partnershipFuture?: string;
	partnershipFutureStartDate?: string;
	region?: string;
	slaCurrent?: string;
	slaCurrentEndDate?: string;
	slaCurrentStartDate?: string;
	slaExpired?: string;
	slaExpiredEndDate?: string;
	slaExpiredStartDate?: string;
	slaFuture?: string;
	slaFutureEndDate?: string;
	slaFutureStartDate?: string;
	status: string;
}

export interface ILiferayExperienceCloudEnvironment {
	liferayVersion: string;
	name: string;
	projectId?: string;
	url: string;
	uuid: string;
}

export interface ILXCAdmin {
	email: string;
	fullName: string;
	github: string;
}

export interface ILXCValues extends IBaseActivationValues {
	admins: ILXCAdmin[];
	analyticsCloudOwnersEmailAddress: string;
	incidentManagementEmail: string;
	incidentManagementFullName: string;
	primaryRegion: string;
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
	partner?: boolean;
	salesforceAccountKey?: string;
	salesforceProjectKey?: string;
	slaCurrent?: string;
	slaExpired?: string;
	slaFuture?: string;
}

export interface IRole {
	active?: boolean;
	disabled?: boolean;
	id?: string | number;
	label?: string;
	raysourceName?: string;
	value?: string | number;
}

export interface IRoleBrief {
	id: string;
	name: string;
}

export interface ISelectedKey {
	expirationDate: string;
	licenseEntryType: string;
	licenseVersion: number;
	productVersion: string;
	sizing: string;
	startDate: string;
}

export interface ISelectedKeyData {
	hasNotPermanentLicense?: boolean;
	licenseEntryType?: string;
	productType?: string;
	productVersion?: string;
	selectedSubscription?: ISelectedSubscription;
	[key: string]: unknown;
}

export interface ISelectedSubscription {
	complimentary?: boolean;
	endDate?: string;
	hasNotPermanentLicense?: boolean;
	index?: number;
	instanceSize?: number;
	licenseEntryType?: string;
	licenseKeyEndDates?: {
		endDate: string;
		licenseEntryType: string;
	}[];
	perpetual?: boolean;
	productKey?: string;
	productPurchaseKey?: string;
	provisionedCount?: number;
	quantity?: number;
	startDate?: string;
}

export interface IStructuredContent {
	contentFields: {
		contentFieldValue: {
			data: string;
		};
		name: string;
	}[];
	id: string;
}

export interface ISubscriptionTerm {
	endDate: string;
	instanceSize: number;
	perpetual: boolean;
	productKey: string;
	productPurchaseKey: string;
	provisionedCount: number;
	quantity: number;
	startDate: string;
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
	id?: string | number;
	isAccountAdmin?: boolean;
	isLoggedUser?: boolean;
	isOmniAdmin?: boolean;
	isPartner?: boolean;
	isProvisioning?: boolean;
	isStaff?: boolean;
	lastLoginDate?: string;
	lastName?: string;
	organizationBriefs?: IOrganizationBrief[];
	partnershipCurrent?: string;
	partnershipCurrentEndDate?: string;
	partnershipExpired?: string;
	partnershipExpiredEndDate?: string;
	partnershipFuture?: string;
	partnershipFutureStartDate?: string;
	region?: string;
	roleBriefs?: IRoleBrief[];
	screenName?: string;
	slaCurrent?: string;
	slaCurrentEndDate?: string;
	slaExpired?: string;
	slaExpiredEndDate?: string;
	slaFuture?: string;
	slaFutureStartDate?: string;
	status?: string;
	userId?: number;
	userName?: string;
	uuid?: string;
}

export type BlankSubscriptionType = (typeof SUBSCRIPTION_TYPES.Blank)[number];

export type ProductDisplayExceptionBlankProducts =
	(typeof PRODUCT_DISPLAY_EXCEPTION.blankProducts)[number];

export type ProductDisplayExceptionInstanceSizePurchasedProduct =
	(typeof PRODUCT_DISPLAY_EXCEPTION_INSTANCE_SIZE.purchasedProductInstanceSize)[number];

export type ProductDisplayExceptionNonBlankProducts =
	(typeof PRODUCT_DISPLAY_EXCEPTION.nonBlankProducts)[number];

export type ProductDisplayExceptionPurchasedProduct =
	(typeof PRODUCT_DISPLAY_EXCEPTION.purchasedProduct)[number];

export type PurchasedAndProvisionedSubscriptionType =
	(typeof SUBSCRIPTION_TYPES.PurchasedAndProvisioned)[number];

export type PurchasedSubscriptionType =
	(typeof SUBSCRIPTION_TYPES.Purchased)[number];
