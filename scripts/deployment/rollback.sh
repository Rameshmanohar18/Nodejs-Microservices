
#!/bin/bash

VERSION=$1
NAMESPACE=${2:-production}

if [ -z "$VERSION" ]; then
    echo "Usage: ./rollback.sh <version> [namespace]"
    exit 1
fi

echo "🔄 Rolling back to version: $VERSION"

# Get previous deployment
PREVIOUS_VERSION=$(kubectl describe deployment flipkart-app -n $NAMESPACE | grep Image | awk '{print $2}' | cut -d: -f2)

echo "Previous version: $PREVIOUS_VERSION"

# Rollback deployment
kubectl rollout undo deployment/flipkart-app -n $NAMESPACE --to-revision=$VERSION

# Wait for rollback
kubectl rollout status deployment/flipkart-app -n $NAMESPACE --timeout=5m

# Verify health
if curl -f https://api.flipkart-clone.com/health; then
    echo "✅ Rollback successful"
else
    echo "❌ Rollback failed, manual intervention required"
    exit 1
fi