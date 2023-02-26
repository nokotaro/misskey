# syntax = docker/dockerfile:1.4

ARG NODE_VERSION=18.13.0-bullseye

FROM node:${NODE_VERSION} AS builder

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	build-essential

RUN corepack enable

WORKDIR /misskey

COPY --link ["pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json", "./"]
COPY --link ["scripts", "./scripts"]
COPY --link ["packages/backend/package.json", "./packages/backend/"]
COPY --link ["packages/frontend/package.json", "./packages/frontend/"]
COPY --link ["packages/sw/package.json", "./packages/sw/"]

RUN pnpm i --frozen-lockfile

COPY --link . ./

ARG NODE_ENV=production

RUN git submodule update --init
RUN pnpm build
RUN rm -rf .git/

FROM node:${NODE_VERSION}-slim AS runner

ARG UID="991"
ARG GID="991"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	ffmpeg tini \
	&& apt-get -y clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& corepack enable \
	&& groupadd -g "${GID}" misskey \
	&& useradd -l -u "${UID}" -g "${GID}" -m -d /misskey misskey \
	&& find / -type f -perm /u+s -ignore_readdir_race -exec chmod u-s {} \; \
	&& find / -type f -perm /g+s -ignore_readdir_race -exec chmod g-s {} \;

USER misskey
WORKDIR /misskey

COPY --chown=misskey:misskey --from=builder /misskey/node_modules ./node_modules
COPY --chown=misskey:misskey --from=builder /misskey/built ./built
COPY --chown=misskey:misskey --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --chown=misskey:misskey --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --chown=misskey:misskey --from=builder /misskey/packages/frontend/node_modules ./packages/frontend/node_modules
COPY --chown=misskey:misskey --from=builder /misskey/fluent-emojis /misskey/fluent-emojis
COPY --chown=misskey:misskey . ./

ENV NODE_ENV=production
HEALTHCHECK --interval=5s --retries=20 CMD ["/bin/bash", "/misskey/healthcheck.sh"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "run", "migrateandstart"]
