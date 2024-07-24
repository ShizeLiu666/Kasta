const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectId, roomType } = req.params;
    getFolderName(projectId).then(folderName => {
      const uploadPath = path.join(__dirname, '..', 'json_lists', folderName, roomType);
      console.log(`Upload path: ${uploadPath}`);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`Created upload path: ${uploadPath}`);
      }
      cb(null, uploadPath);
    }).catch(err => {
      cb(err, null);
    });
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.json') {
      const err = new Error('Only .json files are allowed');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  }
});

// 获取项目的文件夹名称
const getFolderName = (projectId) => {
  return new Promise((resolve, reject) => {
    const directory = path.join(__dirname, '..', 'json_lists');
    console.log('Checking directory:', directory);
    fs.readdir(directory, (err, files) => {
      if (err) {
        return reject(err);
      }
      console.log('Available project folders:', files);
      const folderName = files.find(file => file === projectId);
      if (!folderName) {
        return reject(new Error('Project folder not found'));
      }
      resolve(folderName);
    });
  });
};

// 获取特定房型的文件列表
const getFilesInRoomType = (projectFolder, roomType) => {
  return new Promise((resolve, reject) => {
    const directoryPath = path.join(__dirname, '..', 'json_lists', projectFolder, roomType);
    console.log('Checking room type directory:', directoryPath);
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        return reject(err);
      }
      console.log('Files in room type:', files);
      resolve(files);
    });
  });
};

// 处理获取特定房型文件列表的请求
router.get('/:roomType/files', authenticateToken, async (req, res) => {
  const { projectId, roomType } = req.params;

  console.log(`Project ID: ${projectId}`);
  console.log(`Room Type: ${roomType}`);

  try {
    const folderName = await getFolderName(projectId);
    console.log(`Folder Name: ${folderName}`);
    const files = await getFilesInRoomType(folderName, roomType);
    res.status(200).json(files);
  } catch (error) {
    console.error('Error fetching files:', error.message);
    res.status(500).send('Error fetching files');
  }
});

// 处理下载特定文件的请求
router.get('/:roomType/files/:fileName', authenticateToken, async (req, res) => {
  const { projectId, roomType, fileName } = req.params;

  console.log(`Project ID: ${projectId}`);
  console.log(`Room Type: ${roomType}`);
  console.log(`File Name: ${fileName}`);

  try {
    const folderName = await getFolderName(projectId);
    console.log(`Folder Name: ${folderName}`);
    const filePath = path.join(__dirname, '..', 'json_lists', folderName, roomType, fileName);
    console.log(`File Path: ${filePath}`);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      console.log('File not found:', filePath);
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error downloading file:', error.message);
    res.status(500).send('Error downloading file');
  }
});

// 处理删除特定文件的请求
router.delete('/:roomType/files/:fileName', authenticateToken, async (req, res) => {
  const { projectId, roomType, fileName } = req.params;
  try {
    const folderName = await getFolderName(projectId);
    console.log(`Folder Name: ${folderName}`);
    const filePath = path.join(__dirname, '..', 'json_lists', folderName, roomType, fileName);
    console.log(`File Path: ${filePath}`);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err.message);
          return res.status(500).send('Error deleting file');
        }
        res.status(200).send('File deleted successfully');
      });
    } else {
      console.log('File not found:', filePath);
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error deleting file:', error.message);
    res.status(500).send('Error deleting file');
  }
});

// 文件上传接口
router.post('/:roomType/files', authenticateToken, upload.single('file'), (req, res) => {
  console.log('uploading file');
  res.status(201).send('File uploaded successfully');
});

// 替换文件接口
router.put('/:roomType/files/:fileName', authenticateToken, upload.single('file'), async (req, res) => {
  const { projectId, roomType, fileName } = req.params;
  const { file } = req;

  if (!file) {
    console.log('No file uploaded for replacement');
    return res.status(400).send('No file uploaded');
  }

  try {
    const folderName = await getFolderName(projectId);
    const filePath = path.join(__dirname, '..', 'json_lists', folderName, roomType, fileName);
    console.log('Replacing file at path:', filePath);

    // Log the original file details
    console.log('Uploaded file details:', file);

    console.log('File replaced successfully:', filePath);
    return res.status(200).send('File replaced successfully');
  } catch (error) {
    console.error('Error handling file replacement:', error.message);
    return res.status(500).send('Error handling file replacement');
  }
});

module.exports = router;

// 错误处理中间件
router.use((err, req, res, next) => {
  if (err) {
    console.error(err.message);
    if (!err.status) {
      err.status = 500;
    }
    res.status(err.status).send({ error: err.message });
  } else {
    next();
  }
});

module.exports = router;