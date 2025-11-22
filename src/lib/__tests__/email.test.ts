import { sendEmail } from '../email'
import nodemailer from 'nodemailer'

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    }),
}))

describe('sendEmail', () => {
    it('should send an email using nodemailer', async () => {
        const mailOptions = {
            to: 'test@example.com',
            from: 'noreply@uper.li',
            subject: 'Test Subject',
            html: '<p>Test Body</p>',
        }

        const result = await sendEmail(mailOptions)

        const transporter = nodemailer.createTransport()
        expect(transporter.sendMail).toHaveBeenCalledWith(mailOptions)
        expect(result).toEqual({ messageId: 'test-message-id' })
    })
})
