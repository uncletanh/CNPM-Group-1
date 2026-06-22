FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the Vite port
EXPOSE 5173

# Run Vite with --host so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
