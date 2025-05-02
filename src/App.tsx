
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, ReactNode } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Global error boundary component
class AppErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean, errorInfo: string}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, errorInfo: "" };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Application error:", error, errorInfo);
    this.setState({ errorInfo: error.toString() });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops, something went wrong</h1>
            <p className="mb-4 text-slate-600">The application encountered an error. Please try refreshing the page.</p>
            <pre className="bg-slate-100 p-3 text-left text-xs overflow-auto max-h-40 rounded mb-4">
              {this.state.errorInfo}
            </pre>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fix the missing React import
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Make sure all resources are loaded before rendering the app
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return (
    <AppErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="vision-whisper-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
};

export default App;
