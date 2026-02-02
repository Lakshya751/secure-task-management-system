#!/bin/bash

echo "====================================="
echo "Task Management System - Setup"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Setup backend
echo "📦 Installing backend dependencies..."
cd apps/api
npm install
cd ../..
echo "✅ Backend dependencies installed"
echo ""

# Setup frontend
echo "📦 Installing frontend dependencies..."
cd apps/dashboard
npm install
cd ../..
echo "✅ Frontend dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "====================================="
echo "✅ Setup complete!"
echo "====================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd apps/api && npm run start:dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd apps/dashboard && npm start"
echo ""
echo "Then open: http://localhost:4200"
echo ""
echo "Test credentials:"
echo "  Owner: owner@parent.com / password123"
echo "  Admin: admin@parent.com / password123"
echo "  Viewer: viewer@child.com / password123"
echo ""
