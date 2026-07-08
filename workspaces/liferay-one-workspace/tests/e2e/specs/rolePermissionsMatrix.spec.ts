/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Locator, Page, expect, test} from '@playwright/test';

import {SPAPage} from '../pages/SPAPage';
import {liferayLogin, liferayLogout} from '../utils/loginUtils';

type Access = 'full' | 'none' | 'view';

type Persona = {
	email: string;
	label: string;
	password: string;
};

function persona(
	label: string,
	emailVar: string,
	passwordVar: string
): Persona {
	return {
		email: process.env[emailVar] ?? 'test@liferay.com',
		label,
		password: process.env[passwordVar] ?? 'test',
	};
}

const ACCOUNT_ERC = process.env.ONE_ACCOUNT_ERC ?? 'ACCNT-001';
const ACCOUNT_KEY = process.env.ONE_ACCOUNT_KEY ?? 'ACCNT-001';
const PROJECT_ERC = process.env.ONE_PROJECT_ERC ?? 'PRJCT-001';
const UNASSIGNED_PROJECT_ERC =
	process.env.ONE_UNASSIGNED_PROJECT_ERC ?? 'PRJCT-999';

const ACCOUNT_ADMIN = persona(
	'Account Admin',
	'ONE_ACCOUNT_ADMIN_EMAIL',
	'ONE_ACCOUNT_ADMIN_PASSWORD'
);
const PARTNER_ACCOUNT_ADMIN = persona(
	'Partner Account Admin',
	'ONE_PARTNER_ADMIN_EMAIL',
	'ONE_PARTNER_ADMIN_PASSWORD'
);
const ACCOUNT_BUYER = persona(
	'Account Buyer',
	'ONE_ACCOUNT_BUYER_EMAIL',
	'ONE_ACCOUNT_BUYER_PASSWORD'
);
const ACCOUNT_MEMBER = persona(
	'Account Member',
	'ONE_ACCOUNT_MEMBER_EMAIL',
	'ONE_ACCOUNT_MEMBER_PASSWORD'
);
const NULL_ROLE = persona(
	'No Role (null)',
	'ONE_NULL_ROLE_EMAIL',
	'ONE_NULL_ROLE_PASSWORD'
);
const NULL_PROJECT_MEMBER = persona(
	'No Role (null), project member',
	'ONE_NULL_PROJECT_MEMBER_EMAIL',
	'ONE_NULL_PROJECT_MEMBER_PASSWORD'
);
const PROJECT_ADMIN = persona(
	'Project Admin',
	'ONE_PROJECT_ADMIN_EMAIL',
	'ONE_PROJECT_ADMIN_PASSWORD'
);
const PROJECT_REQUESTER = persona(
	'Project Requester',
	'ONE_PROJECT_REQUESTER_EMAIL',
	'ONE_PROJECT_REQUESTER_PASSWORD'
);
const PROJECT_USER = persona(
	'Project User',
	'ONE_PROJECT_USER_EMAIL',
	'ONE_PROJECT_USER_PASSWORD'
);

type Feature = {
	action?: (page: Page) => Locator;
	content: (page: Page) => Locator;
	goto: (page: Page) => Promise<SPAPage>;
	name: string;
};

async function open(page: Page, path: string) {
	const spaPage = new SPAPage(page, path);

	await spaPage.goto();

	await expect(spaPage.customElement.first()).toBeAttached();

	return spaPage;
}

async function assertAccess(page: Page, feature: Feature, access: Access) {
	await feature.goto(page);

	const content = feature.content(page);

	if (access === 'none') {
		await expect(content).toHaveCount(0);

		return;
	}

	await expect(content.first()).toBeVisible({timeout: 30000});

	if (feature.action) {
		if (access === 'full') {
			await expect(feature.action(page).first()).toBeVisible();
		}
		else {
			await expect(feature.action(page)).toHaveCount(0);
		}
	}
}

test.afterEach(async ({page}) => {
	await liferayLogout(page);
});

const ACCOUNT_DETAILS: Feature = {
	action: (page) => page.getByRole('button', {name: /edit/i}),
	content: (page) => page.getByRole('heading', {name: /account details/i}),
	goto: (page) =>
		open(page, `/web/one/my-account#/${ACCOUNT_ERC}/account-details`),
	name: 'Account Details',
};

const ACCOUNT_MEMBERS: Feature = {
	action: (page) => page.getByRole('button', {name: /invite/i}),
	content: (page) => page.getByRole('table'),
	goto: (page) =>
		open(page, `/web/one/my-account#/${ACCOUNT_ERC}/account-members`),
	name: 'Account Members list',
};

const ACCOUNT_ORDERS: Feature = {
	content: (page) => page.getByRole('table'),
	goto: (page) => open(page, `/web/one/my-account#/${ACCOUNT_ERC}/orders`),
	name: 'Account Orders',
};

const PROJECTS: Feature = {
	action: (page) => page.getByRole('tab', {name: /project permissions/i}),
	content: (page) =>
		page.getByRole('link', {name: new RegExp(PROJECT_ERC, 'i')}),
	goto: (page) => open(page, `/web/one/my-account#/${ACCOUNT_ERC}`),
	name: 'Projects',
};

const ACCOUNT_LEVEL_MATRIX: Array<{
	access: Record<string, Access>;
	feature: Feature;
}> = [
	{
		access: {
			'Account Admin': 'full',
			'Account Buyer': 'view',
			'Account Member': 'view',
			'No Role (null)': 'view',
			'Partner Account Admin': 'full',
		},
		feature: ACCOUNT_DETAILS,
	},
	{
		access: {
			'Account Admin': 'full',
			'Account Buyer': 'none',
			'Account Member': 'view',
			'No Role (null)': 'view',
			'Partner Account Admin': 'full',
		},
		feature: ACCOUNT_MEMBERS,
	},
	{
		access: {
			'Account Admin': 'full',
			'Account Buyer': 'view',
			'Account Member': 'view',
			'No Role (null)': 'none',
			'Partner Account Admin': 'full',
		},
		feature: ACCOUNT_ORDERS,
	},
	{
		access: {
			'Account Admin': 'full',
			'Account Buyer': 'none',
			'Account Member': 'view',
			'No Role (null)': 'none',
			'Partner Account Admin': 'full',
		},
		feature: PROJECTS,
	},
];

const ACCOUNT_PERSONAS: Persona[] = [
	ACCOUNT_ADMIN,
	PARTNER_ACCOUNT_ADMIN,
	ACCOUNT_BUYER,
	ACCOUNT_MEMBER,
	NULL_ROLE,
];

test.describe.fixme(
	'[FLOW-ROLE-ACCOUNT-PERMISSIONS] account-level pages permission matrix',
	() => {
		for (const {access, feature} of ACCOUNT_LEVEL_MATRIX) {
			for (const account of ACCOUNT_PERSONAS) {
				test(`[FLOW-ROLE-ACCOUNT-PERMISSIONS] ${account.label} — ${feature.name}: ${access[account.label]}`, async ({
					page,
				}) => {
					await liferayLogin(page, account.email, account.password);

					await assertAccess(page, feature, access[account.label]);
				});
			}
		}
	}
);

const PROJECT_DETAILS: Feature = {
	content: (page) => page.getByRole('heading', {level: 1}),
	goto: (page) =>
		open(page, `/web/one/my-account#/${ACCOUNT_ERC}/${PROJECT_ERC}`),
	name: 'Project details (view)',
};

const PROJECT_MEMBERS: Feature = {
	action: (page) => page.getByRole('button', {name: /edit|assign|manage/i}),
	content: (page) => page.getByRole('table'),
	goto: (page) =>
		open(page, `/web/one/my-account#/${ACCOUNT_ERC}/project-members`),
	name: 'Project Members',
};

const BUSINESS_EVENTS: Feature = {
	action: (page) => page.getByRole('button', {name: /add|new/i}),
	content: (page) => page.getByRole('table'),
	goto: (page) =>
		open(
			page,
			`/web/one/support/business-events#/${ACCOUNT_KEY}/business-events`
		),
	name: 'Business Events (view)',
};

const TICKET_ATTACHMENTS: Feature = {
	action: (page) => page.getByRole('button', {name: /upload|attach/i}),
	content: (page) => page.getByRole('table'),
	goto: (page) => open(page, '/web/one/support/ticket-attachments#/'),
	name: 'Ticket Attachments (view)',
};

const SUBMIT_SUPPORT_TICKET: Feature = {
	action: (page) =>
		page.getByRole('button', {name: /submit|new ticket|create/i}),
	content: (page) => page.getByRole('heading', {name: /support|tickets/i}),
	goto: (page) => open(page, '/web/one/support'),
	name: 'Submit support ticket',
};

const PROJECT_LEVEL_MATRIX: Array<{
	access: Record<string, Access>;
	feature: Feature;
}> = [
	{
		access: {
			'Account Admin': 'view',
			'Project Admin': 'view',
			'Project Requester': 'view',
			'Project User': 'view',
		},
		feature: PROJECT_DETAILS,
	},
	{
		access: {
			'Account Admin': 'full',
			'Project Admin': 'full',
			'Project Requester': 'view',
			'Project User': 'view',
		},
		feature: PROJECT_MEMBERS,
	},
	{
		access: {
			'Account Admin': 'full',
			'Project Admin': 'full',
			'Project Requester': 'full',
			'Project User': 'view',
		},
		feature: BUSINESS_EVENTS,
	},
	{
		access: {
			'Account Admin': 'full',
			'Project Admin': 'full',
			'Project Requester': 'full',
			'Project User': 'view',
		},
		feature: TICKET_ATTACHMENTS,
	},
	{
		access: {
			'Account Admin': 'full',
			'Project Admin': 'full',
			'Project Requester': 'full',
			'Project User': 'view',
		},
		feature: SUBMIT_SUPPORT_TICKET,
	},
];

const PROJECT_PERSONAS: Persona[] = [
	ACCOUNT_ADMIN,
	PROJECT_ADMIN,
	PROJECT_REQUESTER,
	PROJECT_USER,
];

test.describe.fixme(
	'[FLOW-ROLE-PROJECT-PERMISSIONS] project-level pages permission matrix',
	() => {
		for (const {access, feature} of PROJECT_LEVEL_MATRIX) {
			for (const projectPersona of PROJECT_PERSONAS) {
				test(`[FLOW-ROLE-PROJECT-PERMISSIONS] ${projectPersona.label} — ${feature.name}: ${access[projectPersona.label]}`, async ({
					page,
				}) => {
					await liferayLogin(
						page,
						projectPersona.email,
						projectPersona.password
					);

					await assertAccess(
						page,
						feature,
						access[projectPersona.label]
					);
				});
			}
		}
	}
);

test.describe.fixme(
	'[FLOW-ROLE-NULL-PROJECT-ACCESS] null role project access',
	() => {
		test('[FLOW-ROLE-NULL-PROJECT-ACCESS] with no project membership, only account-level pages are reachable', async ({
			page,
		}) => {
			await liferayLogin(page, NULL_ROLE.email, NULL_ROLE.password);

			await assertAccess(page, ACCOUNT_DETAILS, 'view');
			await assertAccess(page, ACCOUNT_MEMBERS, 'view');

			await open(
				page,
				`/web/one/my-account#/${ACCOUNT_ERC}/${PROJECT_ERC}`
			);

			await expect(page.getByRole('table')).toHaveCount(0);
		});

		test('[FLOW-ROLE-NULL-PROJECT-ACCESS] with a project membership, account-level and that project are reachable', async ({
			page,
		}) => {
			await liferayLogin(
				page,
				NULL_PROJECT_MEMBER.email,
				NULL_PROJECT_MEMBER.password
			);

			await assertAccess(page, ACCOUNT_DETAILS, 'view');

			await open(
				page,
				`/web/one/my-account#/${ACCOUNT_ERC}/${PROJECT_ERC}`
			);

			await expect(
				page.getByRole('heading', {level: 1}).first()
			).toBeVisible({timeout: 30000});
		});

		test('[FLOW-ROLE-NULL-PROJECT-ACCESS] a project the user is not assigned to is not displayed', async ({
			page,
		}) => {
			await liferayLogin(
				page,
				NULL_PROJECT_MEMBER.email,
				NULL_PROJECT_MEMBER.password
			);

			await open(
				page,
				`/web/one/my-account#/${ACCOUNT_ERC}/${UNASSIGNED_PROJECT_ERC}`
			);

			await expect(
				page.getByRole('link', {
					name: new RegExp(UNASSIGNED_PROJECT_ERC, 'i'),
				})
			).toHaveCount(0);

			await expect(page.getByRole('table')).toHaveCount(0);
		});
	}
);
