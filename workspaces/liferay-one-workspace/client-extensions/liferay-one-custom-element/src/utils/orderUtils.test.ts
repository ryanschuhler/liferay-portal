/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {
	OrderWorkflowStatusCode,
	getOrderStatusLabel,
	getOrderStatusToken,
	getTotalByOrderKey,
	hasAIHubOrder,
	isBetaOrder,
	toStatusToken,
} from './orderUtils';

import type {Order, PlacedOrder} from '~/types/orders';

function order(overrides: Partial<Order> = {}) {
	return {currencyCode: 'USD', totalAmount: 100, ...overrides} as Order;
}

function placedOrder(overrides: Record<string, unknown> = {}) {
	return {
		orderStatusInfo: {code: OrderWorkflowStatusCode.COMPLETED},
		orderTypeExternalReferenceCode: 'CLIENT_EXTENSION',
		...overrides,
	} as unknown as PlacedOrder;
}

describe('getTotalByOrderKey', () => {
	it('sums the field across orders and formats the result as currency', () => {
		expect(
			getTotalByOrderKey('totalAmount', [order({totalAmount: 100}), order({totalAmount: 25.5})])
		).toBe('$125.50');
	});

	it('ignores orders priced in another currency', () => {
		expect(
			getTotalByOrderKey('totalAmount', [
				order({totalAmount: 100}),
				order({currencyCode: 'EUR', totalAmount: 999}),
			])
		).toBe('$100.00');
	});

	it('applies the multiplier used for commission splits', () => {
		expect(getTotalByOrderKey('totalAmount', [order({totalAmount: 100})], 0.3)).toBe(
			'$30.00'
		);
	});

	it('returns a plain zero rather than a formatted total when there is nothing to sum', () => {
		expect(getTotalByOrderKey('totalAmount', [])).toBe(0);
	});
});

describe('getOrderStatusLabel', () => {
	it('reads a completed subscription as active', () => {
		expect(
			getOrderStatusLabel(
				placedOrder({
					orderStatusInfo: {
						code: OrderWorkflowStatusCode.COMPLETED,
						label: 'Completed',
					},
					orderTypeExternalReferenceCode: 'DXP',
				})
			)
		).toBe('Active');
	});

	it('reads a cancelled subscription as expired', () => {
		expect(
			getOrderStatusLabel(
				placedOrder({
					orderStatusInfo: {
						code: OrderWorkflowStatusCode.CANCELLED,
						label: 'Cancelled',
					},
					orderTypeExternalReferenceCode: 'CMP',
				})
			)
		).toBe('Expired');
	});

	it('reads an unfinished AI Hub order as requested', () => {
		expect(
			getOrderStatusLabel(
				placedOrder({
					orderStatusInfo: {
						code: OrderWorkflowStatusCode.PENDING,
						label: 'Pending',
					},
					orderTypeExternalReferenceCode: 'AI_HUB',
				})
			)
		).toBe('Requested');
	});

	it('leaves a finished AI Hub order on its own label', () => {
		expect(
			getOrderStatusLabel(
				placedOrder({
					orderStatusInfo: {
						code: OrderWorkflowStatusCode.COMPLETED,
						label: 'Completed',
					},
					orderTypeExternalReferenceCode: 'AI_HUB',
				})
			)
		).toBe('Completed');
	});

	it('prefers the order status label over the workflow label', () => {
		expect(
			getOrderStatusLabel(
				placedOrder({
					orderStatusInfo: {
						code: OrderWorkflowStatusCode.COMPLETED,
						label: 'Completed',
					},
					workflowStatusInfo: {label: 'Approved'},
				})
			)
		).toBe('Completed');
	});

	it('falls back to the localized workflow label when the order has none', () => {
		expect(
			getOrderStatusLabel(
				placedOrder({
					orderStatusInfo: {code: OrderWorkflowStatusCode.COMPLETED},
					workflowStatusInfo: {
						label: 'Approved',
						label_i18n: 'Aprovado',
					},
				})
			)
		).toBe('Aprovado');
	});
});

describe('toStatusToken', () => {
	it('turns a display label into a translation key', () => {
		expect(toStatusToken('Pending Payment')).toBe('pending-payment');
	});

	it('normalizes the British spelling onto the American translation key', () => {
		expect(toStatusToken('Cancelled')).toBe('canceled');
	});
});

describe('getOrderStatusToken', () => {
	it('tokenizes the label the order resolves to, not its raw status', () => {
		expect(
			getOrderStatusToken(
				placedOrder({
					orderStatusInfo: {
						code: OrderWorkflowStatusCode.CANCELLED,
						label: 'Cancelled',
					},
					orderTypeExternalReferenceCode: 'DXP',
				})
			)
		).toBe('expired');
	});
});

describe('hasAIHubOrder', () => {
	it('detects an AI Hub order among the placed orders', () => {
		expect(
			hasAIHubOrder([
				placedOrder(),
				placedOrder({orderTypeExternalReferenceCode: 'AI_HUB'}),
			])
		).toBe(true);
	});

	it('returns false rather than undefined when there are no orders', () => {
		expect(hasAIHubOrder()).toBe(false);
		expect(hasAIHubOrder([placedOrder()])).toBe(false);
	});
});

describe('isBetaOrder', () => {
	it('detects a beta SKU option on any order item', () => {
		expect(
			isBetaOrder(
				placedOrder({
					placedOrderItems: [
						{options: JSON.stringify([{skuOptionValueKey: 'tier'}])},
						{
							options: JSON.stringify([
								{skuOptionValueKey: 'open-beta'},
							]),
						},
					],
				})
			)
		).toBe(true);
	});

	it('treats an order without beta options as a regular order', () => {
		expect(
			isBetaOrder(
				placedOrder({
					placedOrderItems: [
						{
							options: JSON.stringify([
								{skuOptionValueKey: 'production'},
							]),
						},
					],
				})
			)
		).toBe(false);
	});

	it('survives an order item whose options are missing or malformed', () => {
		expect(isBetaOrder()).toBe(false);
		expect(
			isBetaOrder(
				placedOrder({placedOrderItems: [{options: 'not-json'}, {}]})
			)
		).toBe(false);
	});
});
