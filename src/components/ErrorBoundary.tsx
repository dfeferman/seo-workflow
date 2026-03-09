/**
 * React Error Boundary für unerwartete Fehler (500-ähnlich).
 * Step 15: Polish – robustes Error-Handling.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6"
          role="alert"
        >
          <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-red/10 flex items-center justify-center text-red-600 text-2xl mx-auto mb-4">
              ⚠
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Du kannst zur Startseite
              wechseln und es erneut versuchen.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Zur Startseite
            </Link>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-6 p-4 rounded-lg bg-slate-100 text-left text-xs text-slate-500 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
