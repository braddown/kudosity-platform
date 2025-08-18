'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DebugSimplePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/debug-account')
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Information</h1>
      
      <h2>Authentication Status</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      
      <div style={{ marginTop: '20px' }}>
        {!data?.authenticated && (
          <div>
            <p>You are not authenticated.</p>
            <button 
              onClick={() => router.push('/auth/login')}
              style={{ 
                padding: '10px 20px', 
                marginRight: '10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
            <button 
              onClick={() => router.push('/auth/signup')}
              style={{ 
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Sign Up
            </button>
          </div>
        )}
        
        {data?.authenticated !== false && data?.user && (
          <div>
            <p>Logged in as: {data.user.email}</p>
            <p>User ID: {data.user.id}</p>
            <p>Memberships: {data.membershipCount || 0}</p>
            
            {data.middlewareWouldRedirect && (
              <div style={{ marginTop: '20px', padding: '10px', background: '#fff3cd', border: '1px solid #ffc107' }}>
                <p>⚠️ You have no account memberships. You need to create an account.</p>
                <button 
                  onClick={() => router.push('/auth/setup-account')}
                  style={{ 
                    padding: '10px 20px',
                    marginTop: '10px',
                    background: '#ffc107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Go to Account Setup
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
