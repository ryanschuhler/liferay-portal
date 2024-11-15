/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.customer;

import com.liferay.client.extension.util.spring.boot.BaseRestController;
import com.liferay.customer.service.JiraWebService;
import com.liferay.headless.admin.user.client.dto.v1_0.AccountBrief;
import com.liferay.headless.admin.user.client.dto.v1_0.RoleBrief;
import com.liferay.headless.admin.user.client.dto.v1_0.UserAccount;
import com.liferay.headless.admin.user.client.resource.v1_0.UserAccountResource;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.json.JSONObject;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;


/**
 * @author Jenny Chen
 */
@RestController
public class JiraIssuesRestController extends BaseRestController {

	@RequestMapping(path = "/jira/issue/{issueKey}", method = RequestMethod.GET)
	public ResponseEntity<String> get(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable("issueKey") String issueKey)
		throws Exception {

		try {
			return new ResponseEntity<>(
				_jiraWebService.getJiraIssue(issueKey, _getRoles(jwt)),
				HttpStatus.OK);
		}
		catch (Exception exception) {
			_log.error(exception, exception);

			return new ResponseEntity(
				exception.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@RequestMapping(path = {"/jira/search", "/jira/search/{jql}"}, method = RequestMethod.GET)
	public ResponseEntity<String> search(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable(value = "jql", required = false) String jql)
		throws Exception {

		try {
			return new ResponseEntity<>(
				_jiraWebService.getJiraSearch(jql, _getRoles(jwt)),
				HttpStatus.OK);

		}
		catch (Exception exception) {
			_log.error(exception, exception);

			return new ResponseEntity(
				exception.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private List<String> _getRoles(Jwt jwt) throws Exception {
		UserAccountResource userAccountResource =
			_getUserAccountResource(jwt);

		String emailAddress = jwt.getClaimAsString("username");

		UserAccount userAccount =
			userAccountResource.getUserAccountByEmailAddress(emailAddress);

		RoleBrief[] roleBriefs = userAccount.getRoleBriefs();

		List<String> roles = new ArrayList<>();

		for (RoleBrief roleBrief : roleBriefs) {
			roles.add(roleBrief.getName());
		}

		return roles;
	}

	private UserAccountResource _getUserAccountResource(Jwt jwt) throws Exception {
		return UserAccountResource.builder(
		).header(
			HttpHeaders.AUTHORIZATION, "Bearer " + jwt.getTokenValue()
		).endpoint(
			new URL(getWebClientBaseURL())
		).build();
	}

	private static final Log _log = LogFactory.getLog(
		com.liferay.customer.JiraIssuesRestController.class);

	@Autowired
	private JiraWebService _jiraWebService;

}