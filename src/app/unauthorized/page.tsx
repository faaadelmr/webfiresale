// src/app/unauthorized/page.tsx
import { redirect } from 'next/navigation';

export default function UnauthorizedPage() {
  // Redirect to homepage immediately
  redirect('/');
}
