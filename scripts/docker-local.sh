#!/bin/bash

# Local Docker development helper
# Usage: ./scripts/docker-local.sh [command]

set -e

COMMAND=${1:-help}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function show_help() {
    cat << EOF
${BLUE}Malikina Docker Local Development Commands${NC}

Usage: ./scripts/docker-local.sh [command]

Commands:
  ${GREEN}up${NC}              Start all services (API + PostgreSQL)
  ${GREEN}down${NC}            Stop all services
  ${GREEN}logs${NC}            Show logs (follow mode)
  ${GREEN}logs-api${NC}        Show API logs
  ${GREEN}logs-db${NC}         Show PostgreSQL logs
  ${GREEN}rebuild${NC}         Rebuild API image
  ${GREEN}shell-api${NC}       Open shell in API container
  ${GREEN}shell-db${NC}        Open shell in PostgreSQL container
  ${GREEN}psql${NC}            Open psql in PostgreSQL
  ${GREEN}migrate${NC}         Run migrations
  ${GREEN}reset${NC}           Reset database (dangerous!)
  ${GREEN}seed${NC}            Seed sample data
  ${GREEN}scrape${NC}          Run xassidas scraper
  ${GREEN}backup${NC}          Backup database
  ${GREEN}restore [file]${NC}  Restore database from backup
  ${GREEN}health${NC}          Check services health
  ${GREEN}ps${NC}              Show container status
  ${GREEN}clean${NC}           Remove stopped containers and volumes
  ${GREEN}pgadmin${NC}         Start with PgAdmin (debug mode)

Examples:
  ./scripts/docker-local.sh up
  ./scripts/docker-local.sh logs-api --tail 50
  ./scripts/docker-local.sh psql
  ./scripts/docker-local.sh scrape

EOF
}

case "$COMMAND" in
    up)
        echo -e "${YELLOW}Starting services...${NC}"
        docker-compose up -d
        sleep 2
        docker-compose ps
        echo -e "${GREEN}✓ Services started${NC}"
        echo -e "${BLUE}API: http://localhost:5000${NC}"
        echo -e "${BLUE}PostgreSQL: localhost:5432${NC}"
        ;;
    
    down)
        echo -e "${YELLOW}Stopping services...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ Services stopped${NC}"
        ;;
    
    logs)
        docker-compose logs -f --tail 50 "${@:2}"
        ;;
    
    logs-api)
        docker-compose logs -f --tail 50 api
        ;;
    
    logs-db)
        docker-compose logs -f --tail 50 postgres
        ;;
    
    rebuild)
        echo -e "${YELLOW}Rebuilding API image...${NC}"
        docker-compose build --no-cache api
        echo -e "${GREEN}✓ Rebuild complete${NC}"
        ;;
    
    shell-api)
        echo -e "${YELLOW}Opening shell in API container...${NC}"
        docker-compose exec api sh
        ;;
    
    shell-db)
        echo -e "${YELLOW}Opening shell in PostgreSQL container...${NC}"
        docker-compose exec postgres bash
        ;;
    
    psql)
        echo -e "${YELLOW}Opening psql...${NC}"
        docker-compose exec postgres psql -U malikina -d malikina
        ;;
    
    migrate)
        echo -e "${YELLOW}Running migrations...${NC}"
        docker-compose exec -T postgres bash -c 'ls /docker-entrypoint-initdb.d/'
        ;;
    
    reset)
        echo -e "${RED}⚠️  This will DELETE ALL DATA!${NC}"
        read -p "Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "${YELLOW}Resetting database...${NC}"
            docker-compose down -v
            docker-compose up -d
            sleep 3
            echo -e "${GREEN}✓ Database reset${NC}"
        fi
        ;;
    
    seed)
        echo -e "${YELLOW}Seeding sample data...${NC}"
        docker-compose exec -T postgres psql -U malikina -d malikina -f /docker-entrypoint-initdb.d/002_seed_sample_data.sql
        echo -e "${GREEN}✓ Sample data seeded${NC}"
        ;;
    
    scrape)
        echo -e "${YELLOW}Running xassidas scraper...${NC}"
        docker-compose exec api npm run scrape
        echo -e "${GREEN}✓ Scraping complete${NC}"
        ;;
    
    backup)
        BACKUP_FILE="backups/malikina_$(date +%Y%m%d_%H%M%S).sql"
        mkdir -p backups
        echo -e "${YELLOW}Backing up database to $BACKUP_FILE...${NC}"
        docker-compose exec -T postgres pg_dump -U malikina -d malikina > "$BACKUP_FILE"
        echo -e "${GREEN}✓ Backup complete: $BACKUP_FILE${NC}"
        ;;
    
    restore)
        RESTORE_FILE=${2}
        if [ -z "$RESTORE_FILE" ]; then
            echo -e "${RED}Error: Please specify backup file${NC}"
            echo "Usage: ./scripts/docker-local.sh restore [backup-file]"
            exit 1
        fi
        if [ ! -f "$RESTORE_FILE" ]; then
            echo -e "${RED}Error: File not found: $RESTORE_FILE${NC}"
            exit 1
        fi
        read -p "This will overwrite the database. Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "${YELLOW}Restoring database...${NC}"
            docker-compose exec -T postgres psql -U malikina -d malikina < "$RESTORE_FILE"
            echo -e "${GREEN}✓ Restore complete${NC}"
        fi
        ;;
    
    health)
        echo -e "${YELLOW}Checking services health...${NC}"
        docker-compose ps
        echo ""
        docker-compose exec -T api curl -s http://localhost:5000/api/health || echo -e "${RED}API health check failed${NC}"
        ;;
    
    ps)
        docker-compose ps
        ;;
    
    clean)
        echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
        docker-compose down -v
        docker container prune -f
        echo -e "${GREEN}✓ Cleanup complete${NC}"
        ;;
    
    pgadmin)
        echo -e "${YELLOW}Starting with PgAdmin...${NC}"
        docker-compose --profile debug up -d
        sleep 2
        docker-compose ps
        echo -e "${GREEN}✓ PgAdmin available at http://localhost:5050${NC}"
        echo -e "${BLUE}Email: admin@malikina.local${NC}"
        echo -e "${BLUE}Password: admin_password_change_me${NC}"
        ;;
    
    help)
        show_help
        ;;
    
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac
