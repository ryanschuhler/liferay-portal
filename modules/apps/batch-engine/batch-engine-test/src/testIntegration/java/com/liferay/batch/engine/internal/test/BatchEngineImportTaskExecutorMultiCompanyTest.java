/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.batch.engine.internal.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.batch.engine.BatchEngineImportTaskExecutor;
import com.liferay.batch.engine.BatchEngineTaskExecuteStatus;
import com.liferay.batch.engine.BatchEngineTaskOperation;
import com.liferay.batch.engine.constants.BatchEngineImportTaskConstants;
import com.liferay.batch.engine.model.BatchEngineImportTask;
import com.liferay.batch.engine.service.BatchEngineImportTaskLocalService;
import com.liferay.petra.lang.SafeCloseable;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.security.auth.CompanyThreadLocal;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.util.CompanyTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;

import java.io.ByteArrayOutputStream;

import java.nio.charset.StandardCharsets;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.junit.Assert;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * @author Ryan Schuhler
 */
@RunWith(Arquillian.class)
public class BatchEngineImportTaskExecutorMultiCompanyTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new LiferayIntegrationTestRule();

	@Test
	public void testExecuteInDifferentCompaniesAtTheSameTime()
		throws Exception {

		_company = CompanyTestUtil.addCompany();

		User user;

		try (SafeCloseable safeCloseable =
				CompanyThreadLocal.setCompanyIdWithSafeCloseable(
					_company.getCompanyId())) {

			user = UserTestUtil.getAdminUser(_company.getCompanyId());
		}

		String screenNamePrefix1 = _randomScreenNamePrefix();

		_batchEngineImportTask = _addBatchEngineImportTask(
			TestPropsValues.getCompanyId(), screenNamePrefix1,
			TestPropsValues.getUserId());

		String screenNamePrefix2 = _randomScreenNamePrefix();

		BatchEngineImportTask batchEngineImportTask = _addBatchEngineImportTask(
			_company.getCompanyId(), screenNamePrefix2, user.getUserId());

		Thread thread1 = new Thread(
			() -> _batchEngineImportTaskExecutor.execute(
				_batchEngineImportTask));

		thread1.start();

		while (thread1.isAlive() &&
			   (_fetchUser(
				   TestPropsValues.getCompanyId(), screenNamePrefix1, 0) ==
					   null)) {

			Thread.sleep(10);
		}

		Thread thread2 = new Thread(
			() -> _batchEngineImportTaskExecutor.execute(
				batchEngineImportTask));

		thread2.start();

		thread1.join();
		thread2.join();

		List<User> users1 = _getUsers(
			TestPropsValues.getCompanyId(), screenNamePrefix1);
		List<User> users2 = _getUsers(
			TestPropsValues.getCompanyId(), screenNamePrefix2);

		_users.addAll(users1);
		_users.addAll(users2);

		BatchEngineImportTask completedBatchEngineImportTask1 =
			_getCompletedBatchEngineImportTask(_batchEngineImportTask);
		BatchEngineImportTask completedBatchEngineImportTask2 =
			_getCompletedBatchEngineImportTask(batchEngineImportTask);

		Date endTime = completedBatchEngineImportTask1.getEndTime();

		Assert.assertTrue(
			endTime.after(completedBatchEngineImportTask2.getStartTime()));

		Assert.assertEquals(users1.toString(), _USERS_COUNT, users1.size());
		Assert.assertEquals(users2.toString(), 0, users2.size());
		Assert.assertEquals(
			0, _getUsersCount(_company.getCompanyId(), screenNamePrefix1));
		Assert.assertEquals(
			_USERS_COUNT,
			_getUsersCount(_company.getCompanyId(), screenNamePrefix2));
	}

	private BatchEngineImportTask _addBatchEngineImportTask(
			long companyId, String screenNamePrefix, long userId)
		throws Exception {

		JSONArray jsonArray = JSONFactoryUtil.createJSONArray();

		for (int i = 0; i < _USERS_COUNT; i++) {
			String screenName = _getScreenName(screenNamePrefix, i);

			jsonArray.put(
				JSONUtil.put(
					"alternateName", screenName
				).put(
					"emailAddress", _getEmailAddress(screenNamePrefix, i)
				).put(
					"familyName", RandomTestUtil.randomString()
				).put(
					"givenName", screenName
				));
		}

		try (SafeCloseable safeCloseable =
				CompanyThreadLocal.setCompanyIdWithSafeCloseable(companyId)) {

			return _batchEngineImportTaskLocalService.addBatchEngineImportTask(
				null, companyId, userId, 1, null,
				"com.liferay.headless.admin.user.dto.v1_0.UserAccount",
				_compressContent(jsonArray.toString()), "JSON",
				BatchEngineTaskExecuteStatus.INITIAL.name(), null,
				BatchEngineImportTaskConstants.IMPORT_STRATEGY_ON_ERROR_FAIL,
				BatchEngineTaskOperation.CREATE.toString(), new HashMap<>(),
				null);
		}
	}

	private byte[] _compressContent(String content) throws Exception {
		try (ByteArrayOutputStream byteArrayOutputStream =
				new ByteArrayOutputStream()) {

			try (ZipOutputStream zipOutputStream = new ZipOutputStream(
					byteArrayOutputStream)) {

				zipOutputStream.putNextEntry(new ZipEntry("import.json"));

				zipOutputStream.write(content.getBytes(StandardCharsets.UTF_8));
			}

			return byteArrayOutputStream.toByteArray();
		}
	}

	private User _fetchUser(
		long companyId, String screenNamePrefix, int index) {

		try (SafeCloseable safeCloseable =
				CompanyThreadLocal.setCompanyIdWithSafeCloseable(companyId)) {

			return _userLocalService.fetchUserByEmailAddress(
				companyId, _getEmailAddress(screenNamePrefix, index));
		}
	}

	private BatchEngineImportTask _getCompletedBatchEngineImportTask(
			BatchEngineImportTask batchEngineImportTask)
		throws Exception {

		try (SafeCloseable safeCloseable =
				CompanyThreadLocal.setCompanyIdWithSafeCloseable(
					batchEngineImportTask.getCompanyId())) {

			batchEngineImportTask =
				_batchEngineImportTaskLocalService.getBatchEngineImportTask(
					batchEngineImportTask.getBatchEngineImportTaskId());

			Assert.assertEquals(
				batchEngineImportTask.getErrorMessage(),
				BatchEngineTaskExecuteStatus.COMPLETED.toString(),
				batchEngineImportTask.getExecuteStatus());

			return batchEngineImportTask;
		}
	}

	private String _getEmailAddress(String screenNamePrefix, int index) {
		return _getScreenName(screenNamePrefix, index) + "@liferay.com";
	}

	private String _getScreenName(String screenNamePrefix, int index) {
		return screenNamePrefix + index;
	}

	private List<User> _getUsers(long companyId, String screenNamePrefix) {
		List<User> users = new ArrayList<>();

		for (int i = 0; i < _USERS_COUNT; i++) {
			User user = _fetchUser(companyId, screenNamePrefix, i);

			if (user != null) {
				users.add(user);
			}
		}

		return users;
	}

	private int _getUsersCount(long companyId, String screenNamePrefix) {
		List<User> users = _getUsers(companyId, screenNamePrefix);

		return users.size();
	}

	private String _randomScreenNamePrefix() {
		return StringUtil.toLowerCase(RandomTestUtil.randomString());
	}

	private static final int _USERS_COUNT = 50;

	@DeleteAfterTestRun
	private BatchEngineImportTask _batchEngineImportTask;

	@Inject
	private BatchEngineImportTaskExecutor _batchEngineImportTaskExecutor;

	@Inject
	private BatchEngineImportTaskLocalService
		_batchEngineImportTaskLocalService;

	@DeleteAfterTestRun
	private Company _company;

	@Inject
	private UserLocalService _userLocalService;

	@DeleteAfterTestRun
	private final List<User> _users = new ArrayList<>();

}