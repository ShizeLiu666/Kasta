import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import FileUploadPage from './FileUploadPage';
import ProjectListPage from './ProjectListPage';
import LoginPage from './LoginPage';

const Main = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/LoginPage" />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/FileUploadPage" element={<FileUploadPage />} />
        <Route path="/project_list" element={<ProjectListPage />} />
      </Routes>
    </Router>
  );
};

export default Main;