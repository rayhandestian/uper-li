# UPer.li - URL Shortener for Universitas Pertamina

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
- **Custom Domains**: Support for custom short URLs (with limitations)
- **Monthly Limits**: User-based monthly link creation limits

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with raw SQL migrations
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
git clone <repository-url>
cd uper-link
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
# Run the migration script on your PostgreSQL database
psql -U your_username -d your_database -f migration.sql
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

The `migration.sql` file contains the complete database schema. Run it on your PostgreSQL instance to set up the required tables.

## Usage

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
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

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utility libraries
├── types/               # TypeScript type definitions
└── middleware.ts        # Next.js middleware

docs/                    # Documentation
scripts/                 # Utility scripts
public/                  # Static assets
```

## Contributing

This project follows the [Conventional Commits](https://conventionalcommits.org/) specification. See [COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Submit a pull request

## Author

This project was developed by Computer Science student at Universitas Pertamina as a service for the university community.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For issues or questions, please create an issue on the GitHub repository.
