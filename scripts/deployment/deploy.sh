#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting deployment process...${NC}"

# Variables
VERSION=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_ENV=${1:-production}

echo -e "${YELLOW}📦 Environment: $DEPLOY_ENV"
echo -e "${YELLOW}🔖 Version: $VERSION${NC}"

# Step 1: Run tests
echo -e "${GREEN}🧪 Running tests...${NC}"
npm run test:unit
npm run test:integration

# Step 2: Build application
echo -e "${GREEN}🏗️ Building application...${NC}"
npm run build

# Step 3: Build Docker image
echo -e "${GREEN}🐳 Building Docker image...${NC}"
docker build -f docker/Dockerfile -t flipkart-clone:$VERSION .
docker tag flipkart-clone:$VERSION flipkart-clone:latest

# Step 4: Push to registry
echo -e "${GREEN}📤 Pushing to Docker registry...${NC}"
docker tag flipkart-clone:$VERSION $DOCKER_REGISTRY/flipkart-clone:$VERSION
docker push $DOCKER_REGISTRY/flipkart-clone:$VERSION

# Step 5: Deploy to Kubernetes
echo -e "${GREEN}☸️ Deploying to Kubernetes...${NC}"
kubectl set image deployment/flipkart-app \
  app=$DOCKER_REGISTRY/flipkart-clone:$VERSION \
  -n $DEPLOY_ENV

# Step 6: Wait for rollout
echo -e "${GREEN}⏳ Waiting for rollout...${NC}"
kubectl rollout status deployment/flipkart-app -n $DEPLOY_ENV --timeout=5m

# Step 7: Health check
echo -e "${GREEN}🏥 Running health check...${NC}"
sleep 10
if curl -f https://api.flipkart-clone.com/health; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "${RED}❌ Health check failed! Rolling back...${NC}"
    kubectl rollout undo deployment/flipkart-app -n $DEPLOY_ENV
    exit 1
fi

# Step 8: Send notification
echo -e "${GREEN}💬 Sending notification...${NC}"
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"✅ Deployment $VERSION to $DEPLOY_ENV successful!\"}" \
  $SLACK_WEBHOOK_URL

echo -e "${GREEN}🎉 Deployment complete!${NC}"