# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Toolchain to compile native addons (better-sqlite3, a devDependency used
# only by the e2e suite, needs node-gyp/python at install time even though
# it's never required to build or run the app). Discarded with this stage.
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src

# Install dependencies (including dev, needed to compile with tsc/nest build)
RUN npm ci
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files (for production dependencies only)
COPY package*.json ./

# Install production dependencies only. --omit=optional is required
# alongside --omit=dev because TypeORM lists every SQL driver (including
# dev-only ones like better-sqlite3, used solely by the e2e test suite)
# as an optionalDependency; npm's lockfile then marks those "devOptional"
# rather than a clean "dev", and --omit=dev alone still tries to build
# their native bindings (no Python/build tools in this image -> fails).
RUN npm ci --omit=dev --omit=optional

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/docs', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/main"]
