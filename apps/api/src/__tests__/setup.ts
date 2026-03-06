// Set required environment variables before any module that imports src/config is evaluated.
// BCRYPT_SALT_ROUNDS=1 keeps password hashing fast in tests.
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/promanage_test'
process.env['JWT_SECRET'] = 'test-secret-that-is-exactly-32-chars!!'
process.env['NODE_ENV'] = 'test'
process.env['JWT_ACCESS_EXPIRES_IN'] = '15m'
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d'
process.env['BCRYPT_SALT_ROUNDS'] = '1'
