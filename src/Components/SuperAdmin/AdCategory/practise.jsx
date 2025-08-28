const CampusesView = memo(() => {
  const filteredCampuses = filterItems(data.campuses, "campus");

  if (selectedCampus) {
    return (
      <div className="view-container">
        <div className="view-header">
          <h2>
            <FaUniversity /> Campus Details
          </h2>
          <button
            className="secondary-button"
            onClick={() => setSelectedCampus(null)}
          >
            Back to Campuses
          </button>
        </div>
        <div className="campus-details">
          <div className="campus-info">
            <h3>{selectedCampus.name}</h3>
            <p>
              <strong>Location:</strong> {selectedCampus.location || "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {selectedCampus.address || "N/A"}
            </p>
            <p>
              <strong>Contact Number:</strong>{" "}
              {selectedCampus.contactNumber || "N/A"}
            </p>
          </div>

          <div className="coordinators-section">
            <div className="section-header">
              <h3>Campus Coordinators</h3>
              <button
                className="primary-button small-button"
                onClick={() => {
                  // You'll need to implement this handler
                  handleAddCoordinator(selectedCampus._id);
                }}
              >
                <FaPlus /> Add Coordinator
              </button>
            </div>

            {selectedCampus.coordinators?.length > 0 ? (
              <table className="coordinators-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCampus.coordinators.map((coordinator) => (
                    <tr key={`coordinator-${coordinator._id}`}>
                      <td>{coordinator.name}</td>
                      <td>{coordinator.user?.email || "N/A"}</td>
                      <td>{coordinator.contactNumber || "N/A"}</td>
                      <td>
                        <button
                          className="edit-button"
                          onClick={() => handleEditCoordinator(coordinator)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="danger-button"
                          onClick={() => deleteCoordinator(coordinator._id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-coordinators">
                No coordinators assigned to this campus
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ... rest of your existing CampusesView code ...
});
