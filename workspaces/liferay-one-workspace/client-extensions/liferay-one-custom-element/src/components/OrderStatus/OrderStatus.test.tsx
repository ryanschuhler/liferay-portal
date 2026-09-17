/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {OrderWorkflowStatusCode} from '~/utils/orderUtils';

import OrderStatus from './OrderStatus';

import type {PlacedOrder} from '~/types/orders';

function placedOrder(code: number, orderType: string, label = 'Completed') {
	return {
		orderStatusInfo: {code, label},
		orderTypeExternalReferenceCode: orderType,
	} as unknown as PlacedOrder;
}

function statusIcon(container: HTMLElement) {
	return container.querySelector('.order-status-icon') as HTMLElement;
}

describe('OrderStatus', () => {
	it('reads a completed subscription as active rather than completed', () => {
		const {container} = render(
			<OrderStatus
				placedOrder={placedOrder(
					OrderWorkflowStatusCode.COMPLETED,
					'DXP'
				)}
			/>
		);

		expect(screen.getByText('Active')).toBeInTheDocument();
		expect(statusIcon(container)).toHaveClass('order-status-icon-completed');
	});

	it('reads a cancelled subscription as expired', () => {
		render(
			<OrderStatus
				placedOrder={placedOrder(
					OrderWorkflowStatusCode.CANCELLED,
					'DXP',
					'Cancelled'
				)}
			/>
		);

		expect(screen.getByText('Expired')).toBeInTheDocument();
	});

	it('reads an incomplete AI Hub order as requested and marks it processing', () => {
		const {container} = render(
			<OrderStatus
				placedOrder={placedOrder(
					OrderWorkflowStatusCode.IN_PROGRESS,
					'AI_HUB',
					'In Progress'
				)}
			/>
		);

		expect(screen.getByText('Requested')).toBeInTheDocument();
		expect(statusIcon(container)).toHaveClass('order-status-icon-processing');
	});

	it('marks a pending order pending whatever its order type', () => {
		const {container} = render(
			<OrderStatus
				placedOrder={placedOrder(
					OrderWorkflowStatusCode.PENDING,
					'CLIENT_EXTENSION',
					'Pending'
				)}
			/>
		);

		expect(screen.getByText('Pending')).toBeInTheDocument();
		expect(statusIcon(container)).toHaveClass('order-status-icon-pending');
	});

	it('keeps the order status label for a non-subscription order type', () => {
		render(
			<OrderStatus
				placedOrder={placedOrder(
					OrderWorkflowStatusCode.COMPLETED,
					'CLIENT_EXTENSION'
				)}
			/>
		);

		expect(screen.getByText('Completed')).toBeInTheDocument();
	});
});
