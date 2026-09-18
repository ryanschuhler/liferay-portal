/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import SearchBuilder from '~/services/fetcher/SearchBuilder';
import HeadlessCommerceAdminPricing from '~/services/headless/HeadlessCommerceAdminPricing';
import {ProductType} from '~/types/productEnums';
import {
	ProductLicense,
	ProductSpecificationKey,
	SkuOptions,
} from '~/utils/productUtils';

import type {LicensingPrices} from '~/context/NewAppContextProvider';
import type {Product} from '~/types/product';

const PRODUCT_OPTION_KEYS = {
	[ProductType.CLOUD]: ProductLicense.CLOUD,
	[ProductType.DXP]: ProductLicense.DXP,
};

export class MarketplaceProduct {
	constructor(private product: Product) {}

	public getProductOptionKey() {
		const appType = this.getSpecificationValue(
			ProductSpecificationKey.APP_TYPE
		);

		return (
			PRODUCT_OPTION_KEYS[appType as keyof typeof PRODUCT_OPTION_KEYS] ||
			ProductLicense.BASE
		);
	}

	public async getProductPrices() {
		const {product} = this;

		const {items: priceLists} =
			await HeadlessCommerceAdminPricing.getPriceLists(
				new URLSearchParams({
					filter: SearchBuilder.eq('type', 'price-list'),
					nestedFields: 'priceEntries',
					search: SearchBuilder.eq(
						'catalogName',
						product.catalog.name
					),
				})
			);

		const prices: LicensingPrices = {};

		const productOptionKey = this.getProductOptionKey();

		const productSkus = product.skus
			.filter((sku) =>
				sku.skuOptions.some(
					(skuOption) =>
						skuOption.key === productOptionKey &&
						skuOption.value !== SkuOptions.TRIAL
				)
			)
			.map((sku) => sku.id);

		if (!productSkus.length) {
			return prices;
		}

		for (const priceList of priceLists) {
			const {items: priceEntries} =
				await HeadlessCommerceAdminPricing.getPriceListEntries(
					priceList.id,
					new URLSearchParams({
						filter: SearchBuilder.in('skuId', productSkus),
						nestedFields: 'priceEntry',
					})
				);

			const tierPricesItems = await Promise.all(
				priceEntries.map((priceEntry) =>
					HeadlessCommerceAdminPricing.getTierPricesByPriceEntryId(
						priceEntry.priceEntryId
					).then(({items}) => items)
				)
			);

			for (const [index, priceEntry] of priceEntries.entries()) {
				const tierPrices = tierPricesItems[index];

				const sku = product.skus.find(
					(productSku) => productSku.id === priceEntry.skuId
				);

				if (!sku) {
					continue;
				}

				const skuName = sku.sku.toLowerCase();

				if (!prices[priceList.currencyCode]) {
					prices[priceList.currencyCode] = {};
				}

				if (!prices[priceList.currencyCode][skuName]) {
					prices[priceList.currencyCode][skuName] = {};
				}

				for (const tierPrice of tierPrices) {
					if (
						!prices[priceList.currencyCode][skuName][
							tierPrice.minimumQuantity
						]
					) {
						prices[priceList.currencyCode][skuName][
							tierPrice.minimumQuantity
						] = tierPrice.price;
					}
				}
			}
		}

		return prices;
	}

	private getSpecificationValue(specificationKey: string) {
		const specification = this.product.productSpecifications.find(
			(productSpecification) =>
				productSpecification.specificationKey === specificationKey
		);

		return specification?.value?.en_US ?? '';
	}
}
