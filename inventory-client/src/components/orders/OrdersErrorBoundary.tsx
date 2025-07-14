import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class OrdersErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("訂單頁面錯誤:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">訂單頁面載入失敗</h2>
          <p className="text-muted-foreground text-center mb-4">
            {this.state.error?.message || "發生未預期的錯誤"}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-muted rounded-lg max-w-2xl w-full">
              <summary className="cursor-pointer font-medium">錯誤詳情</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {this.state.error.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            className="mt-4"
          >
            重新載入頁面
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}