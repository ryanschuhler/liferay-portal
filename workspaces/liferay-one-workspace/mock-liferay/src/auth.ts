/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {type Router as ExpressRouter, Router} from 'express';
import {type KeyLike, SignJWT, exportJWK, generateKeyPair} from 'jose';

import {ISSUER, KID, OAHS_CLIENT_ID, OAUA_CLIENT_ID} from './config.js';

// Stands in for Liferay's OAuth2 endpoints. The Spring Boot resource server
// (com.liferay.client.extension.util.spring.boot3) fetches the JWKS from
// "{protocol}://{mainDomain}/o/oauth2/jwks", requires the "at+jwt" token type
// header, and validates the "client_id" claim against the registered user
// agent client id. The mock signs tokens with a key whose public half it
// publishes at that JWKS endpoint, so real JWT validation passes with no
// changes to the Spring Boot security configuration.

export interface Auth {
	mintToken(clientId: string): Promise<string>;
	router: ExpressRouter;
}

export async function createAuth(): Promise<Auth> {
	const {privateKey, publicKey} = await generateKeyPair('RS256');

	const publicJWK = {
		...(await exportJWK(publicKey)),
		alg: 'RS256',
		kid: KID,
		use: 'sig',
	};

	const mintToken = (clientId: string) => signToken(privateKey, clientId);

	const router = Router();

	router.get('/o/oauth2/jwks', (_request, response) => {
		response.json({keys: [publicJWK]});
	});

	router.get('/.well-known/openid-configuration', (_request, response) => {
		response.json({
			issuer: ISSUER,
			jwks_uri: `${ISSUER}/o/oauth2/jwks`,
			token_endpoint: `${ISSUER}/o/oauth2/token`,
		});
	});

	// Both OAuth2 flows the apps use land here: the browser user agent flow
	// (liferay-one-etc-spring-boot-oaua) and Spring Boot's client credentials
	// grab (liferay-one-etc-spring-boot-oahs). The mock accepts any
	// credentials and embeds whichever client_id is presented.

	router.post('/o/oauth2/token', async (request, response) => {
		const clientId =
			request.body?.client_id ??
			extractBasicClientId(request) ??
			OAUA_CLIENT_ID;

		const accessToken = await mintToken(clientId);

		response.json({
			access_token: accessToken,
			expires_in: 3600,
			scope: request.body?.scope ?? 'everything',
			token_type: 'Bearer',
		});
	});

	// Fallback the resource server uses when a client id is not provided in the
	// configtree. We provide the ids statically in the configtree, so this is
	// belt-and-suspenders.

	router.get('/o/oauth2/application', (request, response) => {
		const externalReferenceCode = String(
			request.query.externalReferenceCode ?? ''
		);

		response.json({
			client_id: externalReferenceCode.endsWith('oaua')
				? OAUA_CLIENT_ID
				: OAHS_CLIENT_ID,
			homePageURL: ISSUER,
		});
	});

	return {mintToken, router};
}

function extractBasicClientId(request: {
	headers: Record<string, unknown>;
}): string | undefined {
	const header = request.headers.authorization;

	if (typeof header !== 'string' || !header.startsWith('Basic ')) {
		return undefined;
	}

	const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');

	return decoded.split(':')[0] || undefined;
}

function signToken(privateKey: KeyLike, clientId: string): Promise<string> {
	return new SignJWT({client_id: clientId, scope: 'everything'})
		.setProtectedHeader({alg: 'RS256', kid: KID, typ: 'at+jwt'})
		.setIssuedAt()
		.setIssuer(ISSUER)
		.setSubject('mock-user')
		.setExpirationTime('1h')
		.sign(privateKey);
}
