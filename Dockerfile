# Use the official Node.js image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose port 3000 (or whatever port your app runs on)
EXPOSE 3000

# Define the command to run your application
CMD [ "node", "app.js" ] 
