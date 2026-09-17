/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {PaymentStatus} from '~/utils/orderUtils';

import PaymentStatusBadge from './PaymentStatusBadge';

function paymentStatusIcon(container: HTMLElement) {
	return container.querySelector('.payment-status-icon') as HTMLElement;
}

describe('PaymentStatusBadge', () => {
	it.each([
		[PaymentStatus.CANCELED, 'Canceled', 'text-danger'],
		[PaymentStatus.FAILED, 'Failed', 'text-danger'],
		[PaymentStatus.NOT_REQUIRED, 'Not Required', 'text-success'],
		[PaymentStatus.PAID, 'Paid', 'text-success'],
		[PaymentStatus.PAYMENT_PENDING, 'Unpaid', 'text-warning'],
		[PaymentStatus.PENDING, 'Unpaid', 'text-warning'],
	])('labels status %i as "%s"', (status, label, className) => {
		const {container} = render(<PaymentStatusBadge paymentStatus={status} />);

		expect(screen.getByText(label)).toBeInTheDocument();
		expect(paymentStatusIcon(container)).toHaveClass(className);
	});

	it('never leaves an unknown status unlabelled', () => {
		render(<PaymentStatusBadge paymentStatus={-1} />);

		expect(screen.getByText('Paid')).toBeInTheDocument();
	});
});
