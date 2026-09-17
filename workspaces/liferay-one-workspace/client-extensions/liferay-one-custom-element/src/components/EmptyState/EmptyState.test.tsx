/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import i18n from '~/i18n';

import EmptyState, {States} from './EmptyState';

describe('EmptyState', () => {
	it('falls back to the translated no-results copy', () => {
		render(<EmptyState />);

		expect(
			screen.getByText(i18n.translate('no-results-found'))
		).toBeInTheDocument();
		expect(
			screen.getByText(
				i18n.translate('sorry-there-are-no-results-found')
			)
		).toBeInTheDocument();
	});

	it('prefers the caller title and description over the fallback', () => {
		render(
			<EmptyState
				description="Invite a teammate to get started"
				title="No members yet"
			/>
		);

		expect(screen.getByText('No members yet')).toBeInTheDocument();
		expect(
			screen.getByText('Invite a teammate to get started')
		).toBeInTheDocument();
		expect(
			screen.queryByText(i18n.translate('no-results-found'))
		).not.toBeInTheDocument();
	});

	it('keeps an empty description empty instead of restoring the fallback', () => {
		render(<EmptyState description="" />);

		expect(
			screen.queryByText(
				i18n.translate('sorry-there-are-no-results-found')
			)
		).not.toBeInTheDocument();
	});

	it('picks the illustration that matches the state type', () => {
		const {container, rerender} = render(<EmptyState type="NOT_FOUND" />);

		expect(container.querySelector('img')).toHaveAttribute(
			'src',
			States.NOT_FOUND
		);

		rerender(<EmptyState imgSrc="/custom.svg" type="NOT_FOUND" />);

		expect(container.querySelector('img')).toHaveAttribute(
			'src',
			'/custom.svg'
		);
	});

	it('renders the call to action passed as children', () => {
		render(
			<EmptyState>
				<button type="button">Add a project</button>
			</EmptyState>
		);

		expect(
			screen.getByRole('button', {name: 'Add a project'})
		).toBeInTheDocument();
	});
});
