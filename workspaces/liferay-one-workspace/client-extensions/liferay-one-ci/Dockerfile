FROM eclipse-temurin:21-jdk-jammy

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl git \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt-get install -y --no-install-recommends nodejs \
	&& rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://cdn.liferay.cloud/lcp/stable/latest/install.sh \
	| bash -s -- stable latest /usr/local/bin \
	&& command -v lcp

WORKDIR /opt/liferay

COPY --chown=root:root . /opt/liferay

RUN npm ci

CMD ["npm", "start"]