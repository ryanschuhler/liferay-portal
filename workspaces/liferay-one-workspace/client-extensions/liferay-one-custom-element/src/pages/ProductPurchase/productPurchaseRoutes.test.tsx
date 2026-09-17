/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {
	getProductPurchaseSteps,
	getStepKey,
	toStepItems,
	toStepRoutes,
} from './productPurchaseRoutes';

import type {DeliveryProduct} from '~/types/product';

function productWithSolutionType(solutionType: string) {
	return {
		productSpecifications: [
			{specificationKey: 'solution-type', value: solutionType},
		],
	} as unknown as DeliveryProduct;
}

function stepPaths(
	steps: ReturnType<typeof getProductPurchaseSteps>
): (string | undefined)[] {
	return steps.map((step) => (step.index ? '(index)' : step.path));
}

describe('getProductPurchaseSteps', () => {
	it('starts on an index step so the wizard has an entry point', () => {
		for (const options of [
			{isPaidApp: false},
			{isPaidApp: true},
			{isDXPFreeOnly: true, isPaidApp: false},
			{isLDP: true, isPaidApp: true},
			{isPaidApp: false, product: productWithSolutionType('dsr')},
		]) {
			const [firstStep, ...otherSteps] = getProductPurchaseSteps(options);

			expect(firstStep.index).toBe(true);
			expect(otherSteps.every((step) => !step.index)).toBe(true);
		}
	});

	it('gives every step a renderable element and a non-empty title', () => {
		const steps = getProductPurchaseSteps({
			isDXPFreeOnly: false,
			isLDP: true,
			isPaidApp: true,
		});

		for (const step of steps) {
			expect(step.element).toBeDefined();
			expect(step.title.trim()).not.toBe('');
		}
	});

	it('hides the license and payment steps from a free app', () => {
		expect(stepPaths(getProductPurchaseSteps({isPaidApp: false}))).toEqual([
			'(index)',
			'summary',
		]);
	});

	it('charges a paid app for a license before taking payment', () => {
		expect(stepPaths(getProductPurchaseSteps({isPaidApp: true}))).toEqual([
			'(index)',
			'license',
			'payment-method',
			'summary',
		]);
	});

	it('adds provisioning only for a Liferay Data Platform purchase', () => {
		expect(
			stepPaths(getProductPurchaseSteps({isLDP: true, isPaidApp: false}))
		).toContain('provisioning');
		expect(
			stepPaths(getProductPurchaseSteps({isLDP: false, isPaidApp: false}))
		).not.toContain('provisioning');
	});

	it('swaps the summary for an activation key on DXP Free', () => {
		const paths = stepPaths(
			getProductPurchaseSteps({isDXPFreeOnly: true, isPaidApp: false})
		);

		expect(paths).toContain('activation-key-form');
		expect(paths).not.toContain('summary');
	});

	it('replaces the generic flow with the solution flow for AI Hub', () => {
		expect(
			stepPaths(
				getProductPurchaseSteps({
					isPaidApp: true,
					product: productWithSolutionType('ai-hub'),
				})
			)
		).toEqual(['(index)', 'ai-hub-form']);
	});

	it('replaces the generic flow with the solution flow for Digital Sales Room', () => {
		expect(
			stepPaths(
				getProductPurchaseSteps({
					isPaidApp: true,
					product: productWithSolutionType('dsr'),
				})
			)
		).toEqual(['(index)', 'dsr-form']);
	});

	it('replaces the generic flow with the solution flow for SEO Studio', () => {
		expect(
			stepPaths(
				getProductPurchaseSteps({
					isPaidApp: false,
					product: productWithSolutionType('seo-studio'),
				})
			)
		).toEqual(['(index)', 'project', 'seo-studio-form']);
	});

	it('routes an AI Hub open beta purchase through project and contract selection', () => {
		expect(
			stepPaths(
				getProductPurchaseSteps({
					isPaidApp: false,
					product: productWithSolutionType('ai-hub-open-beta'),
				})
			)
		).toEqual([
			'(index)',
			'project',
			'contract',
			'ai-hub-open-beta-form',
			'summary',
		]);
	});

	it('routes an AI Hub token top-up straight to payment', () => {
		expect(
			stepPaths(
				getProductPurchaseSteps({
					isPaidApp: false,
					product: productWithSolutionType('ai-hub-open-beta'),
					searchParams: new URLSearchParams({aiHubTokens: '1000'}),
				})
			)
		).toEqual(['(index)', 'payment-method', 'summary']);
	});

	it('falls back to the generic flow for an unknown solution type', () => {
		expect(
			stepPaths(
				getProductPurchaseSteps({
					isPaidApp: false,
					product: productWithSolutionType('something-else'),
				})
			)
		).toEqual(['(index)', 'summary']);
	});
});

describe('getStepKey', () => {
	it('keys the index step at the wizard root', () => {
		expect(getStepKey({index: true})).toBe('/');
	});

	it('keys a named step at its own path', () => {
		expect(getStepKey({path: 'summary'})).toBe('/summary');
	});
});

describe('toStepRoutes', () => {
	it('turns the index step into an index route and the rest into paths', () => {
		const routes = toStepRoutes(getProductPurchaseSteps({isPaidApp: true}));

		expect(routes[0]).toEqual({
			element: routes[0].element,
			index: true,
		});
		expect(routes.slice(1).map((route) => route.path)).toEqual([
			'license',
			'payment-method',
			'summary',
		]);
	});
});

describe('toStepItems', () => {
	it('pairs every step key with the title shown in the step navigation', () => {
		const steps = getProductPurchaseSteps({isPaidApp: false});

		expect(toStepItems(steps)).toEqual([
			{key: '/', title: steps[0].title},
			{key: '/summary', title: steps[1].title},
		]);
	});
});
