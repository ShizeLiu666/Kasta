const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');

// ! API 3: Get room type list
const getRoomTypes = (projectName) => {
  return new Promise((resolve, reject) => {
    const directory = path.join(__dirname, '..', 'json_lists');
    console.log(`Reading directory: ${directory}`);
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err.message}`);
        return reject(err);
      }

      const folderName = files.find(file => file === projectName);
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

const writeRoomTypes = (projectName, roomTypes) => {
  return new Promise((resolve, reject) => {
    const directory = path.join(__dirname, '..', 'json_lists');
    const filePath = path.join(directory, projectName, 'roomTypes.json');
    fs.writeFile(filePath, JSON.stringify(roomTypes, null, 2), (err) => {
      if (err) {
        console.error(`Error writing file: ${err.message}`);
        return reject(err);
      }
      resolve();
    });
  });
};

// handle GET requests for the room type list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projectName = req.params.projectName;
    console.log(`GET /api/projects/${projectName}/roomTypes`);
    const roomTypes = await getRoomTypes(projectName);
    res.status(200).json(roomTypes);
  } catch (error) {
    console.error("Error in GET /api/projects/:projectName/roomTypes:", error);
    res.status(500).send("Error reading the room types data.");
  }
});

// handle GET requests to download room types data
router.get('/download', authenticateToken, async (req, res) => {
  try {
    const projectName = req.params.projectName;
    console.log(`GET /api/projects/${projectName}/roomTypes/download`);
    const directory = path.join(__dirname, '..', 'json_lists');
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err.message}`);
        return res.status(500).send("Error reading the directory.");
      }

      const folderName = files.find(file => file === projectName);
      if (!folderName) {
        console.error('Project folder not found');
        return res.status(404).send("Project folder not found.");
      }

      const filePath = path.join(directory, folderName, 'roomTypes.json');
      console.log(`Downloading file from: ${filePath}`);
      res.download(filePath, 'roomTypes.json');
    });
  } catch (error) {
    console.error("Error in GET /api/projects/:projectName/roomTypes/download:", error);
    res.status(500).send("Error processing your request.");
  }
});

// handle POST requests to add a new room type
router.post('/', authenticateToken, async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const newRoomType = req.body;
    console.log(`POST /api/projects/${projectName}/roomTypes`);
    const roomTypes = await getRoomTypes(projectName);
    roomTypes.push(newRoomType);
    await writeRoomTypes(projectName, roomTypes);
    res.status(200).send("Room type added successfully.");
  } catch (error) {
    console.error("Error in POST /api/projects/:projectName/roomTypes:", error);
    res.status(500).send("Error adding the room type.");
  }
});

// handle DELETE requests to delete a room type by typeCode
router.delete('/delete/:typeCode', authenticateToken, async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const typeCode = req.params.typeCode;
    console.log(`DELETE /api/projects/${projectName}/roomTypes/delete/${typeCode}`);
    let roomTypes = await getRoomTypes(projectName);
    roomTypes = roomTypes.filter(roomType => roomType.typeCode !== typeCode);
    await writeRoomTypes(projectName, roomTypes);
    res.status(200).send("Room type deleted successfully.");
  } catch (error) {
    console.error("Error in DELETE /api/projects/:projectName/roomTypes/delete/:typeCode:", error);
    res.status(500).send("Error deleting the room type.");
  }
});

module.exports = router;