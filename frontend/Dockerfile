FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json yarn.lock next.config.ts tsconfig.json eslint.config.mjs ./
COPY app ./app
COPY public ./public
COPY src ./src
RUN corepack enable && yarn build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

USER node
CMD ["./node_modules/.bin/next", "start", "-p", "3001", "-H", "0.0.0.0"]
