/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.Validator;

import java.net.URI;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.json.JSONArray;
import org.json.JSONObject;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * @author Ryan Schuhler
 */
@Component
public class UsageReportService extends OneBaseService {

	public JSONObject fetchUsageReport(long usageReportId) throws Exception {
		return _fetchJSONObject(
			UriComponentsBuilder.fromPath(
				"/o/c/usagereports/{usageReportId}"
			).buildAndExpand(
				usageReportId
			).toUri());
	}

	public void generateUsageReports() throws Exception {
		YearMonth yearMonth = YearMonth.now(
			ZoneOffset.UTC
		).minusMonths(
			1
		);

		if (_log.isInfoEnabled()) {
			_log.info("Generating usage reports for " + yearMonth);
		}

		JSONArray usageRecordsJSONArray =
			_getDataWarehouseUsageRecordsJSONArray();

		int overageCount = 0;

		for (int i = 0; i < usageRecordsJSONArray.length(); i++) {
			JSONObject usageRecordJSONObject =
				usageRecordsJSONArray.getJSONObject(i);

			try {
				if (_generateUsageReport(usageRecordJSONObject, yearMonth)) {
					overageCount++;
				}
			}
			catch (Exception exception) {
				_log.error(
					"Unable to generate usage report for " +
						usageRecordJSONObject,
					exception);
			}
		}

		if (_log.isInfoEnabled()) {
			_log.info(
				StringBundler.concat(
					"Generated ", overageCount, " usage report(s) for ",
					yearMonth));
		}
	}

	@Scheduled(cron = "${liferay.one.usage.report.cron:0 0 2 1 * *}")
	public void scheduledGenerateUsageReports() {
		try {
			generateUsageReports();
		}
		catch (Exception exception) {
			_log.error("Unable to generate usage reports", exception);
		}
	}

	public void updateUsageReportCommerceOrderId(
			long commerceOrderId, long usageReportId)
		throws Exception {

		JSONObject jsonObject = new JSONObject();

		jsonObject.put("commerceOrderId", commerceOrderId);

		patch(
			getAuthorization(), jsonObject.toString(),
			UriComponentsBuilder.fromPath(
				"/o/c/usagereports/{usageReportId}"
			).buildAndExpand(
				usageReportId
			).toUri());
	}

	private JSONObject _fetchJSONObject(URI uri) throws Exception {
		String response = null;

		try {
			response = get(getAuthorization(), uri);
		}
		catch (WebClientResponseException webClientResponseException) {
			int statusCode = webClientResponseException.getStatusCode(
			).value();

			if (statusCode != HttpStatus.NOT_FOUND.value()) {
				throw webClientResponseException;
			}
		}

		if (Validator.isNull(response)) {
			return null;
		}

		return new JSONObject(response);
	}

	private JSONObject _fetchProject(String externalReferenceCode)
		throws Exception {

		return _fetchJSONObject(
			UriComponentsBuilder.fromPath(
				"/o/c/projects/by-external-reference-code/" +
					externalReferenceCode
			).build(
			).encode(
			).toUri());
	}

	private JSONObject _fetchUsageDefinition(String externalReferenceCode)
		throws Exception {

		return _fetchJSONObject(
			UriComponentsBuilder.fromPath(
				"/o/c/usagedefinitions/by-external-reference-code/" +
					externalReferenceCode
			).build(
			).encode(
			).toUri());
	}

	private boolean _generateUsageReport(
			JSONObject usageRecordJSONObject, YearMonth yearMonth)
		throws Exception {

		double aggregateQuantity = usageRecordJSONObject.getDouble(
			"usedQuantity");
		double entitledQuantity = usageRecordJSONObject.getDouble(
			"entitledQuantity");

		double overageQuantity = aggregateQuantity - entitledQuantity;

		if (overageQuantity <= 0) {
			return false;
		}

		String usageDefinitionExternalReferenceCode =
			usageRecordJSONObject.getString(
				"usageDefinitionExternalReferenceCode");

		JSONObject usageDefinitionJSONObject = _fetchUsageDefinition(
			usageDefinitionExternalReferenceCode);

		if (usageDefinitionJSONObject == null) {
			_log.error(
				"Unable to find usage definition " +
					usageDefinitionExternalReferenceCode);

			return false;
		}

		String projectExternalReferenceCode = usageRecordJSONObject.getString(
			"projectExternalReferenceCode");

		JSONObject projectJSONObject = _fetchProject(
			projectExternalReferenceCode);

		if (projectJSONObject == null) {
			_log.error(
				"Unable to find project " + projectExternalReferenceCode);

			return false;
		}

		String externalReferenceCode = StringBundler.concat(
			"C_USAGE_REPORT_",
			StringUtil.toUpperCase(
				StringUtil.replace(projectExternalReferenceCode, '-', '_')),
			"_", yearMonth.format(_ERC_MONTH_DATE_TIME_FORMATTER));

		if (_usageReportExists(externalReferenceCode)) {
			if (_log.isInfoEnabled()) {
				_log.info(
					"Skipping usage report " + externalReferenceCode +
						" because it already exists");
			}

			return false;
		}

		double overageRate = usageDefinitionJSONObject.optDouble(
			"overageRate", 0);

		if (overageRate <= 0) {
			_log.error(
				StringBundler.concat(
					"Unable to generate usage report ", externalReferenceCode,
					" because usage definition ",
					usageDefinitionExternalReferenceCode,
					" has no overage rate"));

			return false;
		}

		double overageAmount = overageQuantity * overageRate;

		LocalDate generatedDate = YearMonth.now(
			ZoneOffset.UTC
		).atDay(
			1
		);

		JSONObject usageReportJSONObject = new JSONObject();

		usageReportJSONObject.put(
			"accountExternalReferenceCode",
			usageRecordJSONObject.getString("accountExternalReferenceCode")
		).put(
			"aggregateQuantity", aggregateQuantity
		).put(
			"contractExternalReferenceCode",
			usageRecordJSONObject.getString("contractExternalReferenceCode")
		).put(
			"dateFrom", yearMonth.atDay(1) + "T00:00:00Z"
		).put(
			"dateTo", yearMonth.atEndOfMonth() + "T23:59:59Z"
		).put(
			"entitledQuantity", entitledQuantity
		).put(
			"externalReferenceCode", externalReferenceCode
		).put(
			"generatedAt", generatedDate + "T00:00:00Z"
		).put(
			"generatorClassName", UsageReportService.class.getName()
		).put(
			"overageAmount", overageAmount
		).put(
			"overageCurrency",
			usageDefinitionJSONObject.optString("overageCurrency", "USD")
		).put(
			"overageQuantity", overageQuantity
		).put(
			"r_projectToUsageReport_c_projectId",
			projectJSONObject.getLong("id")
		).put(
			"r_usageDefinitionToUsageReport_c_usageDefinitionId",
			usageDefinitionJSONObject.getLong("id")
		).put(
			"reviewStatus", "readyForReview"
		).put(
			"skuExternalReferenceCode",
			usageRecordJSONObject.getString("skuExternalReferenceCode")
		).put(
			"targetClassName",
			"com.liferay.object.model.ObjectDefinition#C_PROJECT"
		).put(
			"targetPK", projectJSONObject.getLong("id")
		).put(
			"targetType", "project"
		);

		put(
			getAuthorization(), usageReportJSONObject.toString(),
			UriComponentsBuilder.fromPath(
				"/o/c/usagereports/by-external-reference-code/" +
					externalReferenceCode
			).build(
			).encode(
			).toUri());

		if (_log.isInfoEnabled()) {
			_log.info(
				"Generated usage report " + externalReferenceCode +
					" ready for review");
		}

		return true;
	}

	private JSONArray _getDataWarehouseUsageRecordsJSONArray() {
		JSONArray usageRecordsJSONArray = new JSONArray();

		usageRecordsJSONArray.put(
			new JSONObject(
			).put(
				"accountExternalReferenceCode", "ACCNT-026"
			).put(
				"contractExternalReferenceCode", "C_CONTRACT_AI_HUB"
			).put(
				"entitledQuantity", 50000000
			).put(
				"projectExternalReferenceCode", "PRJCT-026"
			).put(
				"skuExternalReferenceCode", "PRDCT-AI-HUB"
			).put(
				"usageDefinitionExternalReferenceCode", "ai-tokens-monthly"
			).put(
				"usedQuantity", 62500000
			));

		return usageRecordsJSONArray;
	}

	private boolean _usageReportExists(String externalReferenceCode)
		throws Exception {

		JSONObject usageReportJSONObject = _fetchJSONObject(
			UriComponentsBuilder.fromPath(
				"/o/c/usagereports/by-external-reference-code/" +
					externalReferenceCode
			).build(
			).encode(
			).toUri());

		return usageReportJSONObject != null;
	}

	private static final DateTimeFormatter _ERC_MONTH_DATE_TIME_FORMATTER =
		DateTimeFormatter.ofPattern("yyyy_MM");

	private static final Log _log = LogFactory.getLog(UsageReportService.class);

}
