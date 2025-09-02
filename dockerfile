# Use Node.js LTS
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the code
COPY . .

# Build Next.js app
RUN npm run build

# Expose Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Start Next.js
CMD ["npm", "start"]
