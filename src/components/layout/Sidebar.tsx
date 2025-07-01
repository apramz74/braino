import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Brain, Zap, Palette } from "lucide-react";

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
              <span
                className="nav-icon"
                style={{ display: "flex", alignItems: "center" }}
              >
                <Brain size={18} />
              </span>
              <span className="nav-text">Brainstormer</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/quickdoc"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span
                className="nav-icon"
                style={{ display: "flex", alignItems: "center" }}
              >
                <Zap size={18} />
              </span>
              <span className="nav-text">QuickDoc</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/designstormer"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span
                className="nav-icon"
                style={{ display: "flex", alignItems: "center" }}
              >
                <Palette size={18} />
              </span>
              <span className="nav-text">Designstormer</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
