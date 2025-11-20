import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
const API = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const PaymentReturn: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [status, setStatus] = useState('Verifying payment...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sourceId = params.get('sourceId');
    if (!sourceId) { setStatus('No payment reference'); return; }
    (async () => {
      const res = await fetch(`${API}/payments/paymongo/verify?sourceId=${encodeURIComponent(sourceId)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatus(`Payment status: ${json.status}`);
        if (json.status === 'completed') setTimeout(() => history.push('/member'), 2000);
      } else setStatus('Unable to verify payment; contact support.');
    })();
  }, [location.search, history]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Payment Status</h2>
      <p>{status}</p>
    </div>
  );
};
export default PaymentReturn;