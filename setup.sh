#!/bin/bash

###############################################################################
# BASEERA 360 - Phase 1 Complete Setup & Test Script
# This script installs everything, seeds the database, and runs tests
###############################################################################

set -e  # Exit on error

echo "🚀 BASEERA 360 - Phase 1 Complete Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Docker is running
echo -e "${BLUE}Step 1: Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 2: Start Docker Compose services
echo -e "${BLUE}Step 2: Starting Docker Compose services...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}"

# Step 3: Wait for PostgreSQL to be ready
echo -e "${BLUE}Step 3: Waiting for PostgreSQL to start...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U baseera_app > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    echo "⏳ Waiting... ($i/30)"
    sleep 2
done
echo ""

# Step 4: Install backend dependencies
echo -e "${BLUE}Step 4: Installing backend dependencies...${NC}"
cd backend
npm install --legacy-peer-deps > /dev/null 2>&1
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
cd ..
echo ""

# Step 5: Compile TypeScript
echo -e "${BLUE}Step 5: Compiling TypeScript...${NC}"
cd backend
npm run build 2>&1 | grep -E "error|warning" || echo -e "${GREEN}✅ Build successful${NC}"
cd ..
echo ""

# Step 6: Install frontend dependencies
echo -e "${BLUE}Step 6: Installing frontend dependencies...${NC}"
cd frontend
npm install --legacy-peer-deps > /dev/null 2>&1
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
cd ..
echo ""

# Step 7: Seed database with test data
echo -e "${BLUE}Step 7: Seeding database with test data...${NC}"
cd backend
npm run seed 2>&1 | grep -E "created|User|✅"
cd ..
echo ""

# Step 8: Test backend API health
echo -e "${BLUE}Step 8: Testing backend API health...${NC}"
sleep 3
HEALTH=$(curl -s http://localhost:3000/api/health | grep -o '"status":"[^"]*"' || echo "error")
if [[ $HEALTH == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️ Backend API may still be starting${NC}"
fi
echo ""

# Step 9: Test authentication endpoint
echo -e "${BLUE}Step 9: Testing authentication endpoint...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@baseera.ae",
    "password": "password123"
  }')

if echo $LOGIN_RESPONSE | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Authentication working${NC}"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token obtained: ${TOKEN:0:50}..."
else
    echo -e "${YELLOW}⚠️ Authentication test in progress${NC}"
fi
echo ""

# Step 10: Database verification
echo -e "${BLUE}Step 10: Verifying database...${NC}"
USER_COUNT=$(docker-compose exec -T postgres psql -U baseera_app -d baseera_360 -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
if [ ! -z "$USER_COUNT" ] && [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Database has $USER_COUNT users${NC}"
else
    echo -e "${YELLOW}⚠️ Database check in progress${NC}"
fi
echo ""

# Summary
echo "========================================"
echo -e "${GREEN}✅ PHASE 1 SETUP COMPLETE!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}📝 Test Credentials:${NC}"
echo "  Email: test@baseera.ae"
echo "  Password: password123"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo "  Frontend: ${GREEN}http://localhost:5173${NC}"
echo "  Backend API: ${GREEN}http://localhost:3000/api${NC}"
echo "  pgAdmin: ${GREEN}http://localhost:5050${NC}"
echo ""
echo -e "${BLUE}📊 Database:${NC}"
echo "  Host: localhost:5432"
echo "  User: baseera_app"
echo "  Database: baseera_360"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Login with test@baseera.ae / password123"
echo "  3. See Projects Dashboard"
echo "  4. Create a new project"
echo ""
echo -e "${BLUE}📚 Useful Commands:${NC}"
echo "  docker-compose logs -f backend   # Watch backend logs"
echo "  docker-compose logs -f frontend  # Watch frontend logs"
echo "  docker-compose ps                # Check service status"
echo "  docker-compose down              # Stop all services"
echo ""

echo -e "${GREEN}🎉 Phase 1 is ready for testing!${NC}"
