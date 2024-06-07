/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.partner;

import java.util.ArrayList;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.liferay.partner.model.Lead;
import com.liferay.partner.model.OpportunityPartnerRole;
import com.liferay.partner.service.CloudFunctionsWebService;
import com.liferay.partner.service.UserAccountWebService;
import com.liferay.petra.string.StringBundler;

import org.json.JSONObject;

/**
 * @author Felipe Franca
 */
@RequestMapping("/object/entry/manager/salesforce")
@RestController
public class ObjectEntryManagerSalesforceRestController extends BaseRestController {

	@GetMapping("/{objectDefinitionExternalReferenceCode}")
	public ResponseEntity<String> get(@AuthenticationPrincipal Jwt jwt,
			@PathVariable String objectDefinitionExternalReferenceCode,
			@RequestParam Map<String, String> parameters) throws Exception {

		String endpoint = _getEndpoint(objectDefinitionExternalReferenceCode);

		String stringParameters = _getStringParameters(parameters);

		// WIP
		// JSONObject jsonObject = _userAccountWebService.getUserAccount(jwt);
		// Probably will create a new method to add the filter to the existing ones
		// to avoid conflicts.

		JSONObject itemsJsonObject = _cloudFunctionsWebService.getItems(endpoint + stringParameters);

		return new ResponseEntity<>(
				new JSONObject().put(
						"items", _convertItems(itemsJsonObject, objectDefinitionExternalReferenceCode)).put(
								"totalCount", itemsJsonObject.getInt("totalCount"))
						.toString(),
				HttpStatus.OK);
	}

	// Blocked by LRSD-4933
	// @GetMapping("/{objectDefinitionExternalReferenceCode}/{externalReferenceCode}")
	// public ResponseEntity<String> get(@AuthenticationPrincipal Jwt jwt,
	// @PathVariable String objectDefinitionExternalReferenceCode, @PathVariable
	// String externalReferenceCode,
	// @RequestParam Map<String, String> parameters) throws Exception {

	// // JSONObject jsonObject = _userAccountWebService.getUserAccount(jwt);

	// StringBundler sb = new StringBundler("/leads?");

	// if (filter.isPresent()) {
	// sb.append("filter=");
	// sb.append(filter.get());
	// sb.append("&");
	// System.out.println(sb.toString());
	// }

	// sb.append("page=");

	// if (page.isPresent()) {
	// sb.append(page.get());
	// } else {
	// sb.append(1);
	// }

	// sb.append("&pageSize=");

	// if (pageSize.isPresent()) {
	// sb.append(pageSize.get());
	// } else {
	// sb.append(20);
	// }

	// sb.append("&sort=");

	// if (sort.isPresent()) {
	// sb.append(sort.get());
	// } else {
	// sb.append("createdDate:desc");
	// }

	// JSONObject itemsJsonObject =
	// _cloudFunctionsWebService.getItems(sb.toString());

	// ArrayList<Lead> leadItems = new ArrayList<Lead>();

	// for (Object itemObject : itemsJsonObject.optJSONArray("items")) {
	// leadItems.add(
	// new Lead(
	// new JSONObject(itemObject)));
	// }

	// LiferayResponseEntity<Lead> liferayResponseEntity = new
	// LiferayResponseEntity<Lead>(
	// leadItems,
	// itemsJsonObject.getInt("totalCount"));

	// return new ResponseEntity<>(
	// liferayResponseEntity,
	// HttpStatus.OK);
	// }

	@SuppressWarnings("rawtypes")
	private ArrayList _convertItems(JSONObject itemsJsonObject, String objectDefinitionExternalReferenceCode) {
		if (objectDefinitionExternalReferenceCode.equals("LeadObject")) {
			ArrayList<Lead> leadItems = new ArrayList<Lead>();

			for (Object itemObject : itemsJsonObject.getJSONArray("items")) {
				leadItems.add(
						new Lead(
								new JSONObject(itemObject.toString())));
			}

			return leadItems;
		}

		if (objectDefinitionExternalReferenceCode.equals("OpportunityPartnerRole")) {
			ArrayList<OpportunityPartnerRole> opportunityPartnerRoleItems = new ArrayList<OpportunityPartnerRole>();

			for (Object itemObject : itemsJsonObject.getJSONArray("items")) {
				opportunityPartnerRoleItems.add(
						new OpportunityPartnerRole(
								new JSONObject(itemObject.toString())));
			}

			return opportunityPartnerRoleItems;
		}

		return null;
	}

	private String _getEndpoint(String objectDefinitionExternalReferenceCode) {
		if (objectDefinitionExternalReferenceCode.equals("LeadObject"))
			return "/v1/leads";

		if (objectDefinitionExternalReferenceCode.equals("OpportunityPartnerRole"))
			return "/v1/opportunity-partner-roles";

		return null;
	}

	private String _getStringParameters(Map<String, String> parameters) {
		StringBundler sb = new StringBundler("?");

		int counter = 1;

		for (String key : parameters.keySet()) {
			sb.append(key);
			sb.append("=");
			sb.append(parameters.get(key));

			if (counter != parameters.size()) {
				sb.append("&");
			}

			counter++;
		}

		return sb.toString();
	}

	@Autowired
	private CloudFunctionsWebService _cloudFunctionsWebService;

	@Autowired
	private UserAccountWebService _userAccountWebService;

}
