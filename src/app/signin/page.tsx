// src/app/signin/page.tsx
import AuthForm from '@/components/AuthForm'

export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <AuthForm type="signin" />
    </div>
  )
}