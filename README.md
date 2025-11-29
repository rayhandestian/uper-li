# UPer.li - URL Shortener for Universitas Pertamina

[![Tests](https://github.com/rayhandestian/uper-li/actions/workflows/test.yml/badge.svg)](https://github.com/rayhandestian/uper-li/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

UPer.li is an exclusive URL shortener service designed for the Civitas Universitas Pertamina (Pertamina University community). It provides a secure, feature-rich platform for creating and managing shortened links with analytics, user management, and administrative controls.

## Features

- **User Authentication**: Secure login and registration with email verification
- **Role-Based Access**: Support for STUDENT and LECTURER/STAFF
- **Link Management**: Create, customize, and manage shortened URLs
- **Password Protection**: Optional password protection for links
- **QR Code Generation**: Automatic QR code generation for links
- **Analytics Dashboard**: Track link visits, user statistics, and more
- **Admin Panel**: Comprehensive admin interface for user and link management
- **Two-Factor Authentication (2FA)**: Enhanced security with email 2FA
- **Safe Browsing**: Integration with Google Safe Browsing API
- **Email Notifications**: SMTP-based email system for verification and notifications
- **CAPTCHA Integration**: Cloudflare Turnstile for spam protection
- **Visit Tracking**: Simple visit amount tracking and last visit date
- **Custom URLs**: Support for custom short URLs (with limitations)
- **Monthly Limits**: User-based monthly link creation limits

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, NextAuth.js 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with custom adapter
- **Email**: Nodemailer with SMTP
- **Security**: bcryptjs for password hashing, Google Safe Browsing
- **Deployment**: Optimized for Vercel

## Prerequisites

- Node.js 18+
- PostgreSQL database
- SMTP email service (SendGrid, etc.)
- Google Safe Browsing API key
- Cloudflare Turnstile keys

## Installation

1. Clone the repository:
```bash
git clone https://github.com/rayhandestian/uper-li.git
cd uper-li
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration values.

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (for development)
npx prisma db push
```

5. Run the database check script:
```bash
npm run check-db
```

## Setup

### Environment Variables

Configure the following in your `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `NEXTAUTH_URL`: Your application URL
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email configuration
- `GOOGLE_SAFE_BROWSING_API_KEY`: Google Safe Browsing API key
- `CLOUDFLARE_TURNSTILE_SECRET`, `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`: Turnstile keys

### Database Migration

This project uses Prisma for database management. The `prisma/schema.prisma` file defines the database schema.

## Usage

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Subdomain Routing

The application uses middleware to handle subdomain routing:

- **app.uper.li**: Main application dashboard
- **admin.uper.li**: Admin panel
- **uper.li**: Redirects to app.uper.li

For local development, you may need to configure your hosts file or access via `localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Endpoints

The application provides RESTful API endpoints for:

- `/api/auth/*`: Authentication (NextAuth)
- `/api/links/*`: Link management
- `/api/user/*`: User profile management
- `/api/admin/*`: Administrative functions
- `/api/2fa/*`: Two-factor authentication
- `/api/register`: User registration
- `/api/verify-code`: Email verification
- `/api/resend-verification`: Resend verification email
- `/api/forgot-password`: Password reset request
- `/api/reset-password`: Password reset execution
- `/api/verify-link-password`: Link password verification

## Project Structure

```
src/
├── __tests__/           # Test files
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utility libraries
├── services/            # Service layer
├── types/               # TypeScript type definitions
├── instrumentation.ts   # OpenTelemetry instrumentation
└── middleware.ts        # Next.js middleware

docs/                    # Documentation
scripts/                 # Utility scripts
public/                  # Static assets
```


## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

Please also review our [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md).

## Author

This project was developed by Computer Science student at Universitas Pertamina as a service for the university community.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For issues or questions, please create an issue on the GitHub repository.
