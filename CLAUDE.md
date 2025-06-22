# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

All commands should be run from the `server/` directory:

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging enabled
npm run build              # Build for production
npm run start:prod         # Start production build

# Testing
npm test                   # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage report
npm test -- --testPathPatterns=filename.spec.ts  # Run specific test file

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier
```

## Architecture Overview

This is a NestJS-based photo portfolio application with the following key architectural decisions:

### Module Structure
- **Feature-based modules**: Each domain (auth, users, clients, projects, photos) has its own module
- **Separation of concerns**: Controllers, services, DTOs, entities, guards, and strategies are organized in separate directories
- **Service layer pattern**: Business logic is encapsulated in services, with clear separation from persistence layer

### Authentication & Authorization
- **Supabase integration**: Primary authentication through Supabase with JWT tokens
- **Dual authentication**: Both Supabase auth (for user management) and custom user records (for app-specific data)
- **Role-based access**: Two roles - `photographer` and `admin` with role-based guards
- **JWT Strategy**: Custom JWT strategy validates tokens and populates user context

### Database Design
- **PostgreSQL via Supabase**: Four main entities with clear relationships
- **UUID primary keys**: All tables use UUID for better scalability
- **Automatic timestamps**: `created_at` and `updated_at` managed by database triggers
- **Cascading deletes**: Projects cascade when clients are deleted, photos cascade when projects are deleted
- **Soft references**: User references use SET NULL to preserve data integrity

### Key Architectural Patterns

**Module Exports**: Services like `AuthService` and `SupabaseService` are exported from modules to be used by other modules.

**Guard Composition**: Use `JwtAuthGuard` for authentication, `RolesGuard` for authorization. Apply both when role-specific access is needed.

**DTO Validation**: All input validation uses `class-validator` decorators in DTO classes. Global validation pipe is configured in `main.ts`.

**Error Handling**: Services throw appropriate NestJS exceptions (UnauthorizedException, ConflictException, etc.) which are automatically converted to HTTP responses.

## Testing Strategy

- **Unit tests**: Focus on service logic with mocked dependencies
- **Mocking pattern**: Use `jest.Mocked<Service>` for type-safe mocks
- **Test isolation**: Each test module creates isolated testing modules with mock providers
- **Async testing**: All service methods are async and tests use `async/await`

## Environment Configuration

Required environment variables (see `.env.example`):
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: For Supabase integration
- `JWT_SECRET`: For token signing (use strong secret in production)
- `CLOUDINARY_*`: For file upload functionality (when implemented)

## Database Schema Relationship

The application follows this data flow:
1. **Users** (photographers/admins) create and manage **Clients**
2. **Clients** can have multiple **Projects** (weddings, portraits, etc.)
3. **Projects** contain multiple **Photos** stored in Cloudinary
4. **Photos** reference Cloudinary URLs and maintain metadata

## Future Module Development

When adding new modules, follow the established pattern:
1. Create module directory under `src/modules/`
2. Organize with subdirectories: `controllers/`, `services/`, `dtos/`, `entities/`, `guards/` (if needed)
3. Export services from module if they'll be used by other modules
4. Write comprehensive unit tests for all services
5. Use proper NestJS decorators for validation, authentication, and authorization

## Common Patterns

**Service injection**: Services are injected via constructor injection using NestJS DI container.

**Global pipes**: Validation pipe is configured globally to automatically validate all DTOs.

**Module imports**: `ConfigModule` is imported globally, other modules import what they need.

**Database interactions**: All database operations go through `SupabaseService` which wraps the Supabase client.