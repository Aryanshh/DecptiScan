# Use Node.js as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Expose ports for the app (3001) and ML (8000)
EXPOSE 3001 8000

# Start both services using PM2
CMD ["npm", "run", "prod"]
