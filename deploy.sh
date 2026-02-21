#!/bin/bash

# Deployment script for CTF Platform on Oracle Cloud

# 1. Pull latest changes from Git
echo "Updating code from repository..."
git pull origin main

# 2. Install dependencies for server
echo "Installing server dependencies..."
cd server
npm install --production
cd ..

# 3. Build React frontend
echo "Building client..."
cd client
npm install
npm run build
cd ..

# 4. Restart the application with PM2
echo "Restarting application..."
# Assuming PM2 is installed on the server
pm2 restart all || pm2 start server/index.js --name "ctf-platform"

echo "Deployment complete!"
