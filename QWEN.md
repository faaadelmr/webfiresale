# WebFireSale - Next.js Authentication Demo

## Project Overview

WebFireSale is a Next.js 16 application (App Router) that demonstrates a complete authentication system using NextAuth.js, Prisma ORM, and DaisyUI for styling. The application provides user signup, signin, and a protected dashboard with a modern UI.

### Key Technologies

- **Next.js 16** (App Router)
- **TypeScript**
- **NextAuth.js v4** (Credentials provider, Google OAuth)
- **Prisma ORM**
- **SQLite** (default database, though PostgreSQL via Supabase is mentioned in the original documentation)
- **TailwindCSS + DaisyUI** (for styling)
- **bcrypt** (for password hashing)

### Features

1. **User Authentication System**:
   - User signup with name, email, and password
   - User signin with email and password
   - Google OAuth authentication
   - Protected routes (dashboard)
   - Logout functionality
   - Email verification functionality

2. **Role-Based Access Control (RBAC)**:
   - Three-tier role system: superadmin, admin, customer
   - ACL (Access Control List) for fine-grained permissions
   - Server-side enforcement of access controls
   - Middleware to protect routes based on roles
   - Server actions protected by role-based permissions
   - API routes with role verification
   - Superadmin features: user management, role assignment, soft-delete, password reset, and automatic cleanup

3. **Database Integration**:
   - Prisma schema with User and Address models
   - SQLite database as default (using DATABASE_URL environment variable)
   - Secure password hashing with bcrypt
   - User profiles with additional information (name, phone, date of birth, etc.)
   - Soft-delete functionality with isActive and deletedAt fields

4. **Superadmin Features**:
   - User management (edit profile information)
   - Role assignment and modification
   - Soft-delete and restore functionality
   - Password reset for other users
   - Automatic cleanup of old deleted users (30-day retention)

4. **UI/UX**:
   - DaisyUI components throughout the application
   - Responsive design for all screen sizes
   - Consistent theming across pages
   - Modern dashboard interface with user information and address management

### Project Structure

```
src/
├── actions/                 # Server actions with RBAC protection
│   └── userActions.ts       # User management server actions
├── app/                     # Next.js App Router pages
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth configuration
│   │   ├── cron/purge-deleted-users/route.ts # Cron job to purge old deleted users
│   │   ├── signup/route.ts          # User registration API
│   │   └── users/[id]/
│   │       ├── route.ts              # API for user profile management
│   │       ├── restore/route.ts      # API to restore soft-deleted user
│   │       ├── role/route.ts         # API to update user role
│   │       └── reset-password/route.ts # API to reset user password
│   ├── components/
│   │   └── Toast.tsx                 # Toast notification component
│   ├── dashboard/
│   │   ├── page.tsx                 # Protected dashboard
│   │   └── users/
│   │       ├── page.tsx             # Server-side secured user management page
│   │       ├── UserListClient.tsx   # Client-side user list component
│   │       └── [id]/
│   │           └── edit/
│   │               ├── page.tsx     # Server-side secured edit user page
│   │               └── EditUserClient.tsx # Client-side edit user component
│   ├── profile/page.tsx             # User profile management
│   ├── signin/page.tsx      # Signin page
│   ├── signup/page.tsx      # Signup page
│   ├── unauthorized/page.tsx # Unauthorized access page
│   ├── page.tsx             # Homepage
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── SessionProviderWrapper.tsx # Session provider wrapper
│   └── ui/
│       └── DashboardNavbar.tsx # Dashboard navigation
├── lib/                     # Utility functions
│   ├── admin-helpers.ts     # Helper functions for superadmin features
│   ├── auth.ts              # Authentication utilities with RBAC helpers
│   ├── authSettings.ts      # Authentication configuration
│   ├── rbac.ts              # Role-based access control (ACL) utilities
│   ├── security.ts          # Security utilities and input validation
│   └── prisma.ts            # Prisma client setup
├── types/                   # TypeScript type definitions
├── prisma/                  # Prisma schema and migrations
├── public/                  # Static assets
├── middleware.ts            # RBAC middleware for route protection
└── QWEN.md                  # Project documentation
```

## Building and Running

### Prerequisites

- Node.js (v18 or higher)
- SQLite database (default) or PostgreSQL database

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Set up environment variables in `.env` (database URL and NextAuth secret)
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
5. Run database migrations:
   ```bash
   npx prisma db push  # For SQLite
   # or
   npx prisma migrate dev --name init  # For PostgreSQL
   ```
6. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

The application will be available at http://localhost:3000

### Environment Variables

The application requires the following environment variables in a `.env` file:

- `DATABASE_URL`: SQLite or PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth JWT
- `NEXTAUTH_URL`: Application URL
- OAuth provider credentials (if enabled):
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`
  - `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`

## Development Conventions

- TypeScript is used throughout the project
- DaisyUI classes are preferred for styling over raw Tailwind classes
- Prisma is used for database operations
- NextAuth is used for authentication
- The App Router is used for routing and page organization
- Client components are used when client-side interactivity is needed
- Server components are used for data fetching and server-side operations
- Components are organized in the `src/components` directory
- Utility functions are in the `src/lib` directory

## Key Files

- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth configuration with credentials and OAuth providers
- `src/app/api/signup/route.ts`: API route for user registration
- `src/app/api/users/[id]/route.ts`: API route for user profile management
- `src/app/api/users/[id]/role/route.ts`: API route to update user role
- `src/app/api/users/[id]/reset-password/route.ts`: API route to reset user password
- `src/app/api/users/[id]/restore/route.ts`: API route to restore soft-deleted user
- `src/app/api/cron/purge-deleted-users/route.ts`: Cron job to purge old deleted users
- `src/app/dashboard/users/page.tsx`: Server-side secured user list page
- `src/app/dashboard/users/UserListClient.tsx`: Client-side user list component with filtering and search
- `src/components/Toast.tsx`: Toast notification component for user feedback
- `src/lib/admin-helpers.ts`: Helper functions for superadmin user management
- `src/lib/auth.ts`: Authentication utilities including password validation and RBAC helpers
- `src/lib/authSettings.ts`: Configuration for enabling/disabling authentication providers
- `src/lib/rbac.ts`: Role-based access control (ACL) configuration and utilities
- `src/lib/security.ts`: Security utilities for input validation and sanitization
- `middleware.ts`: RBAC middleware to enforce role-based access control for routes
- `src/actions/userActions.ts`: Protected server actions with role-based permissions
- `prisma/schema.prisma`: Database schema definition with User and Address models
- `src/components/SessionProviderWrapper.tsx`: Wrapper for NextAuth session provider
- `src/components/ui/DashboardNavbar.tsx`: Navigation component for the dashboard

## Authentication Configuration

Authentication providers can be enabled/disabled via `src/lib/authSettings.ts`:

```typescript
export const authSettings = {
  providers: {
    credentials: true,     // Enable email/password authentication
    google: true,          // Enable Google OAuth
    facebook: false,       // Disable Facebook OAuth
    instagram: false,      // Disable Instagram OAuth
  },
};
```

## Database Schema

The application uses the following Prisma schema:

- **User**: Contains user information including authentication details, profile information, and roles
- **Address**: Contains user addresses with support for multiple addresses per user

The User model includes fields for name, email, password, provider, avatar, profile details (phone, date of birth, etc.), role (with "USER" as default), and verification status.

## Security Features

- Passwords are hashed using bcrypt
- Authentication sessions are managed through JWT tokens
- OAuth providers are implemented following security best practices
- Input validation is performed during registration
- Session protection using NextAuth's built-in security features

## RBAC (Role-Based Access Control) Implementation

The application now includes a robust RBAC system with ACL (Access Control List) for fine-grained permission control:

### Roles
- **superadmin**: Has access to all resources and can manage ACL
- **admin**: Can access dashboard and profile
- **customer**: Can only access profile

### ACL Configuration
- Defined in `src/lib/rbac.ts` with the following permissions:
  - superadmin: ["*"] (full access)
  - admin: ["dashboard", "profile"]
  - customer: ["profile"]

### Implementation Components
1. **NextAuth Integration**: Roles are stored in JWT and session via database lookup
2. **Middleware**: Enforces RBAC rules server-side for all protected routes
3. **Authorization Helpers**: Server-side functions in `src/lib/auth.ts` for checking permissions
4. **Server Actions Protection**: Server actions in `src/actions/` require proper roles
5. **API Route Protection**: API routes verify roles before executing operations
6. **Security Utilities**: Input validation and sanitization in `src/lib/security.ts`

### Access Control Flow
1. User authenticates and role is retrieved from database
2. Role is stored in JWT and session
3. Middleware checks role against ACL for each route
4. Server-side functions verify permissions before executing operations
5. Unauthorized access redirects to `/unauthorized` page

This implementation ensures that all access control is enforced server-side, preventing client-side manipulation of permissions.