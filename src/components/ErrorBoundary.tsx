import { Component, type ReactNode, type ErrorInfo } from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Renderer error:', error, errorInfo);
    toast.error('Prišlo je do napake v aplikaciji.');
  }

  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="glass max-w-lg w-full rounded-3xl border border-border/70 shadow-card p-8 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-inner">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div className="space-y-2 text-left">
                <div className="text-xl font-semibold text-foreground">Prišlo je do napake</div>
                <p className="text-sm text-muted-foreground">{this.state.message ?? 'Nekaj je šlo narobe. Poskusite znova.'}</p>
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={this.handleReload} variant="primary">
                    Osveži aplikacijo
                  </Button>
                  <Button variant="ghost" onClick={() => this.setState({ hasError: false })}>
                    Skrij sporočilo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
