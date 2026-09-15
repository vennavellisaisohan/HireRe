#!/usr/bin/env bash
# Run from repo root after linking Vercel to the frontend/ directory.
set -euo pipefail
cd "$(dirname "$0")/frontend"
npx vercel --prod "$@"
