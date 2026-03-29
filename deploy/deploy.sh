#!/bin/bash
# ================================================================
# deploy.sh — Push latest code to GitHub (triggers auto-deploy)
# ================================================================
# Usage:
#   chmod +x deploy/deploy.sh        (run once to make executable)
#   ./deploy/deploy.sh "your message"
#
# This script:
#   1. Checks you're in the right folder
#   2. Checks serviceAccountKey.json is NOT being committed
#   3. Adds all changes
#   4. Commits with your message
#   5. Pushes to GitHub → Render + Vercel auto-deploy

set -e  # exit on any error

# ── Colors for output ────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AutiSense — Deploy to GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Get commit message ───────────────────────────────────────────
MSG="${1:-update}"
if [ -z "$1" ]; then
  echo -e "${YELLOW}No message provided. Using: 'update'${NC}"
  echo -e "  Tip: ./deploy/deploy.sh \"your commit message\""
  echo ""
fi

# ── Safety check: never commit secrets ───────────────────────────
if git ls-files --others --exclude-standard | grep -q "serviceAccountKey.json"; then
  echo -e "${RED}❌ DANGER: serviceAccountKey.json is untracked and would be committed!${NC}"
  echo -e "${RED}   This file contains your Firebase secret key.${NC}"
  echo -e "${RED}   Check your .gitignore — it should exclude this file.${NC}"
  exit 1
fi

if git diff --cached --name-only | grep -q "serviceAccountKey.json"; then
  echo -e "${RED}❌ DANGER: serviceAccountKey.json is staged for commit!${NC}"
  echo -e "   Run: git rm --cached backend/serviceAccountKey.json"
  exit 1
fi

echo -e "${GREEN}✅ Security check passed — no secrets in commit${NC}"

# ── Git operations ───────────────────────────────────────────────
echo ""
echo -e "Adding all changes..."
git add .

echo -e "Committing: '${MSG}'"
git commit -m "$MSG" || {
  echo -e "${YELLOW}Nothing to commit (working tree clean)${NC}"
  exit 0
}

echo -e "Pushing to GitHub..."
git push origin main

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Push complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Render.com:  Auto-deploying backend (~3 min)"
echo -e "  Vercel:      Auto-deploying frontend (~1 min)"
echo ""
echo -e "  Monitor Render:  https://dashboard.render.com"
echo -e "  Monitor Vercel:  https://vercel.com/dashboard"
echo ""