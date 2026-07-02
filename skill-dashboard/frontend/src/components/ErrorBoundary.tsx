import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

// Captura errores de render en cualquier parte del árbol y muestra un fallback
// en vez de dejar la pantalla en blanco (mejora clave de robustez de la UI).
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || "Error desconocido" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center bg-surface-900 border border-surface-700/50 rounded-2xl p-8 shadow-xl">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-surface-100 mb-2">Algo salió mal</h2>
            <p className="text-sm text-surface-400 mb-5 break-words">{this.state.message}</p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Recargar la aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
