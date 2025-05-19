import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Import layout components
import MainLayout from "./components/layout/MainLayout";

// Import pages
import BrainstormPage from "./pages/BrainstormPage";
import QuickDocPage from "./pages/QuickDocPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect home to brainstorm page */}
        <Route path="/" element={<Navigate to="/brainstorm" replace />} />

        <Route element={<MainLayout />}>
          <Route path="/brainstorm" element={<BrainstormPage />} />
          <Route path="/quickdoc" element={<QuickDocPage />} />
        </Route>

        {/* Redirect any unmatched routes to the brainstorm page */}
        <Route path="*" element={<Navigate to="/brainstorm" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
