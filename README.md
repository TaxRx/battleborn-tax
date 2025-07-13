# TaxApp Client Portal

A comprehensive tax management system with secure client authentication, enhanced dashboard metrics, and professional tax calculation tools.

## Features

### Epic 1: Secure Client Authentication ✅ COMPLETED
- **Multi-User Access**: Role-based permissions for owners, members, viewers, and accountants
- **Secure Authentication**: Email-based registration with strong password requirements
- **User Management**: Invitation system with secure tokens and email delivery
- **Profile Management**: Personal and business profile management with validation
- **Security Features**: Row-level security, audit logging, and session management

### Epic 2: Client Dashboard Enhancement ✅ COMPLETED
- **Advanced Metrics Visualization**: Interactive charts and progress indicators
- **Activity Feed**: Real-time activity tracking with engagement metrics
- **Mobile Responsiveness**: Comprehensive mobile-first design with touch optimization
- **Enhanced User Experience**: Repositioned Quick Actions for better accessibility
- **Performance Optimized**: Fast-loading metrics with efficient data structures

### Core Tax Features
- Interactive tax benefit calculator
- Real-time visualization of benefits distribution
- Automated email notifications for inquiries
- Integration with scheduling system
- Mobile-responsive design

## Quick Start

### Prerequisites
- Node.js 18.17.0 or higher
- npm 9.6.7 or higher
- Supabase account and project

### Installation

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
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database:
```bash
# Navigate to the database directory (IMPORTANT: Must run from db/bba)
cd db/bba

# Start Supabase
supabase start

# Apply migrations (if needed)
supabase db reset
```

5. Start the development server:
```bash
# Return to project root
cd ../..

# Start the development server
npm run dev
```

6. Access the application:
   - Frontend: http://localhost:5174
   - Supabase Studio: http://127.0.0.1:54323

## Demo Accounts

For testing purposes, use these demo accounts:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `dan@fellars.com` | `testpass123` | Client Owner | Full client management |
| `testclient@fellars.com` | `testpass123` | Client User | Standard client access |
| `admin@taxrxgroup.com` | `testpass123` | Admin | System administration |

## Project Structure

```
taxapp/
├── src/
│   ├── components/           # React components
│   │   ├── EnhancedClientDashboard.tsx  # Epic 2 main dashboard
│   │   ├── AdminDashboard/   # Admin interface components
│   │   └── ...
│   ├── services/            # API services and utilities
│   ├── store/              # State management
│   ├── tests/              # Test files
│   └── types/              # TypeScript type definitions
├── db/bba/                 # Database files (Supabase)
│   ├── supabase/
│   │   ├── migrations/     # Database migrations
│   │   └── functions/      # Edge functions
│   └── *.sql              # Database scripts
├── docs/                  # Documentation
│   ├── epic2-client-dashboard-enhancement.md
│   └── epic2-api-reference.md
└── package.json
```

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run all tests
npm run test:epic1   # Run Epic 1 tests
npm run test:epic2   # Run Epic 2 tests
npm run test:coverage # Run tests with coverage
```

### Database
```bash
# Must be run from db/bba directory
cd db/bba
supabase start       # Start local Supabase
supabase stop        # Stop local Supabase
supabase status      # Check status
supabase db reset    # Reset database with migrations
```

## Dependencies

### Core Dependencies
- **React 18**: Frontend framework
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build tool and development server
- **Supabase**: Backend-as-a-service (database, auth, storage)
- **React Router**: Client-side routing
- **Framer Motion**: Animations and interactions

### UI Components
- **Tailwind CSS**: Utility-first CSS framework
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons**: Beautiful hand-crafted SVG icons
- **Chart.js**: Interactive charts and visualizations

### Development Tools
- **Jest**: Testing framework with jsdom environment
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking

## Epic 2 Features

### Enhanced Dashboard
The client dashboard now includes:
- **Interactive Metrics**: Total proposals, active proposals, savings, completion rates
- **Trend Visualizations**: 7-day charts showing proposal activity
- **Progress Indicators**: Animated completion rate displays
- **Savings Breakdown**: Color-coded financial summaries

### Activity Tracking
- Real-time activity feed with timestamps
- Engagement metrics (session duration, pages viewed, actions taken)
- Activity types: proposals, documents, meetings, payments, status updates

### Mobile Optimization
- Responsive design for all screen sizes
- Touch-friendly interface with proper target sizes
- Collapsible sidebar with smooth animations
- Mobile-optimized navigation and actions

### Performance
- Optimized database queries with RPC functions
- Client-side caching for frequently accessed data
- Efficient component rendering with React.memo
- Fast chart rendering with Chart.js integration

## Testing

The project includes comprehensive test coverage:

### Epic 1 Tests
- Security testing for authentication flows
- Integration testing for user management
- Performance testing for database operations

### Epic 2 Tests
- Functional testing for dashboard components
- Data structure validation for metrics and activities
- Responsive design testing for mobile compatibility

### Running Tests
```bash
# Run specific test suites
npm run test:epic1:security
npm run test:epic1:integration
npm run test:epic1:performance
npm run test:epic2:functionality

# Run with coverage
npm run test:epic1:coverage
npm run test:epic2:coverage
```

## Documentation

- [Epic 2: Client Dashboard Enhancement](./docs/epic2-client-dashboard-enhancement.md) - Complete feature documentation
- [Epic 2 API Reference](./docs/epic2-api-reference.md) - Detailed API documentation
- [Database Schema](./db/bba/database-erd.md) - Database structure and relationships

## Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
Ensure all environment variables are properly configured for production:
- Supabase production URLs and keys
- SMTP configuration for email delivery
- Web3Forms key for contact forms

### Database Migration
Apply database migrations in production:
```sql
-- Epic 1 migrations (authentication, user management)
-- Epic 2 migrations (dashboard metrics, activity tracking)
```

## Troubleshooting

### Common Issues

#### Development Server Won't Start
- Ensure Node.js version 18.17.0 or higher
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for port conflicts (default: 5174)

#### Database Connection Issues
- Verify Supabase is running: `supabase status`
- Check environment variables in `.env`
- Ensure migrations are applied: `supabase db reset`

#### Authentication Problems
- Clear browser localStorage and cookies
- Check Supabase auth configuration
- Verify email settings for registration

### Getting Help
- Check browser console for error messages
- Review Supabase logs in the dashboard
- Ensure database functions exist and RLS policies are correct

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run the test suite: `npm test`
5. Commit changes: `git commit -m "Add new feature"`
6. Push to branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

This project is proprietary and confidential. All rights reserved.

## Support

For technical support or questions about the application, please contact the development team or refer to the documentation in the `docs/` directory. 