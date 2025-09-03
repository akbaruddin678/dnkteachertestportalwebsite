import React from "react";

const Dashboard = () => {
  return (
    <>
      <style>{`
        .dashboard-wrapper {
          display: flex;
          justify-content: center;   
          align-items: center;      
          min-height: 100vh;         
          background: #f0f2f5;      
        }
        .dashboard {
          padding: 20px;
          max-width: 1200px;
          background: linear-gradient(45deg, #f4f8fc, #e0f7fa);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          font-family: 'Poppins', sans-serif;
          text-align: center;
        }
      `}</style>

      <div className="dashboard-wrapper">
        <div className="dashboard">
          <h1>Welcome to NCLEX Admin Dashboard! Soon!</h1>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
