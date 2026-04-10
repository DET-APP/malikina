#!/bin/bash

# Database connection parameters
HOST="${DB_HOST:-localhost}"
PORT="${DB_PORT:-5432}"
USER="${DB_USER:-malikina}"
DB="${DB_NAME:-malikina}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting PostgreSQL migrations...${NC}"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if PGPASSWORD=$DB_PASSWORD psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}PostgreSQL is ready!${NC}"
    break
  fi
  echo "Attempt $i/30..."
  sleep 2
  if [ $i -eq 30 ]; then
    echo -e "${RED}PostgreSQL failed to start${NC}"
    exit 1
  fi
done

# Execute migrations
echo -e "${YELLOW}Executing migrations...${NC}"

MIGRATION_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run each migration file
for migration in "$MIGRATION_DIR"/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Running: $(basename "$migration")"
    PGPASSWORD=$DB_PASSWORD psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -f "$migration"
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ $(basename "$migration") completed${NC}"
    else
      echo -e "${RED}✗ $(basename "$migration") failed${NC}"
      exit 1
    fi
  fi
done

echo -e "${GREEN}All migrations completed successfully!${NC}"
