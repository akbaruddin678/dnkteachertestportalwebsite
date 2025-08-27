import React, { useState } from 'react';
import './Attendance.css';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([
    { id: 1, name: 'Ali Raza', status: 'Present' },
    { id: 2, name: 'Fatima Noor', status: 'Absent' },
    { id: 3, name: 'Hassan Shah', status: 'Present' },
  ]);

  return (
    <div className="attendance-container">
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
  );
};

export default Attendance;
