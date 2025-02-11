# Use the official Node.js image as a base
FROM node:22.6-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port that Next.js will run on
EXPOSE 8080

# Start the Next.js development server
CMD ["npm", "run", "start"]
