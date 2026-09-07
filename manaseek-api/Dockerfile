# Build stage
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# Runtime stage
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000

# Migrations run on boot so a rolling deploy never serves an outdated schema.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
