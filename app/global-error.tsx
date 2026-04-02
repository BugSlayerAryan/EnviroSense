'use client'

export const dynamic = 'force-dynamic'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <head>
        <style>{`
          body {
            margin: 0;
            padding: 2rem;
            font-family: system-ui, -apple-system, sans-serif;
            background: white;
          }
          .error-container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
          }
          h1 {
            font-size: 2rem;
            font-weight: bold;
            margin: 0 0 1rem 0;
            color: #1a1a1a;
          }
          p {
            margin-top: 0.5rem;
            color: #666;
            font-size: 1rem;
          }
          button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #2E8A67;
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-weight: 500;
            font-size: 1rem;
          }
          button:hover {
            opacity: 0.9;
          }
        `}</style>
      </head>
      <body>
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
