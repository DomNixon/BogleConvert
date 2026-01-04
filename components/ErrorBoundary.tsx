/*
 * Copyright (c) 2026 Mid Michigan Connections LLC.
 * This file is part of BogleConvert.
 *
 * BogleConvert is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * BogleConvert is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with BogleConvert. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('React Error Boundary caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-bg-dark">
                    <div className="max-w-md text-center p-8 bg-surface border border-outline rounded-xl">
                        <div className="mb-6">
                            <span className="material-symbols-outlined text-6xl text-negative">error</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">Something Went Wrong</h1>
                        <p className="text-muted mb-6 leading-relaxed">
                            The application encountered an unexpected error.
                            Your portfolio data is safely stored in your browser.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Reload Application
                            </button>
                            <details className="text-left">
                                <summary className="text-sm text-muted cursor-pointer hover:text-white">
                                    Error Details
                                </summary>
                                <pre className="mt-2 p-3 bg-bg-dark rounded text-xs text-negative overflow-auto max-h-40">
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
