# Photo Portfolio Application

A modern web application for photographers to showcase their portfolio with separate client and admin sections.

## Architecture

- **Backend**: NestJS API with TypeScript
- **Database**: Supabase (PostgreSQL) with authentication
- **File Storage**: Cloudinary for image management
- **Authentication**: JWT with Supabase integration

## Project Structure

```
├── server/                      # NestJS API application
│   ├── src/
│   │   ├── main.ts             # Application entry point
│   │   └── modules/            # Feature modules
│   │       └── auth/           # Authentication module
│   ├── database/               # Database schema and migrations
│   └── test/                   # Unit and integration tests
├── client/                     # Frontend application (future)
└── database/                   # Supabase schema files
```

## Features Implemented

### ✅ Authentication Module
- User registration and login
- JWT token-based authentication
- Role-based access control (photographer/admin)
- Password hashing with bcrypt
- Supabase integration
- Comprehensive unit tests

### ✅ Database Schema
- Users table with roles
- Clients table for photographer's clients
- Projects table linking clients to photo collections
- Photos table with Cloudinary references
- Proper relationships and indexes

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase account
- Cloudinary account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd photo-portfolio
   ```

2. **Server Setup**
   ```bash
   cd server
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Fill in your Supabase and Cloudinary credentials
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Optionally run `database/seed.sql` for sample data

5. **Start Development Server**
   ```bash
   npm run start:dev
   ```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm test:watch
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (protected)
- `GET /auth/verify` - Verify JWT token (protected)

### Health Check
- `GET /` - Application status
- `GET /health` - Health check endpoint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port (default: 3001) | No |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |

## Development Roadmap

### 🚧 In Progress
- User management module
- Client management module
- Project management module
- Photo upload with Cloudinary integration

### 📋 Planned
- Frontend React application
- Image gallery with filtering
- Client portal access
- Admin dashboard
- Email notifications
- Image optimization and variants

## Contributing

1. Create a feature branch
2. Implement your changes with tests
3. Ensure all tests pass
4. Submit a pull request

## License

This project is private and proprietary.