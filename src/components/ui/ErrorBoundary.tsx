import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error boundary catch:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-ink-primary">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Medexa encountered an unexpected display error. Reload the page to restore your session.
          </p>
          <Button className="mt-5" onClick={() => window.location.reload()}>
            Reload Application
          </Button>
        </main>
      );
    }

    return this.props.children;
  }
}
