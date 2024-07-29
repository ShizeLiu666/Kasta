const express = require('express');
const { RoomConfig, RoomType } = require('../database'); // Import the RoomConfig and RoomType model
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// 使用内存存储读取文件内容
const storage = multer.memoryStorage();

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

// 获取 typeCode
const getTypeCode = async (roomTypeId) => {
  const roomType = await RoomType.findById(roomTypeId);
  return roomType ? roomType.typeCode : null;
};

// handle GET requests for room type files
router.get('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;

  try {
    const roomConfigs = await RoomConfig.find({ projectId, roomTypeId });
    res.status(200).json(roomConfigs);
  } catch (error) {
    console.error("Error in GET /api/config/:projectId/:roomTypeId/files:", error);
    res.status(500).send("Error fetching files");
  }
});

// handle GET requests to download a room type file
router.get('/files/:fileName', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId, fileName } = req.params;

  try {
    const roomConfig = await RoomConfig.findOne({ projectId, roomTypeId, fileName });
    if (!roomConfig) {
      return res.status(404).send("File not found");
    }
    res.status(200).json(roomConfig.config);
  } catch (error) {
    console.error("Error in GET /api/config/:projectId/:roomTypeId/files/:fileName:", error);
    res.status(500).send("Error fetching file");
  }
});

// handle POST requests to upload a new file for a room type
router.post('/files', authenticateToken, upload.single('file'), async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const { file } = req;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  try {
    const existingConfig = await RoomConfig.findOne({ projectId, roomTypeId });
    if (existingConfig) {
      return res.status(409).send("Configuration for this room type already exists");
    }

    const content = JSON.parse(file.buffer.toString('utf-8'));
    const typeCode = await getTypeCode(roomTypeId);

    const newRoomConfig = new RoomConfig({
      projectId,
      roomTypeId,
      typeCode,
      config: content
    });

    await newRoomConfig.save();
    res.status(201).send("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).send("Error uploading file");
  }
});

// handle PUT requests to replace a file for a room type
router.put('/files', authenticateToken, upload.single('file'), async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const { file } = req;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  try {
    const content = JSON.parse(file.buffer.toString('utf-8'));
    const typeCode = await getTypeCode(roomTypeId);

    const roomConfig = await RoomConfig.findOneAndUpdate(
      { projectId, roomTypeId },
      { config: content, typeCode },
      { new: true, upsert: true }
    );

    res.status(200).send("File replaced successfully");
  } catch (error) {
    console.error("Error replacing file:", error.message);
    res.status(500).send("Error replacing file");
  }
});

// handle POST requests to delete a file for a room type
router.post('/files/delete', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;

  try {
    const roomConfig = await RoomConfig.findOneAndDelete({ projectId, roomTypeId });

    if (!roomConfig) {
      return res.status(404).send("Configuration not found");
    }

    res.status(200).send("Configuration deleted successfully");
  } catch (error) {
    console.error("Error deleting configuration:", error.message);
    res.status(500).send("Error deleting configuration");
  }
});

module.exports = router;