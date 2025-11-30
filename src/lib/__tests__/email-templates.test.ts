import {
    getVerificationEmailHtml,
    getResetPasswordEmailHtml,
    getPasswordChangedEmailHtml,
    get2FAVerificationEmailHtml,
    get2FALoginEmailHtml,
} from '../email-templates'
import { TEST_VERIFICATION_CODE, TEST_VERIFICATION_CODE_ALT } from '@/__tests__/test-constants'

describe('Email Templates', () => {
    it('should generate verification email with code', () => {
        const code = TEST_VERIFICATION_CODE
        const html = getVerificationEmailHtml(code)
        expect(html).toContain(code)
        expect(html).toContain('Verifikasi Akun')
        expect(html).toContain('UPer.li')
    })

    it('should generate reset password email with code', () => {
        const code = TEST_VERIFICATION_CODE_ALT
        const html = getResetPasswordEmailHtml(code)
        expect(html).toContain(code)
        expect(html).toContain('Reset Password')
        expect(html).toContain('UPer.li')
    })

    it('should generate password changed email with name', () => {
        const name = 'John Doe'
        const html = getPasswordChangedEmailHtml(name)
        expect(html).toContain(name)
        expect(html).toContain('Password Berhasil Diubah')
        expect(html).toContain('UPer.li')
    })

    it('should generate 2FA verification email with name and code', () => {
        const name = 'Jane Doe'
        const code = TEST_VERIFICATION_CODE_ALT
        const html = get2FAVerificationEmailHtml(name, code)
        expect(html).toContain(name)
        expect(html).toContain(code)
        expect(html).toContain('Verifikasi 2FA')
        expect(html).toContain('UPer.li')
    })

    it('should generate 2FA login email with name and code', () => {
        const name = 'Jane Doe'
        const code = TEST_VERIFICATION_CODE
        const html = get2FALoginEmailHtml(name, code)
        expect(html).toContain(name)
        expect(html).toContain(code)
        expect(html).toContain('Kode Masuk 2FA')
        expect(html).toContain('UPer.li')
    })
})
