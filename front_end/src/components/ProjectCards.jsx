import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import axios from 'axios';
import FileDialog from './FileDialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

export default function ProjectCards({ projects, token }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentProject, setCurrentProject] = useState({});
  const [rooms, setRooms] = useState([]);
  const [files, setFiles] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRoomType, setCurrentRoomType] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleOpenMenu = (event, project) => {
    setAnchorEl(event.currentTarget);
    setCurrentProject(project);
    fetchRooms(project.name, project.id);  // 调用fetchRooms时传递项目名和项目id
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenDialog = (roomType) => {
    setCurrentRoomType(roomType);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFiles([]);
    setCurrentRoomType(null);
  };

  const fetchRooms = async (projectName, projectId) => {
    try {
      const response = await axios.get(`http://174.138.109.122:8000/api/projects/${projectName}_${projectId}/roomTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  const fetchFiles = async (project, roomType) => {
    try {
      setCurrentRoomType(roomType);
      const response = await axios.get(`http://174.138.109.122:8000/api/projects/${project.name}_${project.id}/config/${roomType}/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const filteredFiles = response.data.filter(file => /\.(json|pdf|xls|xlsx|jpg|jpeg|png|gif)$/i.test(file));
      setFiles(filteredFiles);
      handleOpenDialog(roomType);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const downloadFile = async (project, roomType, fileName) => {
    try {
      const response = await axios.get(`http://174.138.109.122:8000/api/projects/${project.name}_${project.id}/config/${roomType}/files/${fileName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading the file:', error);
    }
  };

  const deleteFile = async (project, roomType, fileName) => {
    try {
      await axios.delete(`http://174.138.109.122:8000/api/projects/${project.name}_${project.id}/config/${roomType}/files/${fileName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFiles(files.filter(file => file !== fileName));
    } catch (error) {
      console.error('Error deleting the file:', error);
    }
  };

  const downloadRoomTypes = async (projectName, projectId) => {
    try {
      const response = await axios.get(`http://174.138.109.122:8000/api/projects/${projectName}_${projectId}/roomTypes/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'roomTypes.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading the file:', error);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const getSnackbarContent = () => {
    switch (uploadStatus) {
      case 'success':
        return (
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
            <AlertTitle>Success</AlertTitle>
            File uploaded successfully.
          </Alert>
        );
      case 'success-replace':
        return (
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
            <AlertTitle>Success</AlertTitle>
            File replaced successfully.
          </Alert>
        );
      case 'error':
        return (
          <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
            <AlertTitle>Error</AlertTitle>
            Error uploading file.
          </Alert>
        );
      case 'error-replace':
        return (
          <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
            <AlertTitle>Error</AlertTitle>
            Error replacing file.
          </Alert>
        );
      case 'unexpected':
        return (
          <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
            <AlertTitle>Error</AlertTitle>
            Unexpected response status.
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {projects.map((project) => (
        <Card sx={{ maxWidth: 400, marginBottom: 2 }} key={project.id}>
          <CardMedia
            component="img"
            alt={project.name}
            height="140"
            image={project.image}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.address}
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" sx={{ textTransform: 'none' }} onClick={() => downloadRoomTypes(project.name, project.id)}>
              Get Room Type List
            </Button>
            <Button size="small" sx={{ textTransform: 'none' }} onClick={(event) => handleOpenMenu(event, project)}>
              Get Programming Configuration
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} onClick={() => fetchFiles(currentProject, room.typeCode)}>
                  {room.description}
                </MenuItem>
              ))}
            </Menu>
          </CardActions>
        </Card>
      ))}
      <FileDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        files={files}
        setFiles={setFiles} // 传递 setFiles 函数
        currentRoomType={currentRoomType}
        currentProject={currentProject}
        downloadFile={downloadFile}
        deleteFile={deleteFile}
        token={token}
        setUploadStatus={setUploadStatus}
        setOpenSnackbar={setOpenSnackbar}
      />
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={2000} 
        onClose={handleSnackbarClose} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1400 }} // 确保 Snackbar 在最上层显示
      >
        {getSnackbarContent()}
      </Snackbar>
    </div>
  );
}