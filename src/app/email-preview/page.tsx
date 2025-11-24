import {
    getVerificationEmailHtml,
    getResetPasswordEmailHtml,
    getPasswordChangedEmailHtml,
    get2FAVerificationEmailHtml,
    get2FALoginEmailHtml,
} from '@/lib/email-templates'
import { notFound } from 'next/navigation'

export default function EmailPreviewPage() {
    if (process.env.NODE_ENV === 'production') {
        notFound()
    }

    const templates = [
        {
            title: 'Verification Email',
            html: getVerificationEmailHtml('123456'),
        },
        {
            title: 'Reset Password Email',
            html: getResetPasswordEmailHtml('654321'),
        },
        {
            title: 'Password Changed Email',
            html: getPasswordChangedEmailHtml('John Doe'),
        },
        {
            title: '2FA Verification Email',
            html: get2FAVerificationEmailHtml('Jane Doe', '987654'),
        },
        {
            title: '2FA Login Email',
            html: get2FALoginEmailHtml('Jane Doe', '123456'),
        },
    ]

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Email Templates Preview</h1>
            <div className="grid gap-8 max-w-4xl mx-auto">
                {templates.map((template, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
                            <h2 className="text-xl font-semibold text-gray-700">{template.title}</h2>
                        </div>
                        <div className="p-6 overflow-auto">
                            <div
                                className="border border-gray-200 rounded p-4 bg-white"
                                dangerouslySetInnerHTML={{ __html: template.html }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
