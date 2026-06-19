/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.one.jira.model.BusinessEvent;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * @author Ryan Schuhler
 */
public class BusinessEventConverterTest {

	@Test
	public void testToBusinessEvent() throws Exception {

		// [INT-JIRA]

		// Exercises the inbound Jira data contract: a business-event attributes
		// payload maps onto the BusinessEvent model, with the account and author
		// supplied by the caller.

		BusinessEventConverter businessEventConverter =
			new BusinessEventConverter();

		BusinessEvent businessEvent = businessEventConverter.toBusinessEvent(
			"ACCNT-001",
			"{\"description\": \"Big launch\", \"eventStatus\": \"pending\", " +
				"\"eventType\": \"Go Live\", \"name\": \"Launch\", " +
					"\"timeZone\": \"UTC\"}",
			"author@liferay.com");

		Assertions.assertEquals(
			"ACCNT-001", businessEvent.getAccountExternalReferenceCode());
		Assertions.assertEquals(
			"author@liferay.com", businessEvent.getAuthorEmailAddress());
		Assertions.assertEquals("Big launch", businessEvent.getDescription());
		Assertions.assertEquals("pending", businessEvent.getEventStatusName());
		Assertions.assertEquals("Go Live", businessEvent.getEventTypeName());
		Assertions.assertEquals("Launch", businessEvent.getName());
		Assertions.assertEquals("UTC", businessEvent.getTimeZoneName());
	}

}
