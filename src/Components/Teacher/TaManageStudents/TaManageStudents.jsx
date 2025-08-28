"use client"

import { useState, useEffect } from "react"
import "./TaManageStudents.css"

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
  )
}

export default ManageStudents
