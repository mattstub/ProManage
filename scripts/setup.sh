#!/bin/bash

# ProManage Setup Script
# This script sets up the local development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Start setup
clear
print_header "ProManage Development Environment Setup"
echo ""

# Check prerequisites
print_header "Checking Prerequisites"
echo ""

MISSING_DEPS=0

if ! check_command node; then
    print_info "Install Node.js from: https://nodejs.org/ or use nvm"
    MISSING_DEPS=1
else
    NODE_VERSION=$(node --version)
    print_info "Node.js version: $NODE_VERSION"
fi

if ! check_command pnpm; then
    print_info "Install pnpm with: npm install -g pnpm"
    MISSING_DEPS=1
else
    PNPM_VERSION=$(pnpm --version)
    print_info "pnpm version: $PNPM_VERSION"
fi

if ! check_command docker; then
    print_info "Install Docker from: https://www.docker.com/get-started"
    MISSING_DEPS=1
else
    DOCKER_VERSION=$(docker --version)
    print_info "Docker version: $DOCKER_VERSION"
fi

if ! check_command docker-compose; then
    print_warning "docker-compose not found (using docker compose plugin instead)"
    if ! docker compose version &> /dev/null; then
        print_error "Neither docker-compose nor docker compose plugin found"
        MISSING_DEPS=1
    fi
fi

echo ""

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies and run this script again"
    exit 1
fi

# Install dependencies
print_header "Installing Dependencies"
echo ""

print_info "Installing workspace dependencies..."
pnpm install

print_success "Dependencies installed"
echo ""

# Setup environment files
print_header "Setting Up Environment Files"
echo ""

if [ ! -f ".env" ]; then
    print_info "Creating .env from template..."
    cp config/development.env.example .env
    print_success ".env created"
    print_warning "Please review and update .env with your configuration"
else
    print_info ".env already exists, skipping"
fi

# Apps
APPS=("api" "web" "mobile")
for app in "${APPS[@]}"; do
    if [ -d "apps/$app" ]; then
        if [ ! -f "apps/$app/.env" ]; then
            if [ -f "apps/$app/.env.example" ]; then
                print_info "Creating apps/$app/.env..."
                cp "apps/$app/.env.example" "apps/$app/.env"
                print_success "apps/$app/.env created"
            else
                print_warning "apps/$app/.env.example not found, skipping"
            fi
        else
            print_info "apps/$app/.env already exists, skipping"
        fi
    fi
done

echo ""

# Start Docker services
print_header "Starting Docker Services"
echo ""

print_info "Starting PostgreSQL, Redis, and MinIO..."

if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

print_success "Docker services started"

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker exec $(docker ps -q -f name=postgres) pg_isready &> /dev/null; do
    echo -n "."
    sleep 1
done
echo ""

print_success "PostgreSQL is ready"
echo ""

# Database setup
print_header "Setting Up Database"
echo ""

cd apps/api

print_info "Running Prisma migrations..."
pnpm prisma migrate dev --name init

print_info "Generating Prisma Client..."
pnpm prisma generate

# Optional: Seed database
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Seeding database..."
    pnpm prisma db seed
    print_success "Database seeded"
fi

cd ../..

echo ""

# Build packages
print_header "Building Packages"
echo ""

print_info "Building shared packages..."
pnpm build --filter='./packages/*'

print_success "Packages built"
echo ""

# Final checks
print_header "Running Final Checks"
echo ""

print_info "Type checking..."
pnpm typecheck

print_info "Linting..."
pnpm lint --fix

print_success "All checks passed"
echo ""

# Summary
print_header "Setup Complete!"
echo ""

print_success "ProManage development environment is ready!"
echo ""
print_info "Services running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MinIO: localhost:9000 (Console: localhost:9001)"
echo ""
print_info "Next steps:"
echo "  1. Review and update .env files"
echo "  2. Run 'pnpm dev' to start all development servers"
echo "  3. Visit http://localhost:3000 for web app"
echo "  4. Visit http://localhost:3001 for API"
echo ""
print_info "Helpful commands:"
echo "  - pnpm dev          # Start all development servers"
echo "  - pnpm test         # Run tests"
echo "  - pnpm lint         # Run linter"
echo "  - pnpm typecheck    # Type checking"
echo ""
print_info "For more information, see docs/development/setup.md"
echo ""
