"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export interface OasisErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  error: Error | null;
}

export class OasisErrorBoundary extends Component<OasisErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("OasisErrorBoundary", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (typeof fallback === "function") return fallback(error, this.reset);
      if (fallback) return fallback;
      return (
        <div className="oasis-alert oasis-alert--error" data-oasis="error-boundary">
          <strong>Une erreur est survenue</strong>
          <p>{error.message}</p>
          <button
            type="button"
            className="oasis-btn oasis-btn--outline oasis-btn--sm"
            onClick={this.reset}
          >
            Réessayer
          </button>
        </div>
      );
    }

    return children;
  }
}
