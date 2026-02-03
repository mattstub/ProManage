#!/bin/bash

# ProManage Environment Validation Script
# Validates that all required environment variables are set

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if variable is set
check_var() {
    local var_name=$1
    local var_value=$2
    local is_required=$3
    local description=$4

    if [ -z "$var_value" ]; then
        if [ "$is_required" = "true" ]; then
            print_error "$var_name is not set (REQUIRED)"
            echo "   Description: $description"
            return 1
        else
            print_warning "$var_name is not set (optional)"
            echo "   Description: $description"
            return 0
        fi
    else
        print_success "$var_name is set"
        return 0
    fi
}

# Check if variable contains default/example value
check_not_default() {
    local var_name=$1
    local var_value=$2
    local default_value=$3

    if [ "$var_value" = "$default_value" ]; then
        print_warning "$var_name is using default/example value"
        echo "   Current value: $var_value"
        echo "   This should be changed in production!"
        return 1
    fi
    return 0
}

# Load environment file
ENV_FILE=${1:-.env}

if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
fi

print_header "Validating Environment: $ENV_FILE"
echo ""

# Load variables
export $(grep -v '^#' $ENV_FILE | xargs)

ERRORS=0
WARNINGS=0

# General
echo "General Configuration:"
check_var "NODE_ENV" "$NODE_ENV" "true" "Environment type" || ((ERRORS++))
check_var "APP_NAME" "$APP_NAME" "true" "Application name" || ((ERRORS++))
check_var "PORT" "$PORT" "true" "API server port" || ((ERRORS++))
check_var "APP_URL" "$APP_URL" "true" "Application URL" || ((ERRORS++))
check_var "API_URL" "$API_URL" "true" "API URL" || ((ERRORS++))
echo ""

# Database
echo "Database Configuration:"
check_var "DATABASE_URL" "$DATABASE_URL" "true" "PostgreSQL connection string" || ((ERRORS++))
if [ -n "$DATABASE_URL" ]; then
    if [[ "$DATABASE_URL" == *"postgres:postgres"* ]] && [ "$NODE_ENV" = "production" ]; then
        print_warning "DATABASE_URL contains default credentials"
        ((WARNINGS++))
    fi
fi
echo ""

# Redis
echo "Redis Configuration:"
check_var "REDIS_URL" "$REDIS_URL" "true" "Redis connection string" || ((ERRORS++))
echo ""

# Authentication
echo "Authentication Configuration:"
check_var "JWT_SECRET" "$JWT_SECRET" "true" "JWT secret key" || ((ERRORS++))

if [ -n "$JWT_SECRET" ]; then
    check_not_default "JWT_SECRET" "$JWT_SECRET" "your-super-secret-jwt-key-change-this-in-production" || ((WARNINGS++))
    check_not_default "JWT_SECRET" "$JWT_SECRET" "dev-secret-key-change-in-production" || ((WARNINGS++))

    if [ ${#JWT_SECRET} -lt 32 ]; then
        print_warning "JWT_SECRET is shorter than 32 characters (current: ${#JWT_SECRET})"
        ((WARNINGS++))
    fi
fi

check_var "JWT_ACCESS_EXPIRES_IN" "$JWT_ACCESS_EXPIRES_IN" "false" "Access token expiration (minutes)" || ((WARNINGS++))
check_var "JWT_REFRESH_EXPIRES_IN" "$JWT_REFRESH_EXPIRES_IN" "false" "Refresh token expiration (days)" || ((WARNINGS++))
check_var "BCRYPT_SALT_ROUNDS" "$BCRYPT_SALT_ROUNDS" "false" "Bcrypt salt rounds" || ((WARNINGS++))
echo ""

# CORS
echo "CORS Configuration:"
check_var "CORS_ORIGINS" "$CORS_ORIGINS" "true" "Allowed CORS origins" || ((ERRORS++))
echo ""

# File Storage
echo "File Storage Configuration:"
check_var "S3_ENDPOINT" "$S3_ENDPOINT" "true" "S3 endpoint" || ((ERRORS++))
check_var "S3_REGION" "$S3_REGION" "true" "S3 region" || ((ERRORS++))
check_var "S3_BUCKET" "$S3_BUCKET" "true" "S3 bucket name" || ((ERRORS++))
check_var "S3_ACCESS_KEY" "$S3_ACCESS_KEY" "true" "S3 access key" || ((ERRORS++))
check_var "S3_SECRET_KEY" "$S3_SECRET_KEY" "true" "S3 secret key" || ((ERRORS++))

if [ -n "$S3_ACCESS_KEY" ]; then
    check_not_default "S3_ACCESS_KEY" "$S3_ACCESS_KEY" "minioadmin" || ((WARNINGS++))
    check_not_default "S3_SECRET_KEY" "$S3_SECRET_KEY" "minioadmin" || ((WARNINGS++))
fi
echo ""

# Email
echo "Email Configuration:"
check_var "EMAIL_PROVIDER" "$EMAIL_PROVIDER" "true" "Email service provider" || ((ERRORS++))
check_var "EMAIL_FROM" "$EMAIL_FROM" "true" "From email address" || ((ERRORS++))

if [ "$EMAIL_PROVIDER" = "smtp" ]; then
    check_var "SMTP_HOST" "$SMTP_HOST" "true" "SMTP host" || ((ERRORS++))
    check_var "SMTP_PORT" "$SMTP_PORT" "true" "SMTP port" || ((ERRORS++))
    check_var "SMTP_USER" "$SMTP_USER" "false" "SMTP username" || ((WARNINGS++))
    check_var "SMTP_PASS" "$SMTP_PASS" "false" "SMTP password" || ((WARNINGS++))
elif [ "$EMAIL_PROVIDER" = "sendgrid" ]; then
    check_var "SENDGRID_API_KEY" "$SENDGRID_API_KEY" "true" "SendGrid API key" || ((ERRORS++))
fi
echo ""

# Logging
echo "Logging Configuration:"
check_var "LOG_LEVEL" "$LOG_LEVEL" "false" "Log level" || ((WARNINGS++))
echo ""

# WebSocket
echo "WebSocket Configuration:"
check_var "WS_URL" "$WS_URL" "true" "WebSocket URL" || ((ERRORS++))
echo ""

# Production-specific checks
if [ "$NODE_ENV" = "production" ]; then
    echo "Production-Specific Checks:"

    if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -lt 64 ]; then
        print_error "JWT_SECRET should be at least 64 characters in production (current: ${#JWT_SECRET})"
        ((ERRORS++))
    fi

    if [ "$LOG_LEVEL" = "debug" ] || [ "$LOG_LEVEL" = "trace" ]; then
        print_warning "LOG_LEVEL is set to $LOG_LEVEL in production"
        ((WARNINGS++))
    fi

    if [ "$LOG_PRETTY" = "true" ]; then
        print_warning "LOG_PRETTY is enabled in production (should be false for performance)"
        ((WARNINGS++))
    fi

    check_var "SENTRY_DSN" "$SENTRY_DSN" "false" "Sentry DSN for error tracking" || ((WARNINGS++))

    if [[ "$DATABASE_URL" != *"ssl=true"* ]] && [[ "$DATABASE_URL" != *"sslmode="* ]]; then
        print_warning "DATABASE_URL does not appear to use SSL"
        ((WARNINGS++))
    fi

    if [[ "$REDIS_URL" != "rediss://"* ]]; then
        print_warning "REDIS_URL does not use TLS (should start with rediss://)"
        ((WARNINGS++))
    fi

    echo ""
fi

# Summary
print_header "Validation Summary"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "All environment variables are properly configured!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    print_warning "Environment validation passed with $WARNINGS warning(s)"
    echo ""
    echo "Warnings are not critical but should be addressed,"
    echo "especially in production environments."
    exit 0
else
    print_error "Environment validation failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo ""
    echo "Please fix the errors before starting the application."
    exit 1
fi
