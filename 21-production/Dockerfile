# Production image for lesson 21. Build from the REPOSITORY ROOT:
#   docker build -f 21-production/Dockerfile -t node-production .
#   docker run -p 3000:3000 node-production
FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

# Dependencies first: this layer is cached until package*.json change
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY 21-production/src ./21-production/src

# The official image ships an unprivileged "node" user: never run as root
USER node
EXPOSE 3000

# Start node DIRECTLY (not via "npm start") so SIGTERM reaches our process and graceful shutdown works
CMD ["node", "21-production/src/server.js"]
