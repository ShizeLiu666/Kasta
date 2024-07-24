import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ComboBox from './ComboBox';
import ProjectCards from './ProjectCards';
import '../styles/ProjectListPage.css';
import LogoutIcon from '@mui/icons-material/Logout';

const ProjectListPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // 从 localStorage 获取 token
  const projects = [/* 从某个地方获取项目列表 */]; // 假设你有项目列表数据

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/LoginPage');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center" style={{ background: '#28292a', position: 'relative' }}>
      <div className="absolute inset-0 bg-no-repeat bg-cover" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: 'cover' }}>
        <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
      </div>
      <div className="relative h-auto w-auto flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full p-10 bg-white rounded-xl z-10 relative overflow-hidden" style={{ maxWidth: '550px' }}>
          <Link to="/FileUploadPage" className="absolute top-5 right-5" style={{ color: '#ffc000'}}>
            Go to File Upload
          </Link>
          <div className="text-center">
            <h2 className="mt-10 text-3xl font-bold text-gray-900">
              Project List
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            <div className="grid grid-cols-1 space-y-2">
              <div className="file-list-container">
                <ComboBox />
              </div>
              <ProjectCards projects={projects} token={token} />
            </div>
          </div>
          <div className="absolute top-5 left-5 cursor-pointer" onClick={handleLogout} style={{ color: '#ffc000' }}>
            <LogoutIcon />
            <span className="ml-2">Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectListPage;