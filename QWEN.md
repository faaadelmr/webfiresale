# WebFireSale - E-commerce Platform

## Project Overview

WebFireSale is a comprehensive e-commerce platform built with Next.js 16 (App Router), featuring auction functionality, flash sales, user authentication, role-based access control, and order management. The application uses NextAuth.js for authentication, Prisma ORM for database operations, and DaisyUI/TailwindCSS for responsive UI components.

### Key Technologies

- **Next.js 16** (App Router)
- **TypeScript**
- **NextAuth.js v4** (Credentials provider, Google, Facebook, Instagram OAuth)
- **Prisma ORM**
- **SQLite** (default database) / PostgreSQL (alternative)
- **TailwindCSS + DaisyUI** (for styling)
- **bcrypt** (for password hashing)
- **Lucide React** (for icons)
- **Framer Motion** (for animations)

### Features

1. **User Authentication System**:
   - User signup with name, email, and password
   - User signin with email and password
   - Multiple OAuth providers (Google, Facebook, Instagram)
   - Protected routes (dashboard, admin panels)
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

3. **E-commerce Functionality**:
   - Product catalog with detailed listings
   - Flash sales with limited quantities and time periods
   - Auction system with real-time bidding
   - Shopping cart management
   - Order processing and management
   - Address management for delivery
   - Shipping cost calculation

4. **Admin Features**:
   - Product management (add, edit, remove products)
   - Flash sale management (set prices, time limits, quantities)
   - Auction management (start/stop auctions, manage bids)
   - Order management (view, update status)
   - User management (modify profiles, roles, passwords)
   - Shipping configuration and settings management

5. **Database Integration**:
   - Prisma schema with multiple related models
   - SQLite database as default (using DATABASE_URL environment variable)
   - Secure password hashing with bcrypt
   - User profiles with detailed information (name, phone, date of birth, etc.)
   - Soft-delete functionality with isActive and deletedAt fields
   - Complete order history tracking

6. **UI/UX**:
   - DaisyUI components throughout the application
   - Responsive design for all screen sizes
   - Consistent theming across pages
   - Modern dashboard interface with user information and address management
   - Interactive auction interface with real-time bid updates
   - Shopping cart with quantity management and checkout flow

### Project Structure

.
├── .gitignore
├── .idx/
├── .next/                    # Next.js build output (git ignored)
├── __tests/               # Test files
├── middleware.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── prisma/
│   ├── schema.prisma        # Database schema definition
│   ├── seed.ts              # Database seeding script
│   ├── migrations/          # Database migration files
│   └── [other prisma files]
├── public/                  # Static assets
├── src/
│   ├── actions/             # Server actions with RBAC protection
│   │   ├── cartActions.ts
│   │   ├── productActions.ts
│   │   └── userActions.ts
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (protected)/     # Protected pages
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── auction/
│   │   │   │   ├── flashsale/
│   │   │   │   ├── orders/
│   │   │   │   ├── products/
│   │   │   │   ├── settings/
│   │   │   │   ├── shipping/
│   │   │   │   └── users/
│   │   │   │       ├── page.tsx
│   │   │       └── UserListClient.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── addresses/
│   │   │   │   └── route.ts
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── cart/
│   │   │   │   └── route.ts
│   │   │   ├── checkout-data/
│   │   │   │   └── route.ts
│   │   │   ├── cron/
│   │   │   ├── customer-profile/
│   │   │   │   ├── route.ts
│   │   │   │   └── addresses/
│   │   │   │       └── route.ts
│   │   │   ├── process-expired-items/
│   │   │   ├── products/
│   │   │   ├── signup/
│   │   │   └── users/
│   │   │       └── [id]/
│   │   │           ├── route.ts
│   │   │           ├── restore/
│   │   │           ├── role/
│   │   │           └── reset-password/
│   │   ├── auction/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   ├── notification/
│   │   │   └── page.tsx
│   │   ├── order-detail/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── unauthorized/
│   │   │   └── page.tsx
│   │   ├── ClientLayout.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── DashboardNavbar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── LogoutButton.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── RoleSelector.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── UsersTable.tsx
│   │   ├── auction-card.tsx
│   │   ├── auction-grid.tsx
│   │   ├── AuthForm.tsx
│   │   ├── buyer-form.tsx
│   │   ├── cart-sidebar.tsx
│   │   ├── check-order-dialog.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── flashsale-grid.tsx
│   │   ├── header.tsx
│   │   ├── OAuthButtons.tsx
│   │   ├── PeriodicProcessor.tsx
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── promotion-banner.tsx
│   │   ├── SessionProviderWrapper.tsx
│   │   └── Toast.tsx
│   ├── context/
│   │   └── cart-context.tsx
│   ├── hooks/
│   │   ├── use-cart.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── admin-helpers.ts
│   │   ├── auth.ts
│   │   ├── authSettings.ts
│   │   ├── avatarUtils.ts
│   │   ├── background-jobs.ts
│   │   ├── cart-db.ts
│   │   ├── mock-data.ts
│   │   ├── order-standards.ts
│   │   ├── placeholder-images.json
│   │   ├── placeholder-images.ts
│   │   ├── prisma.ts
│   │   ├── rbac.ts
│   │   ├── regions.ts
│   │   ├── security.ts
│   │   ├── self-protection.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── scripts/
│   ├── types/
│   └── [other type definition files]
├── tailwind.config.js
├── tsconfig.json
├── QWEN.md                  # Project documentation
├── RBAC_IMPLEMENTATION_SUMMARY.md
└── README.md


## Building and Running

### Prerequisites

- Node.js (v18 or higher)
- SQLite database (default) or PostgreSQL database
- pnpm package manager (recommended)

### Environment Variables

The application requires the following environment variables in a `.env` file:

- `DATABASE_URL`: SQLite or PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth JWT
- `NEXTAUTH_URL`: Application URL
- OAuth provider credentials (if enabled):
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`
  - `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`
- Additional configuration variables for payment time limits, business addresses, etc.

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
- Server actions are used for authenticated operations
- API routes handle data fetching and modification

## Key Files

- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth configuration with credentials and OAuth providers
- `src/app/api/signup/route.ts`: API route for user registration
- `src/app/api/users/[id]/route.ts`: API route for user profile management
- `src/app/api/users/[id]/role/route.ts`: API route to update user role
- `src/app/api/users/[id]/reset-password/route.ts`: API route to reset user password
- `src/app/api/users/[id]/restore/route.ts`: API route to restore soft-deleted user
- `src/app/api/cron/purge-deleted-users/route.ts`: Cron job to purge old deleted users
- `src/app/admin/users/page.tsx`: Server-side secured user list page
- `src/app/admin/users/UserListClient.tsx`: Client-side user list component with filtering and search
- `src/components/Toast.tsx`: Toast notification component for user feedback
- `src/lib/admin-helpers.ts`: Helper functions for superadmin user management
- `src/lib/auth.ts`: Authentication utilities including password validation and RBAC helpers
- `src/lib/authSettings.ts`: Configuration for enabling/disabling authentication providers
- `src/lib/rbac.ts`: Role-based access control (ACL) configuration and utilities
- `src/lib/security.ts`: Security utilities for input validation and sanitization
- `middleware.ts`: RBAC middleware to enforce role-based access control for routes
- `src/actions/userActions.ts`: Protected server actions with role-based permissions
- `prisma/schema.prisma`: Database schema definition with multiple related models
- `src/components/SessionProviderWrapper.tsx`: Wrapper for NextAuth session provider
- `src/components/ui/DashboardNavbar.tsx`: Navigation component for the application
- `src/app/checkout/page.tsx`: Complete checkout flow with address and shipping management
- `src/components/buyer-form.tsx`: Address form component used in checkout process

## Authentication Configuration

Authentication providers can be enabled/disabled via `src/lib/authSettings.ts`:

```typescript
export const authSettings = {
  providers: {
    credentials: true,     // Enable email/password authentication
    google: true,          // Enable Google OAuth
    facebook: false,       // Disable Facebook OAuth
    instagram: false,      // Disable Instagram OAuth,
  },
};
```

## Database Schema

The application uses a comprehensive Prisma schema with the following main models:

- **User**: Contains user information including authentication details, profile information, and roles
- **Address**: Contains user addresses with support for multiple addresses per user
- **Product**: Core product information with name, description, price, and weight
- **FlashSale**: Limited-time and limited-quantity sale items
- **Auction**: Auction items with bidding functionality
- **Bid**: Bid information associated with auctions
- **Order**: Order information including status, shipping, and payment details
- **OrderItem**: Individual items within an order
- **Cart**: User's shopping cart
- **CartItem**: Items in a user's cart
- **ShippingOption**: Shipping costs by location
- **RefundDetails**: Refund information for orders

## Security Features

- Passwords are hashed using bcrypt
- Authentication sessions are managed through JWT tokens
- OAuth providers are implemented following security best practices
- Input validation is performed during registration and on all data entry points
- Session protection using NextAuth's built-in security features
- RBAC system to control access to different parts of the application
- Server-side validation of all critical operations
- SQL injection protection through Prisma ORM
- XSS prevention through proper input sanitization

## RBAC (Role-Based Access Control) Implementation

The application includes a robust RBAC system with ACL (Access Control List) for fine-grained permission control:

###Roles
- **superadmin**: Has access to all resources and can manage ACL, user management, role assignments
- **admin**: Can access admin dashboard, product management, and order management
- **customer**: Can access profile, place orders, participate in auctions

###ACLConfiguration
- Defined in `src/lib/rbac.ts` with the following permissions:
  - superadmin: ["*"] (full access)
  - admin: ["dashboard", "admin"]
  - customer: ["profile"]

###ImplementationComponents
1. **NextAuth Integration**: Roles are stored in JWT and session via database lookup
2. **Middleware**: Enforces RBAC rules server-side for all protected routes
3. **Authorization Helpers**: Server-side functions in `src/lib/auth.ts` for checking permissions
4. **Server Actions Protection**: Server actions in `src/actions/` require proper roles
5. **API Route Protection**: API routes verify roles before executing operations
6. **Security Utilities**: Input validation and sanitization in `src/lib/security.ts`

###AccessControlFlow
1. User authenticates and role is retrieved from database
2. Role is stored in JWT and session
3. Middleware checks role against ACL for each route
4. Server-side functions verify permissions before executing operations
5. Unauthorized access redirects to `/unauthorized` page

This implementation ensures that all access control is enforced server-side, preventing client-side manipulation of permissions.