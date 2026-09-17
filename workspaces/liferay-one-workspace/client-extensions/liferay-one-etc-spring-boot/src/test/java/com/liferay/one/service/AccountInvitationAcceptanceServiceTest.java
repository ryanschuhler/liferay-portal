/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.headless.admin.user.client.dto.v1_0.Account;
import com.liferay.headless.admin.user.client.dto.v1_0.UserAccount;
import com.liferay.one.model.AccountInvitation;
import com.liferay.one.okta.service.OktaService;

import org.json.JSONObject;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * Proves what accepting an invitation actually provisions: a user account is
 * created only when the invited address has none, a failing Okta contact is
 * logged and stepped over rather than aborting the enrollment, every invited
 * role is assigned against the user account that was resolved, and the project
 * membership is only linked when the invitation names a project.
 *
 * @author Ryan Schuhler
 */
public class AccountInvitationAcceptanceServiceTest {

	// Plan coverage (service): [SVC-ACCOUNTINVITATIONACCEPTANCESERVICE]

	@BeforeEach
	public void setUp() throws Exception {
		_accountInvitationAcceptanceService =
			new AccountInvitationAcceptanceService();

		ReflectionTestUtils.setField(
			_accountInvitationAcceptanceService, "_accountService",
			_accountService);
		ReflectionTestUtils.setField(
			_accountInvitationAcceptanceService, "_oktaService", _oktaService);
		ReflectionTestUtils.setField(
			_accountInvitationAcceptanceService, "_projectMembershipService",
			_projectMembershipService);
		ReflectionTestUtils.setField(
			_accountInvitationAcceptanceService, "_userAccountService",
			_userAccountService);

		Account account = new Account();

		account.setExternalReferenceCode(_ACCOUNT_EXTERNAL_REFERENCE_CODE);
		account.setId(_ACCOUNT_ID);

		Mockito.when(
			_accountService.getAccount(_ACCOUNT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			account
		);
	}

	@Test
	public void testProvisionAccountInvitationAddsUserAccountWhenMissing()
		throws Exception {

		// Create-user-on-missing branch: an invited address with no user yet is
		// registered with the invited name before enrollment.

		Mockito.when(
			_userAccountService.fetchUserAccountByEmailAddress(_EMAIL_ADDRESS)
		).thenReturn(
			null
		);

		Mockito.when(
			_userAccountService.addUserAccount(
				_EMAIL_ADDRESS, _FAMILY_NAME, _GIVEN_NAME)
		).thenReturn(
			_createUserAccount(_EMAIL_ADDRESS)
		);

		_accountInvitationAcceptanceService.provisionAccountInvitation(
			_createAccountInvitation(null, "[\"ROLE-1\"]"));

		Mockito.verify(
			_userAccountService
		).addUserAccount(
			_EMAIL_ADDRESS, _FAMILY_NAME, _GIVEN_NAME
		);

		Mockito.verify(
			_accountService
		).addAccountUserAccountByEmailAddress(
			_ACCOUNT_ID, _EMAIL_ADDRESS, null
		);
	}

	@Test
	public void testProvisionAccountInvitationAssignsEveryInvitedRole()
		throws Exception {

		// Role assignment loop: each invited role external reference code is
		// assigned, not just the first one.

		_setUpExistingUserAccount(_EMAIL_ADDRESS);

		_accountInvitationAcceptanceService.provisionAccountInvitation(
			_createAccountInvitation(null, "[\"ROLE-1\", \"ROLE-2\"]"));

		Mockito.verify(
			_accountService
		).addAccountUserAccountRoleByExternalReferenceCode(
			_ACCOUNT_EXTERNAL_REFERENCE_CODE, "ROLE-1", _EMAIL_ADDRESS
		);

		Mockito.verify(
			_accountService
		).addAccountUserAccountRoleByExternalReferenceCode(
			_ACCOUNT_EXTERNAL_REFERENCE_CODE, "ROLE-2", _EMAIL_ADDRESS
		);
	}

	@Test
	public void testProvisionAccountInvitationAssignsRolesToTheResolvedUser()
		throws Exception {

		// The roles are assigned against the resolved user account's address
		// rather than the address typed on the invitation, so a normalized
		// address still lands on the right user.

		_setUpExistingUserAccount(_NORMALIZED_EMAIL_ADDRESS);

		_accountInvitationAcceptanceService.provisionAccountInvitation(
			_createAccountInvitation(null, "[\"ROLE-1\"]"));

		Mockito.verify(
			_accountService
		).addAccountUserAccountRoleByExternalReferenceCode(
			_ACCOUNT_EXTERNAL_REFERENCE_CODE, "ROLE-1",
			_NORMALIZED_EMAIL_ADDRESS
		);
	}

	@Test
	public void testProvisionAccountInvitationContinuesWhenOktaContactFails()
		throws Exception {

		// Best-effort Okta contact: the contact is a side channel, so a failure
		// there must not cost the invited user their account enrollment.

		_setUpExistingUserAccount(_EMAIL_ADDRESS);

		Mockito.when(
			_oktaService.createContact(
				ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
				ArgumentMatchers.isNull(), ArgumentMatchers.anyString())
		).thenThrow(
			new IllegalStateException("Okta is unavailable")
		);

		_accountInvitationAcceptanceService.provisionAccountInvitation(
			_createAccountInvitation(null, "[\"ROLE-1\"]"));

		Mockito.verify(
			_accountService
		).addAccountUserAccountByEmailAddress(
			_ACCOUNT_ID, _EMAIL_ADDRESS, null
		);

		Mockito.verify(
			_accountService
		).addAccountUserAccountRoleByExternalReferenceCode(
			_ACCOUNT_EXTERNAL_REFERENCE_CODE, "ROLE-1", _EMAIL_ADDRESS
		);
	}

	@Test
	public void testProvisionAccountInvitationLinksTheProjectMembership()
		throws Exception {

		// Optional project link: an invitation that names a project enrolls the
		// resolved user into it with the invited project role.

		_setUpExistingUserAccount(_EMAIL_ADDRESS);

		_accountInvitationAcceptanceService.provisionAccountInvitation(
			_createAccountInvitation(
				_PROJECT_EXTERNAL_REFERENCE_CODE, "[\"ROLE-1\"]"));

		Mockito.verify(
			_projectMembershipService
		).addProjectMembership(
			_PROJECT_EXTERNAL_REFERENCE_CODE,
			_PROJECT_ROLE_EXTERNAL_REFERENCE_CODE, _USER_ID
		);
	}

	@Test
	public void testProvisionAccountInvitationReusesTheExistingUserAccount()
		throws Exception {

		// Idempotency: an address that already has a user must not be
		// registered a second time.

		_setUpExistingUserAccount(_EMAIL_ADDRESS);

		_accountInvitationAcceptanceService.provisionAccountInvitation(
			_createAccountInvitation(null, "[\"ROLE-1\"]"));

		Mockito.verify(
			_userAccountService, Mockito.never()
		).addUserAccount(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.anyString()
		);
	}

	@Test
	public void testProvisionAccountInvitationSkipsTheProjectMembership()
		throws Exception {

		// Optional project link: an invitation with no project leaves project
		// membership alone.

		_setUpExistingUserAccount(_EMAIL_ADDRESS);

		_accountInvitationAcceptanceService.provisionAccountInvitation(
			_createAccountInvitation(null, "[\"ROLE-1\"]"));

		Mockito.verifyNoInteractions(_projectMembershipService);
	}

	private AccountInvitation _createAccountInvitation(
		String projectExternalReferenceCode,
		String roleExternalReferenceCodes) {

		JSONObject jsonObject = new JSONObject();

		jsonObject.put(
			"accountExternalReferenceCode", _ACCOUNT_EXTERNAL_REFERENCE_CODE);
		jsonObject.put("emailAddress", _EMAIL_ADDRESS);
		jsonObject.put("familyName", _FAMILY_NAME);
		jsonObject.put("givenName", _GIVEN_NAME);
		jsonObject.put("id", _ACCOUNT_INVITATION_ID);
		jsonObject.put(
			"roleExternalReferenceCodes", roleExternalReferenceCodes);

		if (projectExternalReferenceCode != null) {
			jsonObject.put(
				"projectExternalReferenceCode", projectExternalReferenceCode);
			jsonObject.put(
				"projectRoleExternalReferenceCode",
				_PROJECT_ROLE_EXTERNAL_REFERENCE_CODE);
		}

		return new AccountInvitation(jsonObject);
	}

	private UserAccount _createUserAccount(String emailAddress) {
		UserAccount userAccount = new UserAccount();

		userAccount.setEmailAddress(emailAddress);
		userAccount.setId(_USER_ID);

		return userAccount;
	}

	private void _setUpExistingUserAccount(String emailAddress)
		throws Exception {

		Mockito.when(
			_userAccountService.fetchUserAccountByEmailAddress(_EMAIL_ADDRESS)
		).thenReturn(
			_createUserAccount(emailAddress)
		);
	}

	private static final String _ACCOUNT_EXTERNAL_REFERENCE_CODE = "ACCT-1";

	private static final long _ACCOUNT_ID = 40001;

	private static final long _ACCOUNT_INVITATION_ID = 50001;

	private static final String _EMAIL_ADDRESS = "invited@example.com";

	private static final String _FAMILY_NAME = "Schuhler";

	private static final String _GIVEN_NAME = "Ryan";

	private static final String _NORMALIZED_EMAIL_ADDRESS =
		"Invited@Example.com";

	private static final String _PROJECT_EXTERNAL_REFERENCE_CODE = "PRJCT-1";

	private static final String _PROJECT_ROLE_EXTERNAL_REFERENCE_CODE =
		"PROJECT-ROLE-1";

	private static final long _USER_ID = 10001;

	private AccountInvitationAcceptanceService
		_accountInvitationAcceptanceService;
	private final AccountService _accountService = Mockito.mock(
		AccountService.class);
	private final OktaService _oktaService = Mockito.mock(OktaService.class);
	private final ProjectMembershipService _projectMembershipService =
		Mockito.mock(ProjectMembershipService.class);
	private final UserAccountService _userAccountService = Mockito.mock(
		UserAccountService.class);

}
