# Use Node.js as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install Python for the ML service
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

# Create a symlink for python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages || \
    (python3 -m venv /opt/venv && /opt/venv/bin/pip install -r requirements.txt)

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Expose ports for the app (3001) and ML (8000)
EXPOSE 3001 8000

# Start both services using PM2
CMD ["npm", "run", "prod"]
