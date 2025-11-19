// src/components/AuthForm.tsx
'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OAuthButtons from '@/components/OAuthButtons'

type AuthFormType = 'signin' | 'signup'

interface AuthFormProps {
  type: AuthFormType
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (type === 'signup') {
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        })

        if (res.ok) {
          // Auto sign in after successful signup
          const signInRes = await signIn('credentials', {
            email,
            password,
            redirect: false,
          })

          if (signInRes?.ok) {
            router.push('/dashboard')
            router.refresh()
          } else {
            setError('Invalid credentials')
          }
        } else {
          const data = await res.json()
          setError(data.error || 'An error occurred')
        }
      } catch (error) {
        setError('An error occurred')
      }
    } else {
      // Signin
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid credentials')
      } else {
        // Get the user's role from the session to determine redirect
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();

        // Redirect based on user role
        if (session?.user?.role === 'customer') {
          router.push('/?login=success')
        } else {
          // Superadmin and admin go to dashboard
          router.push('/dashboard')
        }
        router.refresh()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mx-auto">
              {type === 'signup' ? 'Create your account' : 'Sign in to your account'}
            </h2>

            {error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {type === 'signup' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    required={type === 'signup'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-bordered"
                  />
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control mt-6">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {type === 'signup' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </form>

            {type === 'signin' && (
              <>
                <div className="divider">OR</div>
                <OAuthButtons callbackUrl="/dashboard" />
              </>
            )}

            <div className="text-center mt-4">
              {type === 'signin' ? (
                <p className="text-sm">
                  Don't have an account?{' '}
                  <a href="/signup" className="link link-primary">
                    Sign up
                  </a>
                </p>
              ) : (
                <p className="text-sm">
                  Already have an account?{' '}
                  <a href="/signin" className="link link-primary">
                    Sign in
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthForm