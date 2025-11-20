import React, { useEffect, useState } from 'react';
import '../MyAttendance.css';

const MyAttendanceContent: React.FC = () => {
  const [attendance, setAttendance] = useState<string[]>([]);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser") || "demo_member";
    const data = JSON.parse(localStorage.getItem("attendance") || "{}");
    if (data[currentUser] && Array.isArray(data[currentUser].attendance)) {
      setAttendance(data[currentUser].attendance);
    }
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2 className="attendance-title">My Attendance History</h2>
      <ul className="attendance-list">
        {attendance.length > 0 ? (
          attendance.map((day, index) => (
            <li key={index}>✅ {day}</li>
          ))
        ) : (
          <li>No attendance records yet.</li>
        )}
      </ul>
    </div>
  );
};

export default MyAttendanceContent;