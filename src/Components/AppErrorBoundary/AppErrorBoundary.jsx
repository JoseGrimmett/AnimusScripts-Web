import { Component } from 'react';
import './AppErrorBoundary.css';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ui-error-boundary] Application render failed', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <main className="app-error-boundary" role="alert">
        <section className="app-error-boundary__card">
          <p className="app-error-boundary__eyebrow">Something interrupted this page</p>
          <h1>We couldn&apos;t finish loading the workspace.</h1>
          <p>
            Reload the page to try again. If the problem continues, the technical
            message below will help us identify the exact component that failed.
          </p>
          {import.meta.env.DEV && (
            <pre className="app-error-boundary__detail">{error.message}</pre>
          )}
          <div className="app-error-boundary__actions">
            <button type="button" onClick={this.handleReload}>Reload page</button>
            <a href="/">Return to website</a>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
