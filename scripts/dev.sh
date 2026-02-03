#!/bin/bash

# ProManage Development Server Launcher
# Starts all development servers concurrently

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Docker services are running
check_docker_services() {
    print_header "Checking Docker Services"
    echo ""

    local all_running=true

    # Check PostgreSQL
    if docker ps | grep -q postgres; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
        all_running=false
    fi

    # Check Redis
    if docker ps | grep -q redis; then
        print_success "Redis is running"
    else
        print_error "Redis is not running"
        all_running=false
    fi

    # Check MinIO
    if docker ps | grep -q minio; then
        print_success "MinIO is running"
    else
        print_error "MinIO is not running"
        all_running=false
    fi

    echo ""

    if [ "$all_running" = false ]; then
        print_error "Some Docker services are not running"
        echo ""
        read -p "Do you want to start Docker services now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Starting Docker services..."
            if docker compose version &> /dev/null; then
                docker compose up -d
            else
                docker-compose up -d
            fi
            print_success "Docker services started"
            echo ""
            sleep 3
        else
            print_error "Please start Docker services and try again"
            exit 1
        fi
    fi
}

# Validate environment
validate_env() {
    print_header "Validating Environment"
    echo ""

    if [ -f "scripts/validate-env.sh" ]; then
        bash scripts/validate-env.sh
        if [ $? -ne 0 ]; then
            echo ""
            print_error "Environment validation failed"
            read -p "Do you want to continue anyway? (y/n) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_info "Environment validation script not found, skipping"
    fi

    echo ""
}

# Display service URLs
show_urls() {
    print_header "Service URLs"
    echo ""

    print_info "Web App:      http://localhost:3000"
    print_info "API Server:   http://localhost:3001"
    print_info "API Docs:     http://localhost:3001/docs"
    print_info "Prisma Studio: http://localhost:5555 (manual start)"
    echo ""
    print_info "PostgreSQL:   localhost:5432"
    print_info "Redis:        localhost:6379"
    print_info "MinIO:        http://localhost:9000"
    print_info "MinIO Console: http://localhost:9001"
    echo ""
}

# Main execution
clear
print_header "ProManage Development Environment"
echo ""

# Check Docker services
check_docker_services

# Validate environment (optional, can be skipped)
if [ "$1" != "--skip-validation" ]; then
    validate_env
fi

# Show service URLs
show_urls

print_header "Starting Development Servers"
echo ""

print_info "Starting all development servers..."
print_info "Press Ctrl+C to stop all servers"
echo ""

# Start development servers using pnpm
# This will use the scripts defined in root package.json
pnpm dev

# Cleanup on exit
trap 'echo ""; print_info "Shutting down..."; exit 0' INT TERM
