import React, { useRef, useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonButton, IonIcon } from '@ionic/react';
import { camera, stop } from 'ionicons/icons';
import QRCode from 'qrcode.react';
import '../QrAttendance.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const QrAttendanceContent: React.FC = () => {
  // Static QR value that the backend expects
  const qrValue = 'ACTIVECORE_GYM_ATTENDANCE';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [manualQr, setManualQr] = useState<string>('');

  useEffect(() => {
    // Clean up camera & requests on unmount
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScan = async () => {
    setMessage(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage('Your browser does not support camera access.');
      setMessageType('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Prepare Barcode Detector if available
      if ((window as any).BarcodeDetector) {
        try {
          detectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        } catch (e) {
          detectorRef.current = null;
        }
      } else {
        detectorRef.current = null;
      }

      setScanning(true);
      scanLoop();
    } catch (err: any) {
      console.error('Camera error', err);
      setMessage('Could not access camera. Make sure you allowed permission.');
      setMessageType('error');
    }
  };

  const stopScan = () => {
    setScanning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        // clear srcObject to release camera
        // @ts-ignore
        videoRef.current.srcObject = null;
      } catch (e) {
        // ignore
      }
    }
  };

  const scanLoop = async () => {
    if (!scanning) return;
    if (!videoRef.current) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    try {
      // Prefer BarcodeDetector API if available
      if (detectorRef.current) {
        const results = await detectorRef.current.detect(videoRef.current);
        if (results && results.length > 0) {
          const code = results[0].rawValue || results[0].displayValue;
          if (code) {
            await handleDetected(code);
            return;
          }
        }
      } else {
        // Fallback: draw video frame to canvas and attempt to decode with detector (if it accepts imageBitmap)
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx && videoRef.current && videoRef.current.videoWidth > 0) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            if ((window as any).BarcodeDetector) {
              try {
                const results = await (new (window as any).BarcodeDetector({ formats: ['qr_code'] })).detect(canvasRef.current);
                if (results && results.length > 0) {
                  const code = results[0].rawValue || results[0].displayValue;
                  if (code) {
                    await handleDetected(code);
                    return;
                  }
                }
              } catch (e) {
                // ignore detector issues
              }
            }
            // If no detector available, we cannot decode reliably without adding a 3rd-party library
          }
        }
      }
    } catch (err) {
      console.error('SCAN loop error', err);
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  };

  const handleDetected = async (value: string) => {
    // stop scanning then call check-in
    stopScan();
    await doCheckIn(value);
  };

  const doCheckIn = async (qrValueDetected: string) => {
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('You must be logged in to check in.');
        setMessageType('error');
        return;
      }

      const res = await fetch(`${API_BASE}/attendance/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrToken: qrValueDetected }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      // Determine success based on response JSON first (backend may return non-2xx but still recorded)
      const dataIndicatesSuccess =
        !!data &&
        (data.success === true ||
          data.success === 'true' ||
          data.recorded === true ||
          data.status === 'success' ||
          data.ok === true ||
          (typeof data.message === 'string' && /success/i.test(data.message)));

      if (dataIndicatesSuccess) {
        setMessage(data?.message || 'Check-in successful');
        setMessageType('success');
        try {
          window.dispatchEvent(new CustomEvent('attendance:updated', { detail: data }));
        } catch (e) {
          // ignore
        }
        return;
      }

      // Fallback to res.ok if there's no JSON success field but request returned 2xx
      if (res.ok) {
        setMessage(data?.message || 'Check-in successful');
        setMessageType('success');
        try {
          window.dispatchEvent(new CustomEvent('attendance:updated', { detail: data }));
        } catch (e) {
          // ignore
        }
        return;
      }

      // Show error otherwise
      if (data && data.message) {
        setMessage(data.message);
      } else {
        setMessage(`Check-in failed (${res.status})`);
      }
      setMessageType('error');
    } catch (err: any) {
      console.error('Check-in error', err);
      setMessage('Check-in failed: network error');
      setMessageType('error');
    }
  };

  const manualCheckin = async () => {
    if (!manualQr) {
      setMessage('Please enter a QR code value.');
      setMessageType('error');
      return;
    }
    await doCheckIn(manualQr);
  };

  return (
    <div className="qrattendance-container" style={{ padding: '2rem' }}>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
        QR Code Attendance
      </h2>

      <IonCard className="stat-card">
        <IonCardContent>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-color)', margin: 0 }}>
            Show this QR code to members for check-in
          </h3>
        </IonCardContent>
      </IonCard>

      <div className="qrattendance-wrapper" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block' }}>
          <QRCode value={qrValue} size={256} level="H" includeMargin />
        </div>

        <div style={{ marginTop: '1rem' }}>
          {!scanning ? (
            <IonButton color="primary" onClick={startScan} aria-label="Start scanning">
              <IonIcon icon={camera} slot="start" /> Start Scan (use camera to scan this QR)
            </IonButton>
          ) : (
            <IonButton color="danger" onClick={stopScan} aria-label="Stop scanning">
              <IonIcon icon={stop} slot="start" /> Stop Scan
            </IonButton>
          )}
        </div>

        {/* Camera preview / canvas for scanning */}
        <div style={{ marginTop: '1rem' }}>
          {scanning && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <video ref={videoRef} style={{ width: 320, height: 240, borderRadius: 8 }} muted playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}
        </div>

        {/* Manual check-in fallback */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <input
              placeholder="Paste / enter QR value (fallback)"
              value={manualQr}
              onChange={(e) => setManualQr(e.target.value)}
              style={{ padding: '0.6rem', width: 340, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <IonButton onClick={manualCheckin}>Check-in</IonButton>
          </div>
        </div>

        <div style={{ marginTop: '1rem', minHeight: 28 }}>
          {message && (
            <div
              style={{
                color: messageType === 'success' ? 'var(--ion-color-success)' : 'var(--ion-color-danger)',
                fontWeight: 500,
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrAttendanceContent;