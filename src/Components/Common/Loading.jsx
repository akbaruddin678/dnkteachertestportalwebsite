import React from "react";
import "./Loading.css"; // We'll create this CSS file

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h2>DNK LMS is Loading</h2>
      <p>Please wait while we prepare your learning environment...</p>
      <div className="loading-progress">
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
