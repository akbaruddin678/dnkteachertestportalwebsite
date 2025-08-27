import React from "react";
import "./HelpAndDocs.css";
import {
  MdEmail,
  MdHelpOutline,
  MdBook,
  MdQuestionAnswer,
} from "react-icons/md";

const HelpAndDocs = () => {
  return (
    <div className="help-docs-container">
      <h1>Help & Documentation</h1>
      <p>
        Welcome to the Nclex LMS Help Center. Here you can find resources and
        support to assist you.
      </p>

      <div className="help-sections">
        <div className="help-card">
          <MdBook className="help-icon" />
          <h3>User Guide</h3>
          <p>
            Step-by-step instructions for using the LMS features as a Super
            Admin, Teacher, or Coordinator.
          </p>
          <a
            href="/docs/user-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Guide
          </a>
        </div>

        <div className="help-card">
          <MdQuestionAnswer className="help-icon" />
          <h3>FAQs</h3>
          <p>
            Find answers to the most common questions about Nclex LMS
            functionality.
          </p>
          <a href="/docs/faqs.pdf" target="_blank" rel="noopener noreferrer">
            Read FAQs
          </a>
        </div>

        <div className="help-card">
          <MdHelpOutline className="help-icon" />
          <h3>Troubleshooting</h3>
          <p>Solutions for login issues, navigation problems, and more.</p>
          <a
            href="/docs/troubleshooting.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Start Troubleshooting
          </a>
        </div>

        <div className="help-card">
          <MdEmail className="help-icon" />
          <h3>Contact Support</h3>
          <p>If you still need help, contact our technical support team.</p>
          <a href="mailto:support@Nclexlms.com">support@Nclexlms.com</a>
        </div>
      </div>
    </div>
  );
};

export default HelpAndDocs;
