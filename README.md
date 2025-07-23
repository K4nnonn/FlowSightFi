# FlowSightFI

A Next.js application for connecting bank accounts via Plaid and providing AI-powered financial insights.

## Quick Start

1. **Clone and Install**
   ```bash
   git clone [your-repo-url]
   cd FlowSightFI
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.local.example` to `.env.local`
   - Add your Plaid credentials
   - Add your Supabase credentials

3. **Database Setup**
   - Run the SQL script in `supabase/setup.sql` in your Supabase dashboard
   - Enable the `pg_cron` extension

4. **Development**
   ```bash
   npm run dev
   ```

5. **Deploy**
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy

## Features

- 🏦 Plaid bank account integration
- 🔐 Secure data handling with auto-deletion
- 📊 Transaction and account visualization
- 🚀 Modern Next.js + TypeScript + Tailwind CSS
- ☁️ Supabase database with compliance features
- 📱 Responsive design

## Testing

Use Plaid Sandbox credentials:
- Username: `user_good`
- Password: `pass_good`

## Compliance

- 30-day automatic data retention
- GDPR/CCPA compliant
- Comprehensive audit logging