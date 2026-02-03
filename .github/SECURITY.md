# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

We take security seriously and appreciate your efforts to responsibly disclose your findings.

### How to Report

If you discover a security vulnerability, please send an [e-mail](mailto:matt@mattstub.com).    <!-- TODO: security email post develop -->

Please include the following information:

1. **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
2. **Full paths of source file(s)** related to the vulnerability
3. **Location of the affected source code** (tag/branch/commit or direct URL)
4. **Step-by-step instructions** to reproduce the issue
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact** of the vulnerability (what an attacker could achieve)
7. **Any possible mitigations** you've identified

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will send you regular updates about our progress
- **Timeline**: We aim to address critical vulnerabilities within 7-14 days
- **Disclosure**: Once the vulnerability is fixed, we will publicly disclose it (unless you request otherwise)
- **Credit**: We will credit you in our security advisory (unless you prefer to remain anonymous)

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services
- Only interact with accounts you own or with explicit permission of the account holder
- Do not exploit a security issue for purposes beyond demonstrating it
- Report the vulnerability promptly
- Give us reasonable time to address the issue before public disclosure

We will not pursue legal action against researchers who follow this policy.

## Security Best Practices

### For Contributors

When contributing code to ProManage:

1. **Never commit secrets** (API keys, passwords, tokens) to the repository
2. **Validate all user input** to prevent injection attacks
3. **Use parameterized queries** to prevent SQL injection
4. **Sanitize output** to prevent XSS attacks
5. **Follow authentication best practices** (bcrypt for passwords, JWT for sessions)
6. **Keep dependencies updated** and check for vulnerabilities
7. **Enable security linting** (ESLint security plugins)
8. **Use HTTPS** in production
9. **Implement proper error handling** (don't expose internal details)
10. **Follow the principle of least privilege** for database and API access

### For Deployment

When deploying ProManage:

1. **Use environment variables** for all secrets
2. **Enable HTTPS/TLS** for all connections
3. **Configure CORS** properly (don't use `*` in production)
4. **Set up rate limiting** to prevent abuse
5. **Enable security headers** (CSP, HSTS, X-Frame-Options, etc.)
6. **Use strong JWT secrets** (at least 64 characters)
7. **Rotate secrets regularly** (at least quarterly)
8. **Enable database SSL/TLS** connections
9. **Set up Web Application Firewall** (WAF) if possible
10. **Monitor for security events** (failed logins, unusual activity)
11. **Keep software updated** (Node.js, PostgreSQL, dependencies)
12. **Perform regular security audits**

## Known Security Features

### Authentication & Authorization

- **JWT-based authentication** with refresh token rotation
- **Bcrypt password hashing** with configurable salt rounds
- **Role-based access control** (RBAC)
- **Session management** with automatic expiration
- **Password strength requirements**

### Data Protection

- **Input validation** using Zod schemas
- **SQL injection prevention** via Prisma ORM
- **XSS prevention** via React's built-in escaping
- **CSRF protection** for state-changing operations
- **Encrypted data at rest** (database level)
- **Encrypted data in transit** (HTTPS/TLS)

### API Security

- **Rate limiting** to prevent abuse
- **Request size limits** to prevent DoS
- **CORS configuration** for cross-origin requests
- **Security headers** via Helmet
- **API versioning** for backward compatibility

### Infrastructure

- **Secrets management** via environment variables
- **Dependency scanning** via automated tools
- **Security patches** applied promptly
- **Isolated environments** (dev, staging, production)

## Security Advisories

Security advisories will be published at:

- GitHub Security Advisories: [Link]                        <!-- TODO: link to security advisors, when established -->
- Project Website: [Link]                                   <!-- TODO: link to website when we have something worth talking about -->
- Mailing List: [Link]                                      <!-- TODO: link to a mailing list, if applicable, may remove later -->

Subscribe to receive notifications about security updates.

## Security Update Process

1. **Vulnerability reported** to security team
2. **Vulnerability assessed** and severity determined
3. **Fix developed** and tested
4. **Security advisory drafted** (private)
5. **Fix released** in a patch version
6. **Security advisory published** (public)
7. **Credits given** to reporter (if desired)

## Vulnerability Disclosure Policy

We follow **responsible disclosure**:

1. Vulnerabilities are fixed before public disclosure
2. Reporters are notified when fixes are released
3. Public disclosure occurs after fixes are available
4. Sufficient time is given for users to update (typically 30 days)

## Contact

For security concerns, contact:

- **Email**: [Security Contact](mailto:matt@mattstub.com)   <!-- TODO: email for security concerns post development -->
- **PGP Key**: [Link to PGP key if available]

For general inquiries, use:

- **Email**: [General](mailto:matt@mattstub.com)            <!-- TODO: email for general items post development -->
- **GitHub Issues**: For non-security bugs and features

## Acknowledgments

We thank the following researchers for responsibly disclosing vulnerabilities:
<!-- List of security researchers who have helped -->

- [Researcher Name] - [Vulnerability] - [Date]

---

**Last Updated**: 2026-02-03

Thank you for helping keep ProManage and our users safe!
