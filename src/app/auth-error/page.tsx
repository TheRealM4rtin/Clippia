'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const description = searchParams.get('description')

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="window" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="title-bar">
          <div className="title-bar-text">Authentication Error</div>
        </div>
        <div className="window-body">
          <div className="field-row-stacked" style={{ textAlign: 'center' }}>
            <h4>An error occurred during authentication</h4>
            
            {error && (
              <div className="field-row" style={{ justifyContent: 'center' }}>
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            
            {description && (
              <div className="field-row" style={{ justifyContent: 'center' }}>
                <p><strong>Details:</strong> {description}</p>
              </div>
            )}

            <div className="field-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button onClick={() => router.push('/')}>
                Return to Home
              </button>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
              You will be automatically redirected in 5 seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Loading...</div>
          </div>
          <div className="window-body">
            <p>Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}