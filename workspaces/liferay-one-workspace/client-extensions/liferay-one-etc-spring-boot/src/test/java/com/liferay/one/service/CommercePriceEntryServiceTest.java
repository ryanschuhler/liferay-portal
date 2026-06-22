/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.headless.commerce.admin.pricing.client.dto.v2_0.PriceEntry;
import com.liferay.headless.commerce.admin.pricing.client.resource.v2_0.PriceEntryResource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

/**
 * Proves the price entry add-vs-update branch and the delete-by-ERC branch in
 * isolation. The real resource HTTP client is replaced by stubbing the static
 * {@code PriceEntryResource.builder()} factory, so each test exercises only the
 * service's own branching on the result of the existing-entry lookup without
 * any production seam.
 *
 * @author Ryan Schuhler
 */
public class CommercePriceEntryServiceTest {

	// Plan coverage (service): [SVC-COMMERCEPRICEENTRYSERVICE]

	@BeforeEach
	public void setUp() {
		_priceEntryResource = Mockito.mock(PriceEntryResource.class);

		PriceEntryResource.Builder builder = Mockito.mock(
			PriceEntryResource.Builder.class, Mockito.RETURNS_SELF);

		Mockito.when(
			builder.build()
		).thenReturn(
			_priceEntryResource
		);

		_builder = builder;

		_commercePriceEntryService = Mockito.spy(
			new CommercePriceEntryService());

		Mockito.doReturn(
			"Bearer test"
		).when(
			_commercePriceEntryService
		).getAuthorization();
	}

	@Test
	public void testAddOrUpdatePriceEntryAddsWhenNoExistingEntry()
		throws Exception {

		// Add branch: when no entry exists for the external reference code, the
		// price entry is posted to the price list rather than patched.

		try (MockedStatic<PriceEntryResource> mockedStatic = Mockito.mockStatic(
				PriceEntryResource.class)) {

			mockedStatic.when(
				PriceEntryResource::builder
			).thenReturn(
				_builder
			);

			Mockito.when(
				_priceEntryResource.getPriceEntryByExternalReferenceCode(
					_EXTERNAL_REFERENCE_CODE)
			).thenReturn(
				null
			);

			_commercePriceEntryService.addOrUpdatePriceEntry(
				true, _EXTERNAL_REFERENCE_CODE, 19.99,
				_PRICE_LIST_EXTERNAL_REFERENCE_CODE, 100L, 200L);

			Mockito.verify(
				_priceEntryResource
			).postPriceListByExternalReferenceCodePriceEntry(
				ArgumentMatchers.eq(_PRICE_LIST_EXTERNAL_REFERENCE_CODE),
				ArgumentMatchers.any(PriceEntry.class)
			);

			Mockito.verify(
				_priceEntryResource, Mockito.never()
			).patchPriceEntryByExternalReferenceCode(
				ArgumentMatchers.anyString(),
				ArgumentMatchers.any(PriceEntry.class)
			);
		}
	}

	@Test
	public void testAddOrUpdatePriceEntryUpdatesWhenExistingEntry()
		throws Exception {

		// Update branch: when an entry already exists for the external
		// reference code, the price entry is patched rather than posted.

		try (MockedStatic<PriceEntryResource> mockedStatic = Mockito.mockStatic(
				PriceEntryResource.class)) {

			mockedStatic.when(
				PriceEntryResource::builder
			).thenReturn(
				_builder
			);

			Mockito.when(
				_priceEntryResource.getPriceEntryByExternalReferenceCode(
					_EXTERNAL_REFERENCE_CODE)
			).thenReturn(
				Mockito.mock(PriceEntry.class)
			);

			_commercePriceEntryService.addOrUpdatePriceEntry(
				true, _EXTERNAL_REFERENCE_CODE, 19.99,
				_PRICE_LIST_EXTERNAL_REFERENCE_CODE, 100L, 200L);

			Mockito.verify(
				_priceEntryResource
			).patchPriceEntryByExternalReferenceCode(
				ArgumentMatchers.eq(_EXTERNAL_REFERENCE_CODE),
				ArgumentMatchers.any(PriceEntry.class)
			);

			Mockito.verify(
				_priceEntryResource, Mockito.never()
			).postPriceListByExternalReferenceCodePriceEntry(
				ArgumentMatchers.anyString(),
				ArgumentMatchers.any(PriceEntry.class)
			);
		}
	}

	@Test
	public void testDeletePriceEntryDeletesWhenExistingEntry()
		throws Exception {

		// Delete-by-ERC branch: when an entry exists, it is deleted by its
		// external reference code.

		try (MockedStatic<PriceEntryResource> mockedStatic = Mockito.mockStatic(
				PriceEntryResource.class)) {

			mockedStatic.when(
				PriceEntryResource::builder
			).thenReturn(
				_builder
			);

			Mockito.when(
				_priceEntryResource.getPriceEntryByExternalReferenceCode(
					_EXTERNAL_REFERENCE_CODE)
			).thenReturn(
				Mockito.mock(PriceEntry.class)
			);

			_commercePriceEntryService.deletePriceEntry(
				_EXTERNAL_REFERENCE_CODE);

			Mockito.verify(
				_priceEntryResource
			).deletePriceEntryByExternalReferenceCode(
				_EXTERNAL_REFERENCE_CODE
			);
		}
	}

	@Test
	public void testDeletePriceEntrySkipsWhenNoExistingEntry()
		throws Exception {

		// Delete-by-ERC guard: when no entry exists, the delete call is never
		// issued.

		try (MockedStatic<PriceEntryResource> mockedStatic = Mockito.mockStatic(
				PriceEntryResource.class)) {

			mockedStatic.when(
				PriceEntryResource::builder
			).thenReturn(
				_builder
			);

			Mockito.when(
				_priceEntryResource.getPriceEntryByExternalReferenceCode(
					_EXTERNAL_REFERENCE_CODE)
			).thenReturn(
				null
			);

			_commercePriceEntryService.deletePriceEntry(
				_EXTERNAL_REFERENCE_CODE);

			Mockito.verify(
				_priceEntryResource, Mockito.never()
			).deletePriceEntryByExternalReferenceCode(
				ArgumentMatchers.anyString()
			);
		}
	}

	private static final String _EXTERNAL_REFERENCE_CODE = "PRICE_ENTRY_ERC";

	private static final String _PRICE_LIST_EXTERNAL_REFERENCE_CODE =
		"PRICE_LIST_ERC";

	private PriceEntryResource.Builder _builder;
	private CommercePriceEntryService _commercePriceEntryService;
	private PriceEntryResource _priceEntryResource;

}