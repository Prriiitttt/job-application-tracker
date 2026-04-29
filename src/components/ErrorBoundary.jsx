import React from "react";
import "./ErrorBoundary.css";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({ error: this.state.error, reset: this.handleReset });
      }
      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong</h2>
          <p>{this.props.scope || "This part of the app"} hit an unexpected error.</p>
          <div className="error-boundary-actions">
            <button type="button" onClick={this.handleReset}>
              Try again
            </button>
            <button type="button" onClick={() => window.location.assign("/")}>
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
