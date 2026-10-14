import React from 'react';

// Shows the real error on screen instead of a blank page.
export default class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error, info) { console.error('MaatriCare crashed:', error, info); }
    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui', background: '#fdeaea', borderRadius: 16, color: '#8e1f1f' }}>
                <h2>Something went wrong</h2>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}</pre>
                <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} style={{ padding: '8px 16px', borderRadius: 999, border: 0, background: '#e0527f', color: '#fff', cursor: 'pointer' }}>Reset and reload</button>
            </div>
        );
    }
}
