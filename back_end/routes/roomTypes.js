const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth'); // 确保这是一个中间件函数

// ! API 3: Get room type list
const getRoomTypes = (projectId) => {
  return new Promise((resolve, reject) => {
    const directory = path.join(__dirname, '..', 'json_lists'); // 使用绝对路径
    console.log(`Reading directory: ${directory}`);
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err.message}`);
        return reject(err);
      }

      const folderName = files.find(file => file.endsWith(`_${projectId}`));
      if (!folderName) {
        console.error('Project folder not found');
        return reject(new Error('Project folder not found'));
      }

      const filePath = path.join(directory, folderName, 'roomTypes.json');
      console.log(`Reading file from: ${filePath}`);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error(`Error reading file: ${err.message}`);
          return reject(err);
        }
        try {
          const roomTypes = JSON.parse(data);
          resolve(roomTypes);
        } catch (parseError) {
          console.error(`Error parsing JSON data: ${parseError.message}`);
          reject(parseError);
        }
      });
    });
  });
};

// handle GET requests for the room type list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    console.log(`GET /api/projects/${projectId}/roomTypes`);
    const roomTypes = await getRoomTypes(projectId);
    res.status(200).json(roomTypes);
  } catch (error) {
    console.error("Error in GET /api/projects/:projectId/roomTypes:", error);
    res.status(500).send("Error reading the room types data.");
  }
});

// handle GET requests to download room types data
router.get('/download', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    console.log(`GET /api/projects/${projectId}/roomTypes/download`);
    const directory = path.join(__dirname, '..', 'json_lists'); // 使用绝对路径
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err.message}`);
        return res.status(500).send("Error reading the directory.");
      }

      const folderName = files.find(file => file.endsWith(`_${projectId}`));
      if (!folderName) {
        console.error('Project folder not found');
        return res.status(404).send("Project folder not found.");
      }

      const filePath = path.join(directory, folderName, 'roomTypes.json');
      console.log(`Downloading file from: ${filePath}`);
      res.download(filePath, 'roomTypes.json');
    });
  } catch (error) {
    console.error("Error in GET /api/projects/:projectId/roomTypes/download:", error);
    res.status(500).send("Error processing your request.");
  }
});

module.exports = router;