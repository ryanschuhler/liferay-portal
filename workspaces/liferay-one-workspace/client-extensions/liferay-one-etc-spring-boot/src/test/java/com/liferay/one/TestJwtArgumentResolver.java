/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import org.springframework.core.MethodParameter;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Resolves any {@code @AuthenticationPrincipal Jwt} controller parameter to a
 * fixed stub during {@code MockMvcBuilders.standaloneSetup} tests, so
 * controller branches that read the bearer token can be exercised without
 * standing up Spring Security.
 *
 * @author Ryan Schuhler
 */
public class TestJwtArgumentResolver implements HandlerMethodArgumentResolver {

	public static Jwt newJwt() {
		return Jwt.withTokenValue(
			"test-token"
		).header(
			"alg", "none"
		).subject(
			"tester@liferay.com"
		).build();
	}

	public TestJwtArgumentResolver(Jwt jwt) {
		_jwt = jwt;
	}

	@Override
	public Object resolveArgument(
		MethodParameter methodParameter,
		ModelAndViewContainer modelAndViewContainer,
		NativeWebRequest nativeWebRequest,
		WebDataBinderFactory webDataBinderFactory) {

		return _jwt;
	}

	@Override
	public boolean supportsParameter(MethodParameter methodParameter) {
		return Jwt.class.isAssignableFrom(methodParameter.getParameterType());
	}

	private final Jwt _jwt;

}