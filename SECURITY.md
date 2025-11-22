# Security Policy

## Supported Versions

We currently support the following versions of UPer.li:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of UPer.li seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**DO NOT report security vulnerabilities through public GitHub issues.**

### Private Disclosure Process

1. Please email your findings to contact@uper.li.
2. Include as much detail as possible:
   - Type of vulnerability
   - Steps to reproduce
   - Affected components
   - Potential impact
3. We will acknowledge your report within 48 hours.
4. We will investigate the issue and keep you updated on our progress.
5. Once a fix is ready, we will release a security update and credit you (if desired).

### Security Best Practices

When deploying UPer.li in production, please ensure you follow these security best practices:

- **Environment Variables**: Never commit `.env` files. Use a secure secrets manager.
- **HTTPS**: Always serve the application over HTTPS.
- **Database**: Ensure your database is not publicly accessible and uses strong credentials.
- **Updates**: Keep dependencies up to date using `npm update` or Dependabot.
- **Headers**: The application comes with secure headers configured in `next.config.ts`. Do not disable them unless necessary.

## Security Features

UPer.li includes several built-in security features:

- **Google Safe Browsing**: Checks all long URLs against Google's threat list.
- **Cloudflare Turnstile**: Protects public forms from bots.
- **Rate Limiting**: Prevents abuse of API endpoints.
- **2FA**: Optional two-factor authentication for user accounts.
- **Link Password Protection**: Optional passwords for shortened links.

Thank you for helping keep UPer.li secure!
