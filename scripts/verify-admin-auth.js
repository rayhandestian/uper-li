// eslint-disable-next-line @typescript-eslint/no-require-imports
const { signAdminToken, verifyAdminToken } = require('../src/lib/admin-auth');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const assert = require('assert');

// Mock process.env
process.env.ADMIN_PASSCODE = 'test-secret';

console.log('Running Admin Auth Verification...');

// Test 1: Token Generation
const token = signAdminToken();
console.log('Generated Token:', token);
assert.ok(token, 'Token should be generated');
assert.ok(token.includes('.'), 'Token should contain a separator');

// Test 2: Token Verification (Valid)
const isValid = verifyAdminToken(token);
console.log('Is Valid:', isValid);
assert.strictEqual(isValid, true, 'Token should be valid');

// Test 3: Token Verification (Invalid Signature)
const [payload, signature] = token.split('.');
const tamperedToken = `${payload}.tampered_signature`;
const isTamperedValid = verifyAdminToken(tamperedToken);
console.log('Is Tampered Valid:', isTamperedValid);
assert.strictEqual(isTamperedValid, false, 'Tampered token should be invalid');

// Test 4: Token Verification (Invalid Payload)
const tamperedPayloadToken = `tampered_payload.${signature}`;
const isPayloadTamperedValid = verifyAdminToken(tamperedPayloadToken);
console.log('Is Payload Tampered Valid:', isPayloadTamperedValid);
assert.strictEqual(isPayloadTamperedValid, false, 'Payload tampered token should be invalid');

console.log('All tests passed!');
