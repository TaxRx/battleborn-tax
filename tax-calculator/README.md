# Battleborn Advisors - Charitable Donation Calculator

A professional landing page focused on charitable donation tax benefits, featuring a powerful calculator that demonstrates the impact of strategic philanthropy.

## Features

- Interactive tax benefit calculator
- Real-time visualization of benefits distribution
- Automated email notifications for inquiries
- Integration with scheduling system
- Mobile-responsive design

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Copy `.env.example` to `.env` and update the following variables:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=your-email@gmail.com
WEB3FORMS_KEY=your-web3forms-key
```

4. Start the development server:
```bash
npm run dev
```

## Dependencies

- React
- Chart.js
- React Number Format
- Nodemailer
- TailwindCSS
- Radix UI

## Development

The project uses:
- TypeScript for type safety
- TailwindCSS for styling
- Chart.js for data visualization
- Radix UI for accessible components

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` directory to your hosting provider

## Contact

For support or inquiries, contact ben@taxrxgroup.com 