"use client"

import { useState, useEffect } from "react"

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    courses: "",
    status: "Active",
  })

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = () => {
    const savedTeachers = localStorage.getItem("teachers")
    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers))
    } else {
      // Initialize with sample data
      const sampleTeachers = [
        {
          id: 1,
          name: "Dr. Eleanor Harper",
          email: "eleanor.harper@example.com",
          courses: "Data Science Fundamentals",
          status: "Active",
        },
        {
          id: 2,
          name: "Prof. Samuel Bennett",
          email: "samuel.bennett@example.com",
          courses: "Machine Learning Applications",
          status: "Active",
        },
        {
          id: 3,
          name: "Ms. Olivia Carter",
          email: "olivia.carter@example.com",
          courses: "Software Engineering Principles",
          status: "Inactive",
        },
        {
          id: 4,
          name: "Mr. Ethan Davis",
          email: "ethan.davis@example.com",
          courses: "Cybersecurity Essentials",
          status: "Active",
        },
        {
          id: 5,
          name: "Dr. Sophia Evans",
          email: "sophia.evans@example.com",
          courses: "Cloud Computing Architectures",
          status: "Active",
        },
      ]
      setTeachers(sampleTeachers)
      localStorage.setItem("teachers", JSON.stringify(sampleTeachers))
    }
  }

  const saveTeachers = (updatedTeachers) => {
    localStorage.setItem("teachers", JSON.stringify(updatedTeachers))
    setTeachers(updatedTeachers)
  }

  const handleAddTeacher = () => {
    setFormData({ name: "", email: "", courses: "", status: "Active" })
    setEditingTeacher(null)
    setShowAddModal(true)
  }

  const handleEditTeacher = (teacher) => {
    setFormData(teacher)
    setEditingTeacher(teacher)
    setShowAddModal(true)
  }

  const handleDeleteTeacher = (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      const updatedTeachers = teachers.filter((teacher) => teacher.id !== id)
      saveTeachers(updatedTeachers)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingTeacher) {
      const updatedTeachers = teachers.map((teacher) =>
        teacher.id === editingTeacher.id ? { ...formData, id: editingTeacher.id } : teacher,
      )
      saveTeachers(updatedTeachers)
    } else {
      const newTeacher = {
        ...formData,
        id: Date.now(),
      }
      const updatedTeachers = [...teachers, newTeacher]
      saveTeachers(updatedTeachers)
    }
    setShowAddModal(false)
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.courses.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <><style>{`.manage-teachers {
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

.teachers-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.teachers-table table {
  width: 100%;
  border-collapse: collapse;
}

.teachers-table th {
  background-color: #f8f9fa;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e9ecef;
}

.teachers-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.teachers-table tr:last-child td {
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

  .teachers-table {
    overflow-x: auto;
  }

  .modal {
    margin: 20px;
    width: calc(100% - 40px);
  }
}
`}</style>
    <div className="manage-teachers">
      <div className="page-header">
        <h1>Manage Teachers</h1>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="teachers-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Courses</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.courses}</td>
                <td>
                  <span className={`status ${teacher.status.toLowerCase()}`}>{teacher.status}</span>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => handleEditTeacher(teacher)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteTeacher(teacher.id)}>
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
            <h2>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h2>
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
                <label>Courses</label>
                <input
                  type="text"
                  value={formData.courses}
                  onChange={(e) => setFormData({ ...formData, courses: e.target.value })}
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
                <button type="submit">{editingTeacher ? "Update" : "Add"} Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
</>

  )
}

export default ManageTeachers
