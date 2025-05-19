import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const MainLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="content-container">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
