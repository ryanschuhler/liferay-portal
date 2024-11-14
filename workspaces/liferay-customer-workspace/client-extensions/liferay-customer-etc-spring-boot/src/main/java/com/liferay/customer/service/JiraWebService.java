/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.customer.service;

import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.util.Base64;

import java.nio.charset.StandardCharsets;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.json.JSONArray;
import org.json.JSONObject;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriUtils;

/**
 * @author Jenny Chen
 */
@Component
public class JiraWebService {

	public String getJiraIssue(String issueKey)
		throws Exception {

		StringBundler sb = new StringBundler(3);

		sb.append(_URL_REST_API_2);
		sb.append("/issue/");
		sb.append(issueKey);

		try {
			JSONObject jsonObject = new JSONObject(
				WebClient.create(
					_jiraURL
				).get(
				).uri(
					sb.toString()
				).accept(
					MediaType.APPLICATION_JSON
				).header(
					HttpHeaders.AUTHORIZATION, _getCredentials()
				).retrieve(
				).bodyToMono(
					String.class
				).block());

			return jsonObject.toString();
		}
		catch (Exception exception) {
			if (_log.isWarnEnabled()) {
				_log.warn(
					"Unable to fetch Jira issue with key " +
						issueKey,
					exception);
			}
		}

		return null;
	}

	public String getJiraSearch(String jql, String role)
		throws Exception {

		StringBundler sb = new StringBundler(3);

		if (jql == null) {
			sb.append("project in (LSV)");
		}
		else {
			sb.append(jql);
			sb.append("and project in (LSV)");
		}

		System.out.println("jiraSearch");
		System.out.println(jql);
		System.out.println(sb.toString());

		try {
			JSONObject jsonObject = new JSONObject(
				WebClient.create(
					_jiraURL
				).get(
				).uri(
					uriBuilder -> uriBuilder
						.path(_URL_REST_API_2 + "/search")
						.queryParam("jql", sb.toString())
					.build()
				).accept(
					MediaType.APPLICATION_JSON
				).header(
					HttpHeaders.AUTHORIZATION, _getCredentials()
				).retrieve(
				).bodyToMono(
					String.class
				).block());

			return jsonObject.toString();
		}
		catch (Exception exception) {
			if (_log.isWarnEnabled()) {
				_log.warn(
					"Unable to fetch Jira with jql " +
						jql,
					exception);
			}
		}

		return null;
	}

	private String _getCredentials() {
		String jiraUserNameAndJiraApiToken =
			_jiraAPIEmailAddress + StringPool.COLON + _jiraAPIToken;

		return "Basic " + Base64.encode(jiraUserNameAndJiraApiToken.getBytes());
	}

	private static final Log _log = LogFactory.getLog(
		JiraWebService.class);

	private static final String _URL_REST_API_2 = "/rest/api/2";

	@Value("${liferay.customer.jira.max.results}")
	private int _jiraMaxResults;

	@Value("${liferay.customer.jira.security.fields}")
	private String _jiraSecurityFields;

	@Value("${liferay.customer.jira.security.projects}")
	private String _jiraSecurityProjects;

	@Value("${liferay.customer.jira.api.email.address}")
	private String _jiraAPIEmailAddress;

	@Value("${liferay.customer.jira.api.token}")
	private String _jiraAPIToken;

	@Value("${liferay.customer.jira.url}")
	private String _jiraURL;

}