import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Zap, FileText } from "lucide-react";

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="home-link">
          <h1 className="app-title">Braino</h1>
        </Link>
      </div>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink
              to="/brainstorm"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">
                <Zap size={18} />
              </span>
              <span className="nav-text">Brainstorm</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/quickdoc"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">
                <FileText size={18} />
              </span>
              <span className="nav-text">QuickDoc</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
