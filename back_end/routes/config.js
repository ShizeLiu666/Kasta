const express = require('express');
const { RoomConfig, RoomType, Project } = require('../database'); // 确保正确导入模型
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
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

// 处理 GET 请求，获取房型文件列表
router.get('/:projectId/:roomTypeId/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;

  try {
    console.log(`GET request received for projectId: ${projectId} and roomTypeId: ${roomTypeId}`);

    const projectExists = await Project.exists({ _id: projectId });
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });

    console.log(`Project exists: ${projectExists}`);
    console.log(`Room Type exists: ${roomTypeExists}`);

    if (!projectExists) {
      console.log('Project not found');
      return res.status(404).json({ error: "Project not found" });
    }

    if (!roomTypeExists) {
      console.log('Room Type not found');
      return res.status(404).json({ error: "Room Type not found" });
    }

    const roomConfigs = await RoomConfig.find({ projectId, roomTypeId });
    if (!roomConfigs.length) {
      console.log('No configurations found');
      return res.status(404).json({ error: "No configurations found" });
    }

    res.status(200).json(roomConfigs);
  } catch (error) {
    console.error("Error in GET /api/config/:projectId/:roomTypeId/files:", error);
    res.status(500).send("Error fetching files");
  }
});

// 处理 POST 请求，上传新文件
router.post('/:projectId/:roomTypeId/files', authenticateToken, upload.single('file'), async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const { file } = req;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  try {
    const projectExists = await Project.exists({ _id: projectId });
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });

    if (!projectExists || !roomTypeExists) {
      return res.status(404).json({ error: "Project or Room Type not found" });
    }

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
    
    res.status(201).json({
      result: "File uploaded successfully",
      config: content
    });
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).send("Error uploading file");
  }
});

// 处理 PUT 请求，替换文件
router.put('/:projectId/:roomTypeId/files', authenticateToken, upload.single('file'), async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const { file } = req;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  try {
    const projectExists = await Project.exists({ _id: projectId });
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });

    if (!projectExists || !roomTypeExists) {
      return res.status(404).json({ error: "Project or Room Type not found" });
    }

    const content = JSON.parse(file.buffer.toString('utf-8'));
    const typeCode = await getTypeCode(roomTypeId);

    const roomConfig = await RoomConfig.findOneAndUpdate(
      { projectId, roomTypeId },
      { config: content, typeCode },
      { new: true }
    );

    if (!roomConfig) {
      return res.status(404).send("Configuration not found for replacement");
    }

    res.status(200).json({
      result: "File replaced successfully",
      config: content
    });
  } catch (error) {
    console.error("Error replacing file:", error.message);
    res.status(500).send("Error replacing file");
  }
});

// 处理 DELETE 请求，删除文件
router.delete('/:projectId/:roomTypeId/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;

  try {
    console.log(`DELETE request received for projectId: ${projectId} and roomTypeId: ${roomTypeId}`);

    const projectExists = await Project.exists({ _id: projectId });
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });

    if (!projectExists) {
      console.log('Project not found');
      return res.status(404).json({ error: "Project not found" });
    }

    if (!roomTypeExists) {
      console.log('Room Type not found');
      return res.status(404).json({ error: "Room Type not found" });
    }

    const roomConfig = await RoomConfig.findOneAndDelete({ projectId, roomTypeId });

    if (!roomConfig) {
      console.log('Configuration not found');
      return res.status(404).send("Configuration not found");
    }

    // 删除文件系统中的文件
    const folderPath = path.join(__dirname, '..', 'json_lists', projectId, roomConfig.typeCode);
    if (fs.existsSync(folderPath)) {
      fs.rmdirSync(folderPath, { recursive: true });
      console.log(`Deleted folder: ${folderPath}`);
    }

    res.status(200).send("Configuration deleted successfully");
  } catch (error) {
    console.error("Error deleting configuration:", error.message);
    res.status(500).send("Error deleting configuration");
  }
});

module.exports = router;