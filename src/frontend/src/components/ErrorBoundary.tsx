import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0f9ff",
            padding: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "40px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>⚠️</div>
            <h2
              style={{
                color: "#0c4a6e",
                fontSize: "22px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "15px",
                marginBottom: "8px",
                lineHeight: "1.5",
              }}
            >
              An unexpected error occurred. Please try reloading the page.
            </p>
            {this.state.error && (
              <details
                style={{
                  marginBottom: "24px",
                  textAlign: "left",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "13px",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    marginBottom: "8px",
                    cursor: "pointer",
                  }}
                >
                  Error details
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: 0,
                    fontSize: "12px",
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: "#0ea5e9",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
