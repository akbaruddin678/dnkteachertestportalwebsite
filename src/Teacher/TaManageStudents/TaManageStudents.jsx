"use client"

import { useState, useEffect } from "react"


const ManageStudents = () => {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    course: "",
    status: "Active",
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = () => {
    const savedStudents = localStorage.getItem("students")
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents))
    } else {
      // Initialize with sample data
      const sampleStudents = [
        {
          id: 1,
          name: "Ethan Harper",
          email: "ethan.harper@email.com",
          course: "Data Science Fundamentals",
          status: "Active",
        },
        {
          id: 2,
          name: "Olivia Bennett",
          email: "olivia.bennett@email.com",
          course: "Machine Learning Basics",
          status: "Active",
        },
        {
          id: 3,
          name: "Noah Carter",
          email: "noah.carter@email.com",
          course: "Web Development Essentials",
          status: "Inactive",
        },
        {
          id: 4,
          name: "Ava Morgan",
          email: "ava.morgan@email.com",
          course: "Cybersecurity Fundamentals",
          status: "Active",
        },
        {
          id: 5,
          name: "Liam Foster",
          email: "liam.foster@email.com",
          course: "Web Development Bootcamp",
          status: "Active",
        },
      ]
      setStudents(sampleStudents)
      localStorage.setItem("students", JSON.stringify(sampleStudents))
    }
  }

  const saveStudents = (updatedStudents) => {
    localStorage.setItem("students", JSON.stringify(updatedStudents))
    setStudents(updatedStudents)
  }

  const handleAddStudent = () => {
    setFormData({ name: "", email: "", course: "", status: "Active" })
    setEditingStudent(null)
    setShowAddModal(true)
  }

  const handleEditStudent = (student) => {
    setFormData(student)
    setEditingStudent(student)
    setShowAddModal(true)
  }

  const handleDeleteStudent = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      const updatedStudents = students.filter((student) => student.id !== id)
      saveStudents(updatedStudents)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingStudent) {
      const updatedStudents = students.map((student) =>
        student.id === editingStudent.id ? { ...formData, id: editingStudent.id } : student,
      )
      saveStudents(updatedStudents)
    } else {
      const newStudent = {
        ...formData,
        id: Date.now(),
      }
      const updatedStudents = [...students, newStudent]
      saveStudents(updatedStudents)
    }
    setShowAddModal(false)
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <><style>{`.manage-students {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.add-btn {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.add-btn:hover {
  background-color: #1565c0;
}

.search-section {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.students-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.students-table table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th {
  background-color: #f8f9fa;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e9ecef;
}

.students-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.students-table tr:last-child td {
  border-bottom: none;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status.active {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  font-weight: 500;
}

.edit-btn {
  background-color: #e3f2fd;
  color: #1976d2;
}

.edit-btn:hover {
  background-color: #bbdefb;
}

.delete-btn {
  background-color: #ffebee;
  color: #c62828;
}

.delete-btn:hover {
  background-color: #ffcdd2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 20px;
  color: #333;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.form-actions button[type="button"] {
  background-color: #f5f5f5;
  color: #666;
}

.form-actions button[type="submit"] {
  background-color: #1976d2;
  color: white;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .students-table {
    overflow-x: auto;
  }

  .modal {
    margin: 20px;
    width: calc(100% - 40px);
  }
}
`}</style>
    <div className="manage-students">
      <div className="page-header">
        <h1>Manage Students</h1>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.course}</td>
                <td>
                  <span className={`status ${student.status.toLowerCase()}`}>{student.status}</span>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => handleEditStudent(student)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteStudent(student.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingStudent ? "Edit Student" : "Add New Student"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit">{editingStudent ? "Update" : "Add"} Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
</>
  )
}

export default ManageStudents
