import React, { useState } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import config from '../config';

const FileDialog = ({
  open,
  onClose,
  files,
  setFiles,
  currentRoomType,
  currentProject,
  downloadFile,
  deleteFile,
  token,
  setUploadStatus,
  setOpenSnackbar
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false); 
  const [fileToReplace, setFileToReplace] = useState(null);

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setFileToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      await deleteFile(currentProject, currentRoomType, fileToDelete);
      setFiles(files.filter(file => file !== fileToDelete)); // 实时更新文件列表
    }
    handleConfirmClose();
  };

  const handleReplaceClose = () => {
    setReplaceConfirmOpen(false);
    setFileToReplace(null);
  };

  const handleConfirmReplace = async () => {
    if (fileToReplace) {
      await handleFileReplace(fileToReplace);
    }
    handleReplaceClose();
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    console.log('Selected file:', selectedFile);
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    console.log('Form Data:', formData.get('file')); // 确认 formData 中的文件

    if (files.includes(selectedFile.name)) {
      setFileToReplace(selectedFile);
      setReplaceConfirmOpen(true);
    } else {
      await uploadFile(formData);
    }
  };

  const uploadFile = async (formData) => {
    try {
      console.log('Preparing to send POST request');
      const response = await axios.post(
        `${config.apiBaseUrl}/api/projects/${currentProject.name}_${currentProject.id}/config/${currentRoomType}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('POST request completed');
      console.log('Response status:', response.status); // 确认响应状态

      if (response.status === 201) {
        setUploadStatus('success');
        setOpenSnackbar(true);
        setFiles([...files, formData.get('file').name]); // 实时更新文件列表
        onClose(); // 关闭弹窗
      } else if (response.status === 409) {
        console.log('File already exists, attempting to replace');
        setFileToReplace(formData.get('file'));
        setReplaceConfirmOpen(true);
      } else {
        console.error('Unexpected response status:', response.status);
        setUploadStatus('unexpected');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.log('Error in catch block');
      console.log(error);
      setUploadStatus('error');
      setOpenSnackbar(true);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    }
  };

  const handleFileReplace = async (selectedFile) => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const replaceResponse = await axios.put(
        `${config.apiBaseUrl}/api/projects/${currentProject.name}_${currentProject.id}/config/${currentRoomType}/files/${selectedFile.name}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (replaceResponse.status === 200) {
        setUploadStatus('success-replace');
        setOpenSnackbar(true);
        setFiles(files.map(file => file === selectedFile.name ? selectedFile.name : file)); // 实时更新文件列表
        onClose(); // 关闭弹窗
      } else {
        console.error('Error replacing file:', replaceResponse);
        setUploadStatus('error-replace');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.log('Error in catch block');
      console.log(error);
      setUploadStatus('error');
      setOpenSnackbar(true);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Files in {currentRoomType}
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            style={{ marginLeft: '16px', position: 'absolute', right: '16px', backgroundColor: '#ffc000' }}
            sx={{ boxShadow: 'none' }}
          >
            Upload file
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <List style={{ maxHeight: '400px', overflow: 'auto' }}>
            {files.map((file) => (
              <ListItem key={file}>
                <ListItemText primary={file} />
                <IconButton edge="end" aria-label="download" onClick={() => downloadFile(currentProject, currentRoomType, file)} style={{ marginRight: '8px' }}>
                  <DownloadIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(file)}>
                  <ClearIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary" sx={{ color: '#ffc000' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this file?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} color="primary">
            No
          </Button>
          <Button onClick={handleConfirmDelete} color="primary" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={replaceConfirmOpen}
        onClose={handleReplaceClose}
        aria-labelledby="replace-confirm-dialog-title"
        aria-describedby="replace-confirm-dialog-description"
      >
        <DialogTitle id="replace-confirm-dialog-title">Confirm Replace</DialogTitle>
        <DialogContent>
          File already exists. Do you want to replace it?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReplaceClose} color="primary">
            No
          </Button>
          <Button onClick={handleConfirmReplace} color="primary" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileDialog;