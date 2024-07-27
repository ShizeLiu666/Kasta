import * as React from 'react';
import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import ProjectCards from './ProjectCards';
import Box from '@mui/material/Box';
import config from '../config';

export default function ComboBox() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${config.apiBaseUrl}/api/projects`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const projectData = response.data.map(project => ({
          ...project,
          image: `/images/${project.name}.png`
        }));
        setProjects(projectData);
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    if (token) {
      fetchProjects();
    } else {
      console.error('No token found, please login first');
    }
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      if (!selectedProjectName) {
        document.activeElement.blur();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [selectedProjectName]);

  const handleInputChange = (event) => {
    setSelectedProjectName(event.target.value);
  };

  const filteredProjects = selectedProjectName 
    ? projects.filter(project => project.name.toLowerCase().includes(selectedProjectName.toLowerCase()))
    : projects;

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        id="project-search"
        label="Please Select the project name"
        variant="outlined"
        fullWidth
        value={selectedProjectName}
        onChange={handleInputChange}
        sx={{ width: 400, marginBottom: 2, marginTop: 2, zIndex: 1300 }} 
      />
      <ProjectCards projects={filteredProjects} token={token} setToken={setToken} />
    </Box>
  );
}