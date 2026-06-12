export default function VercelPage() {
  const buildDate = '6/12/2026';
  const buildTime = '9:16 AM (GMT+6)';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'monospace',
      background: '#0a0a0a',
      color: '#fff',
    }}>
      <div style={{
        textAlign: 'center',
        padding: 40,
        borderRadius: 16,
        background: '#111',
        border: '1px solid #333',
        minWidth: 350,
      }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>🚀 Wevoro QA</h1>
        <p style={{ color: '#888', marginBottom: 24 }}>Deployment Check</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Build Date:</span>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{buildDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Build Time:</span>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{buildTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
