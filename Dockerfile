# Use Node.js as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install Python for the ML service
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Expose ports for the app (3001) and ML (8000)
EXPOSE 3001 8000

# Start both services using PM2
CMD ["npm", "run", "prod"]
