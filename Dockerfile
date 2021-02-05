FROM node:14 AS BUILD_IMAGE

ENV MONGODB_HOST ${MONGODB_HOST}
ENV MONGODB_PORT ${MONGODB_PORT}
ENV FREE_PROXY_HOST ${FREE_PROXY_HOST}
ENV FREE_PROXY_PORT ${FREE_PROXY_PORT}

COPY tsconfig.json /app/tsconfig.json
COPY package.json /app/package.json
COPY ./server /app/server

WORKDIR /app

RUN yarn config set registry https://registry.npm.taobao.org/ && yarn

RUN npm prune --production
# RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /app
# RUN ./node-prune 

FROM node:14-alpine

COPY --from=BUILD_IMAGE /app/node_modules /app/node_modules
COPY --from=BUILD_IMAGE /app/tsconfig.json /app/tsconfig.json
COPY --from=BUILD_IMAGE /app/package.json /app/package.json
COPY --from=BUILD_IMAGE /app/server /app/server

EXPOSE 3000

WORKDIR /app

CMD yarn start
