# WebFireSale - Next.js Authentication Demo

## Project Overview

WebFireSale is a Next.js 16 application (App Router) that demonstrates a complete authentication system using NextAuth.js, Prisma ORM, and DaisyUI for styling. The application provides user signup, signin, and a protected dashboard with a modern UI.

### Key Technologies

- **Next.js 16** (App Router)
- **TypeScript**
- **NextAuth.js v4** (Credentials provider)
- **Prisma ORM**
- **PostgreSQL** (using Supabase as the database provider)
- **TailwindCSS + DaisyUI** (for styling)
- **bcrypt** (for password hashing)

### Features

1. **User Authentication System**:
   - User signup with name, email, and password
   - User signin with email and password
   - Protected routes (dashboard)
   - Logout functionality

2. **Database Integration**:
   - Prisma schema with User model (id, name, email, password, createdAt)
   - PostgreSQL database via Supabase
   - Secure password hashing with bcrypt

3. **UI/UX**:
   - DaisyUI components throughout the application
   - Responsive design for all screen sizes
   - Consistent theming across pages

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth configuration
│   │   └── signup/route.ts              # User registration API
│   ├── dashboard/page.tsx   # Protected dashboard
│   ├── signin/page.tsx      # Signin page
│   ├── signup/page.tsx      # Signup page
│   ├── page.tsx             # Homepage
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── AuthForm.tsx         # Reusable authentication form
│   └── ui/
│       └── DashboardNavbar.tsx # Dashboard navigation
├── lib/                     # Utility functions
│   ├── auth.ts              # Authentication utilities
│   └── prisma.ts            # Prisma client setup
```

## Building and Running

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (using Supabase in this project)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` (database URL and NextAuth secret)
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
5. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:3000

### Environment Variables

The application requires the following environment variables in a `.env` file:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth JWT
- `NEXTAUTH_URL`: Application URL

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

- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth configuration with credentials provider
- `src/app/api/signup/route.ts`: API route for user registration
- `src/components/AuthForm.tsx`: Reusable form component for authentication
- `src/lib/auth.ts`: Authentication utilities including password validation
- `prisma/schema.prisma`: Database schema definition