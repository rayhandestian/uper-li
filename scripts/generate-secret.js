#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generate a cryptographically secure secret for NEXTAUTH_SECRET
 * Usage: npm run generate-secret [length]
 */

const crypto = require('crypto')

const length = parseInt(process.argv[2]) || 32

const secret = crypto.randomBytes(length).toString('base64')

console.log('\n' + '='.repeat(60))
console.log('  Generated Secure Secret for NEXTAUTH_SECRET')
console.log('='.repeat(60))
console.log()
console.log(secret)
console.log()
console.log('─'.repeat(60))
console.log(`Length: ${secret.length} characters`)
console.log(`Entropy: ~${length * 8} bits`)
console.log('─'.repeat(60))
console.log()
console.log('📋 Add to your .env.local file:')
console.log(`   NEXTAUTH_SECRET=${secret}`)
console.log()
console.log('⚠️  NEVER commit this secret to version control!')
console.log('✅ This secret meets all security requirements')
console.log()
