# syntax = docker/dockerfile:1.4

ARG NODE_VERSION=20.5.1-bullseye

FROM node:${NODE_VERSION} AS builder

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	build-essential

RUN corepack enable

WORKDIR /misskey

COPY ["pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json", "./"]
COPY ["scripts", "./scripts"]
COPY ["packages/backend/package.json", "./packages/backend/"]
COPY ["packages/frontend/package.json", "./packages/frontend/"]
COPY ["packages/sw/package.json", "./packages/sw/"]
COPY ["packages/misskey-js/package.json", "./packages/misskey-js/"]

RUN pnpm i --frozen-lockfile

COPY . ./

ARG NODE_ENV=production

RUN git submodule update --init
RUN pnpm build
RUN rm -rf .git/

FROM node:${NODE_VERSION}-slim AS runner

ARG UID="991"
ARG GID="991"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	ffmpeg tini curl libjemalloc-dev libjemalloc2 \
	&& ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so \
	&& corepack enable \
	&& groupadd -g "${GID}" misskey \
	&& useradd -l -u "${UID}" -g "${GID}" -m -d /misskey misskey \
	&& find / -type d -path /proc -prune -o -type f -perm /u+s -ignore_readdir_race -exec chmod u-s {} \; \
	&& find / -type d -path /proc -prune -o -type f -perm /g+s -ignore_readdir_race -exec chmod g-s {} \;

USER misskey
WORKDIR /misskey

COPY --chown=misskey:misskey --from=builder /misskey/node_modules ./node_modules
COPY --chown=misskey:misskey --from=builder /misskey/built ./built
COPY --chown=misskey:misskey --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --chown=misskey:misskey --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --chown=misskey:misskey --from=builder /misskey/packages/frontend/node_modules ./packages/frontend/node_modules
COPY --chown=misskey:misskey --from=builder /misskey/fluent-emojis /misskey/fluent-emojis
COPY --chown=misskey:misskey . ./

ENV LD_PRELOAD=/usr/local/lib/libjemalloc.so
ENV NODE_ENV=production
HEALTHCHECK --interval=5s --retries=20 CMD ["/bin/bash", "/misskey/healthcheck.sh"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "run", "migrateandstart"]
