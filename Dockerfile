FROM node:20-alpine AS development

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Clean install with package-lock.json
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from development stage
COPY --from=development /app/dist ./dist

CMD ["node", "dist/main"]
