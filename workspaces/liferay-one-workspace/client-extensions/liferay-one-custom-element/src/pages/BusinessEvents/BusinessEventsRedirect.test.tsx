/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {translate} from '~/i18n';
import BusinessEventsRedirect from '~/pages/BusinessEvents/BusinessEventsRedirect';

const {setLastViewedProjectCookie, useUserProjects} = vi.hoisted(() => ({
	setLastViewedProjectCookie: vi.fn(),
	useUserProjects: vi.fn(),
}));

vi.mock('~/pages/MyAccount/Projects/projects', () => ({
	getCurrentUserId: () => '1001',
	getLastViewedProjectCookie: () => 'PRJCT-2',
	getSelectedAccountId: () => '2002',
	resolveProjectERC: (
		projects: {externalReferenceCode: string}[],
		lastViewed?: string
	) =>
		projects.find(
			(project) => project.externalReferenceCode === lastViewed
		)?.externalReferenceCode ?? projects[0]?.externalReferenceCode,
	setLastViewedProjectCookie,
	useUserProjects,
}));

function renderAt(path: string) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>
				<Route
					element={<BusinessEventsRedirect />}
					path=":projectERC/business-events"
				>
					<Route element={<h2>Event list</h2>} index />
				</Route>
			</Routes>
		</MemoryRouter>
	);
}

describe('BusinessEventsRedirect', () => {
	beforeEach(() => {
		setLastViewedProjectCookie.mockClear();
	});

	it('shows the loading page while the projects are still resolving', () => {
		useUserProjects.mockReturnValue({
			hasAccountProjects: false,
			loading: true,
			projects: [],
		});

		const {container} = renderAt('/PRJCT-1/business-events');

		expect(screen.queryByText('Event list')).not.toBeInTheDocument();
		expect(container.querySelector('.loading-page')).toBeInTheDocument();
	});

	it('renders the page for a project the user belongs to', () => {
		useUserProjects.mockReturnValue({
			hasAccountProjects: true,
			loading: false,
			projects: [{externalReferenceCode: 'PRJCT-1'}],
		});

		renderAt('/PRJCT-1/business-events');

		expect(screen.getByText('Event list')).toBeInTheDocument();
		expect(setLastViewedProjectCookie).toHaveBeenCalledWith(
			'2002',
			'PRJCT-1',
			'1001'
		);
	});

	it('redirects away from a project the user does not belong to', async () => {
		useUserProjects.mockReturnValue({
			hasAccountProjects: true,
			loading: false,
			projects: [{externalReferenceCode: 'PRJCT-2'}],
		});

		renderAt('/PRJCT-1/business-events');

		expect(await screen.findByText('Event list')).toBeInTheDocument();
		expect(setLastViewedProjectCookie).toHaveBeenCalledWith(
			'2002',
			'PRJCT-2',
			'1001'
		);
	});

	it('locks the feature when the user has no project at all', () => {
		useUserProjects.mockReturnValue({
			hasAccountProjects: false,
			loading: false,
			projects: [],
		});

		renderAt('/PRJCT-1/business-events');

		expect(screen.queryByText('Event list')).not.toBeInTheDocument();
		expect(
			screen.getByText(
				translate('this-feature-is-not-included-in-your-current-plan')
			)
		).toBeInTheDocument();
	});

	it('tells a user whose account has projects to ask for access', () => {
		useUserProjects.mockReturnValue({
			hasAccountProjects: true,
			loading: false,
			projects: [],
		});

		renderAt('/PRJCT-1/business-events');

		expect(screen.queryByText('Event list')).not.toBeInTheDocument();
		expect(
			screen.getByText(
				translate(
					'login-as-a-user-that-has-access-to-a-project-or-contact-your-project-administrator-to-add-you-to-a-project.'
				)
			)
		).toBeInTheDocument();
	});
});
