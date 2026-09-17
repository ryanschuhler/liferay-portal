/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.headless.admin.user.client.dto.v1_0.Role;
import com.liferay.headless.admin.user.client.pagination.Page;
import com.liferay.headless.admin.user.client.pagination.Pagination;
import com.liferay.headless.admin.user.client.resource.v1_0.RoleResource;
import com.liferay.portal.kernel.model.role.RoleConstants;

import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

/**
 * Proves the role lookup walks every page of the headless role resource rather
 * than reading only the first one, that each lookup asks for the role type it
 * advertises, and that the organization role membership calls hand the
 * generated client its three identifiers in the order the client declares them.
 * The real HTTP resource is replaced by stubbing the static {@code
 * RoleResource.builder()} factory, so no production seam is needed.
 *
 * @author Ryan Schuhler
 */
public class RoleServiceTest {

	// Plan coverage (service): [SVC-ROLESERVICE]

	@BeforeEach
	public void setUp() {
		_roleResource = Mockito.mock(RoleResource.class);

		RoleResource.Builder builder = Mockito.mock(
			RoleResource.Builder.class, Mockito.RETURNS_SELF);

		Mockito.when(
			builder.build()
		).thenReturn(
			_roleResource
		);

		_builder = builder;

		_roleService = Mockito.spy(new RoleService());

		Mockito.doReturn(
			"Bearer test"
		).when(
			_roleService
		).getAuthorization();

		Mockito.doReturn(
			"localhost:8080"
		).when(
			_roleService
		).getDXPEndpointAddress();
	}

	@Test
	public void testAddOrganizationUserAccountRolePassesTheIdentifiersInOrder()
		throws Exception {

		// The generated client declares the association arguments as role,
		// user, organization. Passing them in the service's own argument order
		// would silently associate the wrong entities.

		try (MockedStatic<RoleResource> mockedStatic = Mockito.mockStatic(
				RoleResource.class)) {

			mockedStatic.when(
				RoleResource::builder
			).thenReturn(
				_builder
			);

			_roleService.addOrganizationUserAccountRole(
				_ORGANIZATION_ID, _ROLE_ID, _USER_ID);

			Mockito.verify(
				_roleResource
			).postOrganizationRoleUserAccountAssociation(
				_ROLE_ID, _USER_ID, _ORGANIZATION_ID
			);
		}
	}

	@Test
	public void testGetAccountRolesReadsEveryPage() throws Exception {

		// Page walking: a result set larger than one page is concatenated
		// across pages, and the second page is requested with page number two.

		Role firstRole = new Role();
		Role secondRole = new Role();
		Role thirdRole = new Role();

		try (MockedStatic<RoleResource> mockedStatic = Mockito.mockStatic(
				RoleResource.class)) {

			mockedStatic.when(
				RoleResource::builder
			).thenReturn(
				_builder
			);

			Mockito.when(
				_roleResource.getRolesPage(
					ArgumentMatchers.any(), ArgumentMatchers.any(),
					ArgumentMatchers.any(), ArgumentMatchers.any())
			).thenReturn(
				_createRolePage(1, 900, firstRole, secondRole),
				_createRolePage(2, 900, thirdRole)
			);

			List<Role> roles = _roleService.getAccountRoles();

			Assertions.assertEquals(3, roles.size());
			Assertions.assertSame(firstRole, roles.get(0));
			Assertions.assertSame(secondRole, roles.get(1));
			Assertions.assertSame(thirdRole, roles.get(2));

			ArgumentCaptor<Pagination> paginationArgumentCaptor =
				ArgumentCaptor.forClass(Pagination.class);

			Mockito.verify(
				_roleResource, Mockito.times(2)
			).getRolesPage(
				ArgumentMatchers.any(), ArgumentMatchers.any(),
				ArgumentMatchers.any(), paginationArgumentCaptor.capture()
			);

			List<Pagination> paginations =
				paginationArgumentCaptor.getAllValues();

			Pagination firstPagination = paginations.get(0);

			Assertions.assertEquals(1, firstPagination.getPage());
			Assertions.assertEquals(_PAGE_SIZE, firstPagination.getPageSize());

			Pagination secondPagination = paginations.get(1);

			Assertions.assertEquals(2, secondPagination.getPage());
		}
	}

	@Test
	public void testGetAccountRolesRequestsTheAccountRoleType()
		throws Exception {

		// Type guard: the account lookup must not widen into every role type.

		Assertions.assertArrayEquals(
			new Integer[] {RoleConstants.TYPE_ACCOUNT},
			_captureRoleTypes(() -> _roleService.getAccountRoles()));
	}

	@Test
	public void testGetAccountRolesStopsAfterTheLastPage() throws Exception {

		// Termination: a result set that fits in one page must not trigger a
		// second request.

		try (MockedStatic<RoleResource> mockedStatic = Mockito.mockStatic(
				RoleResource.class)) {

			mockedStatic.when(
				RoleResource::builder
			).thenReturn(
				_builder
			);

			Mockito.when(
				_roleResource.getRolesPage(
					ArgumentMatchers.any(), ArgumentMatchers.any(),
					ArgumentMatchers.any(), ArgumentMatchers.any())
			).thenReturn(
				_createRolePage(1, 1, new Role())
			);

			Assertions.assertEquals(1, _roleService.getAccountRoles().size());

			Mockito.verify(
				_roleResource, Mockito.times(1)
			).getRolesPage(
				ArgumentMatchers.any(), ArgumentMatchers.any(),
				ArgumentMatchers.any(), ArgumentMatchers.any()
			);
		}
	}

	@Test
	public void testGetOrganizationRolesRequestsTheOrganizationRoleType()
		throws Exception {

		// Type guard: the organization lookup asks for a different role type
		// than the account lookup.

		Assertions.assertArrayEquals(
			new Integer[] {RoleConstants.TYPE_ORGANIZATION},
			_captureRoleTypes(() -> _roleService.getOrganizationRoles()));
	}

	@Test
	public void testRemoveOrganizationUserAccountRolePassesTheIdentifiersInOrder()
		throws Exception {

		// The delete association shares the generated client's role, user,
		// organization argument order with the post association.

		try (MockedStatic<RoleResource> mockedStatic = Mockito.mockStatic(
				RoleResource.class)) {

			mockedStatic.when(
				RoleResource::builder
			).thenReturn(
				_builder
			);

			_roleService.removeOrganizationUserAccountRole(
				_ORGANIZATION_ID, _ROLE_ID, _USER_ID);

			Mockito.verify(
				_roleResource
			).deleteOrganizationRoleUserAccountAssociation(
				_ROLE_ID, _USER_ID, _ORGANIZATION_ID
			);
		}
	}

	private Integer[] _captureRoleTypes(RoleLookup roleLookup)
		throws Exception {

		try (MockedStatic<RoleResource> mockedStatic = Mockito.mockStatic(
				RoleResource.class)) {

			mockedStatic.when(
				RoleResource::builder
			).thenReturn(
				_builder
			);

			Mockito.when(
				_roleResource.getRolesPage(
					ArgumentMatchers.any(), ArgumentMatchers.any(),
					ArgumentMatchers.any(), ArgumentMatchers.any())
			).thenReturn(
				_createRolePage(1, 0)
			);

			roleLookup.lookup();

			ArgumentCaptor<Integer[]> typesArgumentCaptor =
				ArgumentCaptor.forClass(Integer[].class);

			Mockito.verify(
				_roleResource
			).getRolesPage(
				ArgumentMatchers.any(), typesArgumentCaptor.capture(),
				ArgumentMatchers.any(), ArgumentMatchers.any()
			);

			return typesArgumentCaptor.getValue();
		}
	}

	private Page<Role> _createRolePage(
		long page, long totalCount, Role... roles) {

		Page<Role> rolePage = new Page<>();

		rolePage.setItems(List.of(roles));
		rolePage.setPage(page);
		rolePage.setPageSize(_PAGE_SIZE);
		rolePage.setTotalCount(totalCount);

		return rolePage;
	}

	private static final long _ORGANIZATION_ID = 30001;

	private static final int _PAGE_SIZE = 500;

	private static final long _ROLE_ID = 20001;

	private static final long _USER_ID = 10001;

	private RoleResource.Builder _builder;
	private RoleResource _roleResource;
	private RoleService _roleService;

	private interface RoleLookup {

		public List<Role> lookup() throws Exception;

	}

}
