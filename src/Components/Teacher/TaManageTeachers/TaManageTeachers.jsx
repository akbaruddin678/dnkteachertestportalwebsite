"use client"

import { useState, useEffect } from "react"
import "./TaManageTeachers.css"

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
  )
}

export default ManageTeachers
