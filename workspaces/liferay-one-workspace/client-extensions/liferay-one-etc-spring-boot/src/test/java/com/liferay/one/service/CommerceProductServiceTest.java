/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.headless.commerce.admin.catalog.client.dto.v1_0.Product;
import com.liferay.headless.commerce.admin.catalog.client.resource.v1_0.ProductResource;

import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

/**
 * Proves the product add-or-update upsert path and the deactivate branches in
 * isolation. The real resource HTTP client is replaced by mocking the static
 * {@code ProductResource.builder()} factory, so each test exercises only the
 * service's own branching on the result of the existing-product lookup without
 * any production seam.
 *
 * @author Ryan Schuhler
 */
public class CommerceProductServiceTest {

	// Plan coverage (service): [SVC-COMMERCEPRODUCTSERVICE]

	@Test
	public void testAddOrUpdateProductUpsertsByExternalReferenceCode()
		throws Exception {

		// Add-or-update path: the product is upserted through a single PUT by
		// external reference code rather than being patched.

		ProductResource productResource = Mockito.mock(ProductResource.class);

		ProductResource.Builder builder = Mockito.mock(
			ProductResource.Builder.class, Mockito.RETURNS_SELF);

		Mockito.when(
			builder.build()
		).thenReturn(
			productResource
		);

		try (MockedStatic<ProductResource> mockedStatic = Mockito.mockStatic(
				ProductResource.class)) {

			mockedStatic.when(
				ProductResource::builder
			).thenReturn(
				builder
			);

			CommerceProductService commerceProductService = Mockito.spy(
				new CommerceProductService());

			Mockito.doReturn(
				"Bearer test"
			).when(
				commerceProductService
			).getAuthorization();

			commerceProductService.addOrUpdateProduct(
				"A description", _EXTERNAL_REFERENCE_CODE, "A name");

			Mockito.verify(
				productResource
			).putProductByExternalReferenceCode(
				ArgumentMatchers.eq(_EXTERNAL_REFERENCE_CODE),
				ArgumentMatchers.any(Product.class)
			);

			Mockito.verify(
				productResource, Mockito.never()
			).patchProductByExternalReferenceCode(
				ArgumentMatchers.anyString(),
				ArgumentMatchers.any(Product.class)
			);
		}
	}

	@Test
	public void testDeactivateProductPatchesWhenExistingProduct()
		throws Exception {

		// Deactivate path: when a product exists for the external reference
		// code, it is patched to inactive rather than left untouched.

		ProductResource productResource = Mockito.mock(ProductResource.class);

		ProductResource.Builder builder = Mockito.mock(
			ProductResource.Builder.class, Mockito.RETURNS_SELF);

		Mockito.when(
			builder.build()
		).thenReturn(
			productResource
		);

		Mockito.when(
			productResource.getProductByExternalReferenceCode(
				_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			Mockito.mock(Product.class)
		);

		try (MockedStatic<ProductResource> mockedStatic = Mockito.mockStatic(
				ProductResource.class)) {

			mockedStatic.when(
				ProductResource::builder
			).thenReturn(
				builder
			);

			CommerceProductService commerceProductService = Mockito.spy(
				new CommerceProductService());

			Mockito.doReturn(
				"Bearer test"
			).when(
				commerceProductService
			).getAuthorization();

			commerceProductService.deactivateProduct(_EXTERNAL_REFERENCE_CODE);

			Mockito.verify(
				productResource
			).patchProductByExternalReferenceCode(
				ArgumentMatchers.eq(_EXTERNAL_REFERENCE_CODE),
				ArgumentMatchers.any(Product.class)
			);
		}
	}

	@Test
	public void testDeactivateProductSkipsWhenNoExistingProduct()
		throws Exception {

		// Deactivate guard: when no product exists for the external reference
		// code, the patch call is never issued.

		ProductResource productResource = Mockito.mock(ProductResource.class);

		ProductResource.Builder builder = Mockito.mock(
			ProductResource.Builder.class, Mockito.RETURNS_SELF);

		Mockito.when(
			builder.build()
		).thenReturn(
			productResource
		);

		Mockito.when(
			productResource.getProductByExternalReferenceCode(
				_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			null
		);

		try (MockedStatic<ProductResource> mockedStatic = Mockito.mockStatic(
				ProductResource.class)) {

			mockedStatic.when(
				ProductResource::builder
			).thenReturn(
				builder
			);

			CommerceProductService commerceProductService = Mockito.spy(
				new CommerceProductService());

			Mockito.doReturn(
				"Bearer test"
			).when(
				commerceProductService
			).getAuthorization();

			commerceProductService.deactivateProduct(_EXTERNAL_REFERENCE_CODE);

			Mockito.verify(
				productResource, Mockito.never()
			).patchProductByExternalReferenceCode(
				ArgumentMatchers.anyString(),
				ArgumentMatchers.any(Product.class)
			);
		}
	}

	private static final String _EXTERNAL_REFERENCE_CODE = "PRODUCT_ERC";

}