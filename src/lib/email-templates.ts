/**
 * Base layout for all emails to ensure consistent styling
 */
function getEmailLayout(content: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      ${content}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
        <p>Email ini dikirim secara otomatis oleh sistem UPer.li. Mohon jangan membalas email ini.</p>
      </div>
    </div>
  `
}

export function getVerificationEmailHtml(code: string): string {
  return getEmailLayout(`
    <h2>Verifikasi Akun</h2>
    <p>Halo,</p>
    <p>Terima kasih telah mendaftar. Gunakan kode berikut untuk verifikasi akun Anda:</p>
    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
    </div>
    <p>Kode ini berlaku selama 10 menit.</p>
    <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
  `)
}

export function getResetPasswordEmailHtml(code: string): string {
  return getEmailLayout(`
    <h2>Reset Password</h2>
    <p>Halo,</p>
    <p>Kami menerima permintaan untuk mereset password Anda. Gunakan kode berikut:</p>
    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
    </div>
    <p>Kode ini berlaku selama 10 menit.</p>
    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
  `)
}

export function getPasswordChangedEmailHtml(name: string): string {
  return getEmailLayout(`
    <h2>Password Berhasil Diubah</h2>
    <p>Halo ${name},</p>
    <p>Password akun UPer.li Anda telah berhasil diubah.</p>
    <p>Jika ini bukan Anda, segera hubungi admin atau lakukan reset password.</p>
  `)
}

export function get2FAVerificationEmailHtml(name: string, code: string): string {
  return getEmailLayout(`
    <h2>Verifikasi 2FA</h2>
    <p>Halo ${name},</p>
    <p>Anda meminta untuk mengaktifkan Two-Factor Authentication (2FA). Gunakan kode berikut:</p>
    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
    </div>
    <p>Kode ini berlaku selama 10 menit.</p>
    <p>Jika Anda tidak meminta ini, abaikan email ini.</p>
  `)
}

export function get2FALoginEmailHtml(name: string, code: string): string {
  return getEmailLayout(`
    <h2>Kode Masuk 2FA</h2>
    <p>Halo ${name},</p>
    <p>Gunakan kode berikut untuk masuk ke akun UPer.li Anda:</p>
    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
    </div>
    <p>Kode ini berlaku selama 10 menit.</p>
    <p>Jika Anda tidak sedang mencoba masuk, abaikan email ini.</p>
  `)
}
