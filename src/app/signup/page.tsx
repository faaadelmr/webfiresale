// src/app/signup/page.tsx
import AuthForm from '@/components/AuthForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <AuthForm type="signup" />
    </div>
  )
}