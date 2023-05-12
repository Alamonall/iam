FROM node:18 as builder
ARG NPM_TOKEN
WORKDIR /builder
COPY . .
RUN npm config set "@acme:registry" "https://npm.acmecryptocorp.io/" && \
    npm config set //npm.acmecryptocorp.io/:_authToken=${NPM_TOKEN} && \
    npm install && \
    npm run build && \
    npm install --production --prefix dist/

FROM node:18-slim
WORKDIR /app
COPY --from=builder --chown=node:node /builder/node_modules ./node_modules/.
COPY --from=builder --chown=node:node /builder/dist .
RUN chown node:node /app
USER node
CMD [ "node", "src/index.js" ]
