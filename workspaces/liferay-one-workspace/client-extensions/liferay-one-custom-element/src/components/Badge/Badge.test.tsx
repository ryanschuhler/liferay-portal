/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import Badge from './Badge';

describe('Badge', () => {
	it('renders its children', () => {
		render(<Badge>Expired</Badge>);

		expect(screen.getByText('Expired')).toBeInTheDocument();
	});

	it('defaults to the danger alert type', () => {
		const {container} = render(<Badge>Expired</Badge>);

		expect(container.firstChild).toHaveClass('alert-danger', 'text-danger');
	});

	it('applies the alert type it is given', () => {
		const {container} = render(<Badge alertType="warning">Expiring</Badge>);

		expect(container.firstChild).toHaveClass(
			'alert-warning',
			'text-warning'
		);
		expect(container.firstChild).not.toHaveClass('alert-danger');
	});

	it('adds a badge class name without dropping the defaults', () => {
		const {container} = render(
			<Badge badgeClassName="my-custom-badge">Expired</Badge>
		);

		expect(container.firstChild).toHaveClass('alert', 'my-custom-badge');
	});
});
