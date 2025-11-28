# Security Setup Guide

## JWT Secret Configuration

The `NEXTAUTH_SECRET` environment variable is critical for JWT token signing and session management. This guide ensures you configure it securely.

---

## Generating a Secure Secret

**Method 1: OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Method 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Method 3: Using our utility**
```bash
npm run generate-secret
```

---

## Setting the Secret

### Development

Create `.env.local` in the project root (automatically gitignored):

```env
NEXTAUTH_SECRET=<your-generated-secret>
```

**⚠️ NEVER commit this file to version control!**

### Production

Set via your deployment platform:

- **Vercel**: Project Settings → Environment Variables
- **Railway**: Project → Variables tab
- **Docker**: Pass as environment variable or use Docker secrets
- **Manual deployment**: Set system environment variable

---

## Security Requirements

Your JWT secret MUST meet these requirements:

- ✅ **Minimum 32 characters** (256-bit security)
- ✅ **Cryptographically random** (use generation tools above)
- ✅ **Unique per environment** (dev ≠ staging ≠ production)
- ✅ **Never committed to version control**
- ✅ **Rotated periodically** (recommended every 90 days)

The application will **fail to start** if these requirements are not met in production.

---

## Validation

The application automatically validates the JWT secret at startup:

### Successful Validation
```
[INFO] Validating environment configuration...
[INFO] Environment validation passed ✓
```

### Failed Validation
```
[ERROR] Environment validation error: NEXTAUTH_SECRET is too short (20 chars). Minimum 32 characters required.
[ERROR] FATAL: Environment validation failed
```

In production, the application will **exit immediately** if validation fails.

---

## Secret Rotation Procedure

When rotating the JWT secret (due to suspected compromise or scheduled maintenance):

### Steps:

1. **Generate new secret**
   ```bash
   npm run generate-secret
   ```

2. **Update environment variable**
   - Access your deployment platform
   - Replace `NEXTAUTH_SECRET` with new value
   - Save changes

3. **Deploy/Restart application**
   - Trigger new deployment or restart
   - Application will start with new secret

4. **Expected impact**
   - ⚠️ All existing user sessions will be **invalidated**
   - Users will need to log in again
   - This is normal and expected behavior

5. **Communication** (if planned rotation)
   - Notify users of scheduled maintenance window
   - Expect brief service interruption

### Emergency Rotation (Security Incident)

If you suspect the secret has been compromised:

1. **Immediately** generate and deploy new secret
2. **Don't wait** for maintenance window
3. **Force logout** all users (automatic with new secret)
4. **Investigate** how compromise occurred
5. **Review** access logs for suspicious activity

---

## Troubleshooting

### Error: "NEXTAUTH_SECRET is not defined"

**Solution**: Create `.env.local` file with the secret:
```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" > .env.local
```

### Error: "NEXTAUTH_SECRET is too short"

**Solution**: Generate a new secret at least 32 characters:
```bash
npm run generate-secret
```

### Error: "appears to be a placeholder or weak value"

**Solution**: Don't use example values like "your-nextauth-secret-here". Generate a random secret.

### Warning: "has low character diversity"

**Solution**: Regenerate using the provided tools. Don't create secrets manually.

---

## Best Practices

1. **Use secret management service** (for production)
   - AWS Secrets Manager
   - HashiCorp Vault
   - Doppler
   - 1Password Secrets Automation

2. **Implement rotation schedule**
   - Set calendar reminder every 90 days
   - Document rotation in change log
   - Test rotation in staging first

3. **Monitor for exposure**
   - Enable GitHub secret scanning
   - Use GitGuardian or TruffleHog
   - Rotate immediately if exposed

4. **Audit access**
   - Limit who can view production secrets
   - Use role-based access control (RBAC)
   - Log secret access events

5. **Backup considerations**
   - Don't store secrets in database backups
   - Encrypt backups containing configuration
   - Test restore procedures

---

## For Developers

### Local Development

Your local secret doesn't need to be as strong as production, but should still be:
- At least 32 characters
- Not shared with other team members
- Different from staging/production

### Testing

For automated tests, use a test-specific secret:
```typescript
// jest.setup.js or similar
process.env.NEXTAUTH_SECRET = 'test-secret-minimum-32-characters-long-for-ci'
```

---

## Additional Resources

- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [How to Rotate Secrets Safely](https://www.vaultproject.io/docs/secrets/secret-rotation)

---

**Last Updated**: November 28, 2025
