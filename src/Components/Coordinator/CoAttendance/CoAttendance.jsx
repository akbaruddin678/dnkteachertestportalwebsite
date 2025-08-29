import React, { useState } from 'react';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([
    { id: 1, name: 'Ali Raza', status: 'Present' },
    { id: 2, name: 'Fatima Noor', status: 'Absent' },
    { id: 3, name: 'Hassan Shah', status: 'Present' },
  ]);

  return (
    <>
    <style>{`
    .attendance-container {
  padding: 2rem;
  font-family: 'Segoe UI', sans-serif;
  color: #1f2937;
}

.attendance-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.05);
}

.attendance-table th,
.attendance-table td {
  padding: 12px 18px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
}

.attendance-table th {
  background-color: #f9fafb;
  color: #111827;
  font-weight: 600;
}

.present {
  color: #05b859;
  font-weight: bold;
}

.absent {
  color: #ef4444;
  font-weight: bold;
}

    `}</style>
    <div style={{
      // Styling shoud here
    }} className="attendance-container">
      <h2 className="attendance-title">Attendance</h2>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Sr#</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.map((student, index) => (
            <tr key={student.id}>
              <td>{index + 1}</td>
              <td>{student.name}</td>
              <td className={student.status === 'Present' ? 'present' : 'absent'}>
                {student.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default Attendance;
