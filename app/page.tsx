"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { Logo } from "@/components/Logo"

export default function Home() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const auth = sessionStorage.getItem("isAuthenticated")
    setIsAuthenticated(auth === "true")

    // Check Supabase connection
    if (!supabase) {
      setSupabaseStatus("Supabase client is not initialized. Please check your environment variables.")
    } else {
      // Test the connection
      const testConnection = async () => {
        try {
          const { data, error } = await supabase.from("logs").select("id").limit(1)
          if (error) {
            console.error("Supabase connection error:", error)
            setSupabaseStatus(`Supabase connection error: ${error.message}. Please check your API key and URL.`)
          }
        } catch (err) {
          console.error("Error testing Supabase connection:", err)
          setSupabaseStatus(`Error connecting to Supabase: ${err.message}. Please check your environment variables.`)
        }
      }
      testConnection()
    }
  }, [])

  // Apply automatic theme scheduling on login page
  useEffect(() => {
    if (!mounted) return

    // Check if user has manually set a theme preference
    const manualTheme = localStorage.getItem("manual-theme-override")
    if (manualTheme) {
      setTheme(manualTheme)
      return // Don't auto-schedule if user has manual override
    }

    // Apply time-based theme if no manual override
    const now = new Date()
    const hour = now.getHours()
    const shouldBeDark = hour >= 18 || hour < 7
    const targetTheme = shouldBeDark ? "dark" : "light"

    if (theme !== targetTheme) {
      setTheme(targetTheme)
    }
  }, [mounted, setTheme, theme])

  // Redirect to /overview if authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      router.push("/overview")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "kudosity") {
      sessionStorage.setItem("isAuthenticated", "true")
      setIsAuthenticated(true)
      // Will redirect in the useEffect above
    } else {
      setError("Incorrect password")
    }
  }

  if (!mounted) {
    return null
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    )
  }

  // Add this after the existing authentication check
  if (isAuthenticated && supabaseStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-center text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Database Connection Error
            </h2>
            <p className="text-center mb-4 text-gray-700 dark:text-gray-300">{supabaseStatus}</p>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Please create a .env.local file with your Supabase credentials and restart the application.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            {/* Logo and Branding */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center mb-8">
                <Logo className="h-16 w-auto" width={320} height={86} />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Welcome back</h1>
              <p className="text-gray-600 dark:text-gray-400">Enter your password to continue</p>
            </div>

            {/* Login Form */}
            <div className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-8 shadow-xl dark:shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter your password"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign In
                </Button>
              </form>

              {/* Demo Info */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">Demo Access</p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm">
                      Use password:{" "}
                      <code className="bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded font-mono">kudosity</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">© 2024 Kudosity. All rights reserved.</p>
        </div>
      </div>
    )
  }

  // This will only show briefly during redirect
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Signing you in...</p>
      </div>
    </div>
  )
}
