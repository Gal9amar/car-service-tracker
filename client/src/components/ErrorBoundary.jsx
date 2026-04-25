import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-3">
            משהו השתבש
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mb-2 text-sm font-mono">
            {this.state.error?.message}
          </p>
          <p className="text-surface-400 dark:text-surface-500 mb-8 text-sm">
            ניתן לנסות לרענן את הדף, אם הבעיה חוזרת אנא צור קשר.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            רענן דף
          </button>
        </div>
      </div>
    );
  }
}
