'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f4f2ed',
        margin: 0,
        fontFamily: 'sans-serif',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 28, fontFamily: 'Georgia, serif', color: '#1a1a1f', marginBottom: 8 }}>
            fitted.
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1f', margin: '0 0 8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13.5, color: '#7a7a85', lineHeight: 1.6, margin: '0 0 24px' }}>
            An unexpected error occurred. Your data is safe — try refreshing or go back to the dashboard.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: '#b0b0b8', marginBottom: 20, fontFamily: 'monospace' }}>
              ref: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => unstable_retry()}
              style={{
                padding: '10px 20px',
                background: '#1a1a1f',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'sans-serif',
              }}
            >
              Try again
            </button>
            <a
              href="/home"
              style={{
                padding: '10px 20px',
                background: 'none',
                color: '#7a7a85',
                border: '1.5px solid #e8e4db',
                borderRadius: 10,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'none',
                fontFamily: 'sans-serif',
              }}
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
