import { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EXAMPLE_HASHES = [
  {
    label: 'Simple ETH transfer',
    hash: '0x5d15efb531e26957f3f9d1cb5794e4b2b5a7ab8e5b0f1f3c9c8f4a6c8b1e2d3f',
  },
];

const RISK_STYLES = {
  LOW: { bg: '#e8f8f0', border: '#2ecc71', text: '#1a7a45' },
  MEDIUM: { bg: '#fef6e7', border: '#f39c12', text: '#8a5a00' },
  HIGH: { bg: '#fdecea', border: '#e74c3c', text: '#a3271a' },
};

export default function App() {
  const [txHash, setTxHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!txHash) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: txHash.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') analyze();
  };

  const risk = result?.explanation?.risk_level;
  const riskStyle = RISK_STYLES[risk] || RISK_STYLES.LOW;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔍 Explain This Transaction</h1>
        <p style={styles.subtitle}>
          Paste any Ethereum transaction hash. AI decodes it and tells you what it
          actually does — in plain English, before you get scammed by it.
        </p>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            placeholder="0x1234...abcd (transaction hash)"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            style={{ ...styles.button, opacity: loading || !txHash ? 0.6 : 1 }}
            onClick={analyze}
            disabled={loading || !txHash}
          >
            {loading ? 'Analyzing…' : 'Explain'}
          </button>
        </div>

        <div style={styles.examples}>
          Try:{' '}
          {EXAMPLE_HASHES.map((ex) => (
            <button
              key={ex.hash}
              style={styles.exampleChip}
              onClick={() => setTxHash(ex.hash)}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {loading && (
          <div style={styles.loadingBox}>
            Fetching transaction data and asking the AI to analyze it…
          </div>
        )}

        {result && (
          <div style={styles.resultBox}>
            <div
              style={{
                ...styles.riskBadge,
                background: riskStyle.bg,
                border: `1px solid ${riskStyle.border}`,
                color: riskStyle.text,
              }}
            >
              {risk} RISK
            </div>

            <p style={styles.summary}>{result.explanation.summary}</p>

            {result.explanation.key_actions?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>What it does</div>
                <ul style={styles.list}>
                  {result.explanation.key_actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.explanation.risk_reasons?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Why this risk level</div>
                <ul style={styles.list}>
                  {result.explanation.risk_reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <details style={styles.rawDetails}>
              <summary>Raw transaction data</summary>
              <pre style={styles.pre}>{JSON.stringify(result.txData, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f1115',
    display: 'flex',
    justifyContent: 'center',
    padding: '48px 16px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 640,
    background: '#181b21',
    borderRadius: 16,
    padding: 32,
    color: '#e6e6e6',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  },
  title: { margin: 0, fontSize: 24 },
  subtitle: { color: '#9aa0a6', fontSize: 14, marginTop: 8, marginBottom: 24, lineHeight: 1.5 },
  inputRow: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #2a2e37',
    background: '#0f1115',
    color: '#e6e6e6',
    outline: 'none',
  },
  button: {
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    background: '#4f8cff',
    color: 'white',
    cursor: 'pointer',
  },
  examples: { marginTop: 12, fontSize: 12, color: '#9aa0a6' },
  exampleChip: {
    background: '#20242c',
    border: '1px solid #2a2e37',
    color: '#c7cbd1',
    borderRadius: 20,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    marginLeft: 6,
  },
  errorBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    background: '#2a1414',
    color: '#ff8a80',
    fontSize: 14,
  },
  loadingBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    background: '#1a2230',
    color: '#8ab4ff',
    fontSize: 14,
  },
  resultBox: { marginTop: 24, paddingTop: 20, borderTop: '1px solid #2a2e37' },
  riskBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  summary: { marginTop: 16, fontSize: 15, lineHeight: 1.6, color: '#e6e6e6' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9aa0a6', marginBottom: 6 },
  list: { margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 },
  rawDetails: { marginTop: 20, fontSize: 12, color: '#9aa0a6', cursor: 'pointer' },
  pre: {
    marginTop: 8,
    background: '#0f1115',
    padding: 12,
    borderRadius: 8,
    overflowX: 'auto',
    fontSize: 11,
    color: '#c7cbd1',
  },
};
