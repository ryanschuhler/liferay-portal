/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.partner.service;

import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.IdTokenCredentials;
import com.google.auth.oauth2.IdTokenProvider;
import com.google.common.io.CharStreams;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * @author Felipe Franca
 */
@Component
public class CloudFunctionsWebService {

        public JSONObject getItems(String uri) throws Exception {
                try (InputStream inputStream = new ByteArrayInputStream(
                                _gcpServiceAccountKey.getBytes())) {

                        GoogleCredentials credentials = GoogleCredentials.fromStream(inputStream);

                        IdTokenCredentials tokenCredential = IdTokenCredentials.newBuilder()
                                        .setIdTokenProvider((IdTokenProvider) credentials)
                                        .setTargetAudience(
                                                _cloudFunctionsBaseUrl)
                                        .build();

                        GenericUrl genericUrl = new GenericUrl(_cloudFunctionsBaseUrl + uri);
                        HttpCredentialsAdapter adapter = new HttpCredentialsAdapter(tokenCredential);
                        HttpTransport transport = new NetHttpTransport();
                        HttpRequest request = transport.createRequestFactory(adapter).buildGetRequest(genericUrl);
                        HttpResponse response = request.execute();

                        JSONObject jsonObject;

                        try {
                                String result = CharStreams.toString(new InputStreamReader(response.getContent(), StandardCharsets.UTF_8));
                                jsonObject = new JSONObject(result);
                        } finally {
                                response.disconnect();
                        }

                        return jsonObject;
                }
        }

        @Value("${liferay.cloud.functions.base.url}")
        private String _cloudFunctionsBaseUrl;

        @Value("${liferay.partner.gcp.service.account.key}")
        private String _gcpServiceAccountKey;

}
