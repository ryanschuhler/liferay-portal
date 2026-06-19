/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {test} from '@playwright/test';

// Hard-failing backlog: every plan item below has no implementable test yet
// (the action matrix, a feature, UI selectors, or seeded state is missing).
// Each test fails with an actionable TODO and turns green when a real test
// replaces it. The [ID] tag makes check-coverage count the item, so a failing
// test here is the difference between "tracked" and "forgotten". Run only the
// implemented tests with: --grep-invert "pending:"

const PENDING: Array<{id: string; todo: string}> = [
	{
		id: 'FLOW-LICENSE-GENERATION',
		todo: 'License key generation produces a signed key tied to the subscription',
	},
	{
		id: 'FLOW-LICENSE-REVOCATION',
		todo: 'Spec-only; no license-key revocation endpoint or action implemented yet. Deferred until built.',
	},
	{
		id: 'FLOW-TRIAL-PROVISIONING',
		todo: 'Spec-only; no trial provisioning endpoint implemented yet (depends on the Liferay Cloud integration). Deferred until built.',
	},
	{
		id: 'FLOW-TRIAL-EXPIRY',
		todo: 'Spec-only; no trial expiry endpoint implemented yet (depends on the Liferay Cloud integration). Deferred until built.',
	},
	{
		id: 'AUTH-OAUTH2-SCOPES',
		todo: 'Custom REST endpoints enforce their declared OAuth2 scopes',
	},
	{
		id: 'ERROR-CONTRACT',
		todo: 'Custom REST errors follow the documented error envelope and status codes',
	},
	{
		id: 'OBJ-PUBLISHERASSETATTACHMENT',
		todo: 'Headless CRUD, required-field validation, and scoping: PublisherAssetAttachment',
	},
	{
		id: 'INT-DATA-WAREHOUSE',
		todo: 'Spec-only; no BigQuery client implemented in the workspace yet. Deferred until built.',
	},
	{
		id: 'INT-GOOGLE-CLOUD-FUNCTIONS',
		todo: 'Spec-only; no Cloud Functions client implemented in the workspace yet. Deferred until built.',
	},
	{
		id: 'INT-GOOGLE-CLOUD-STORAGE',
		todo: 'Outbound GCS contract (signed URLs, deletes). Needs an injectable Storage client or a live test; service currently builds the client internally.',
	},
	{
		id: 'INT-LIFERAY-CLOUD',
		todo: 'Spec-only; no Liferay Cloud provisioning/console client implemented in the workspace yet. Deferred until built.',
	},
	{
		id: 'ROLE-ACCOUNT-REQUESTER',
		todo: 'Role grants and denies the correct actions: Account Requester',
	},
	{
		id: 'ROLE-ACCOUNT-SOLUTION-PUBLISHER',
		todo: 'Role grants and denies the correct actions: Account Solution Publisher',
	},
	{
		id: 'ROLE-ACCOUNT-SUPPLIER',
		todo: 'Role grants and denies the correct actions: Account Supplier',
	},
	{
		id: 'ROLE-ANALYTICS-CLOUD-OWNER',
		todo: 'Role grants and denies the correct actions: Analytics Cloud Owner',
	},
	{
		id: 'ROLE-ARTICLE-ADMINISTRATOR',
		todo: 'Role grants and denies the correct actions: Article Administrator',
	},
	{
		id: 'ROLE-CLOUD-NATIVE-CONTACT',
		todo: 'Role grants and denies the correct actions: Cloud Native Contact',
	},
	{
		id: 'ROLE-CRITICAL-INCIDENT-CONTACT',
		todo: 'Role grants and denies the correct actions: Critical Incident Contact',
	},
	{
		id: 'ROLE-CUSTOMER-EXPERIENCE-MANAGER',
		todo: 'Role grants and denies the correct actions: Customer Experience Manager',
	},
	{
		id: 'ROLE-DASHBOARD-VIEWER',
		todo: 'Role grants and denies the correct actions: Dashboard Viewer',
	},
	{
		id: 'ROLE-DATA-BREACH-CONTACT',
		todo: 'Role grants and denies the correct actions: Data Breach Contact',
	},
	{
		id: 'ROLE-DOCUMENTATION-ADMINISTRATOR',
		todo: 'Role grants and denies the correct actions: Documentation Administrator',
	},
	{
		id: 'ROLE-FINANCE-ADMINISTRATOR',
		todo: 'Role grants and denies the correct actions: Finance Administrator',
	},
	{
		id: 'ROLE-LDP-ADMINISTRATOR',
		todo: 'Role grants and denies the correct actions: LDP Administrator',
	},
	{
		id: 'ROLE-LIFERAY-SALES',
		todo: 'Role grants and denies the correct actions: Liferay Sales',
	},
	{
		id: 'ROLE-LIFERAY-STAFF',
		todo: 'Role grants and denies the correct actions: Liferay Staff',
	},
	{
		id: 'ROLE-MARKETPLACE-PUBLISHER',
		todo: 'Role grants and denies the correct actions: Marketplace Publisher',
	},
	{
		id: 'ROLE-MEMBER',
		todo: 'Role grants and denies the correct actions: Member',
	},
	{
		id: 'ROLE-PARTNER-MANAGER',
		todo: 'Role grants and denies the correct actions: Partner Manager',
	},
	{
		id: 'ROLE-PARTNER-MARKETING-USER',
		todo: 'Role grants and denies the correct actions: Partner Marketing User',
	},
	{
		id: 'ROLE-PARTNER-MEMBER',
		todo: 'Role grants and denies the correct actions: Partner Member',
	},
	{
		id: 'ROLE-PARTNER-SALES-USER',
		todo: 'Role grants and denies the correct actions: Partner Sales User',
	},
	{
		id: 'ROLE-PARTNER-TECHNICAL-USER',
		todo: 'Role grants and denies the correct actions: Partner Technical User',
	},
	{
		id: 'ROLE-PRIMARY-CONTACT',
		todo: 'Role grants and denies the correct actions: Primary Contact',
	},
	{
		id: 'ROLE-PROVISIONING-ADMINISTRATOR',
		todo: 'Role grants and denies the correct actions: Provisioning Administrator',
	},
	{
		id: 'ROLE-PROVISIONING-CONTACT-WORKER',
		todo: 'Role grants and denies the correct actions: Provisioning Contact Worker',
	},
	{
		id: 'ROLE-PROVISIONING-MEMBER',
		todo: 'Role grants and denies the correct actions: Provisioning Member',
	},
	{
		id: 'ROLE-PROVISIONING-SUBSCRIPTION-WORKER',
		todo: 'Role grants and denies the correct actions: Provisioning Subscription Worker',
	},
	{
		id: 'ROLE-PROVISIONING-WATCHER',
		todo: 'Role grants and denies the correct actions: Provisioning Watcher',
	},
	{
		id: 'ROLE-PROVISIONING-WORKER',
		todo: 'Role grants and denies the correct actions: Provisioning Worker',
	},
	{id: 'ROLE-SSA', todo: 'Role grants and denies the correct actions: SSA'},
	{
		id: 'ROLE-SSA-ADMINISTRATOR',
		todo: 'Role grants and denies the correct actions: SSA Administrator',
	},
	{
		id: 'ROLE-SSA-USER',
		todo: 'Role grants and denies the correct actions: SSA User',
	},
	{
		id: 'ROLE-SECONDARY-CONTACT',
		todo: 'Role grants and denies the correct actions: Secondary Contact',
	},
	{
		id: 'ROLE-SECURITY-INCIDENT-CONTACT',
		todo: 'Role grants and denies the correct actions: Security Incident Contact',
	},
	{
		id: 'ROLE-SITE-CONTENT-REVIEWER',
		todo: 'Role grants and denies the correct actions: Site Content Reviewer',
	},
	{
		id: 'ROLE-SOLUTION-ARCHITECT',
		todo: 'Role grants and denies the correct actions: Solution Architect',
	},
	{
		id: 'ROLE-SUPPORT-ADMINISTRATOR',
		todo: 'Role grants and denies the correct actions: Support Administrator',
	},
];

for (const item of PENDING) {
	test(`[${item.id}] pending: not yet implementable`, () => {
		throw new Error(`PENDING ${item.id} — ${item.todo}`);
	});
}
