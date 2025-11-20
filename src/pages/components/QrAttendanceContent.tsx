import React from 'react';
import { IonCard, IonCardContent } from '@ionic/react';
import QRCode from 'qrcode.react';
import '../QrAttendance.css';

const QrAttendanceContent: React.FC = () => {
  // Use a static QR value that the backend expects
  const qrValue = "ACTIVECORE_GYM_ATTENDANCE";

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
        <QRCode
          value={qrValue}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>
    </div>
  );
};

export default QrAttendanceContent;