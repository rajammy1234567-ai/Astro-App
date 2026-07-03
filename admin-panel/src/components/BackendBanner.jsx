import { useEffect, useState } from 'react';

export default function BackendBanner() {
  const [ok, setOk] = useState(true);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      setOk(res.ok);
    } catch {
      setOk(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, []);

  if (ok) return null;

  return (
    <div className="backend-banner">
      <span>⚠️ Backend server band hai — buttons kaam nahi karenge. Terminal mein: <code>cd server && npm run dev</code></span>
      <button type="button" className="btn-sm btn-outline" onClick={check} disabled={checking}>
        {checking ? 'Checking...' : 'Retry'}
      </button>
    </div>
  );
}