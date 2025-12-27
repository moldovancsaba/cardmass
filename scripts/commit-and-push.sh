#!/bin/bash
set -e

echo "Running build..."
npm run build

echo "Build successful. Committing changes..."
git add -A
git commit -m "Update JWKS endpoint to standard OIDC path

- Change from /api/.well-known/jwks.json to /.well-known/jwks.json
- SSO rewrite rule should now be deployed and working
- Uses standard OIDC discovery endpoint path"

echo "Pushing to main..."
git push origin main

echo "Done!"

