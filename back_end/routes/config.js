const express = require('express');
const { RoomConfig, RoomType, Project } = require('../database'); // 确保正确导入模型
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// 获取 typeCode
const getTypeCode = async (roomTypeId) => {
  const roomType = await RoomType.findById(roomTypeId);
  return roomType ? roomType.typeCode : null;
};

// 处理 GET 请求，获取房型文件列表
router.get('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;

  try {
    // 检查项目是否存在
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 检查房型是否存在
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });
    if (!roomTypeExists) {
      return res.status(404).json({ error: "Room Type not found" });
    }

    // 获取房型配置
    const roomConfigs = await RoomConfig.find({ projectId, roomTypeId });
    if (!roomConfigs.length) {
      return res.status(404).json({ error: "No configurations found" });
    }

    res.status(200).json(roomConfigs);
  } catch (error) {
    console.error('Error fetching files:', error); // 打印错误日志以便调试
    res.status(500).send("Error fetching files");
  }
});

// 处理 POST 请求，上传新文件
router.post('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const config = req.body; // 从请求体中获取整个JSON对象

  if (!config) {
    return res.status(400).send("No configuration data provided");
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

    const typeCode = await getTypeCode(roomTypeId);

    const newRoomConfig = new RoomConfig({
      projectId,
      roomTypeId,
      typeCode,
      config // 直接将请求体中的JSON对象作为config字段
    });

    await newRoomConfig.save();
    
    res.status(201).json({
      result: "Configuration uploaded successfully",
      config: config
    });
  } catch (error) {
    console.error('Error uploading configuration:', error); // 打印错误日志以便调试
    res.status(500).send("Error uploading configuration");
  }
});

// 处理 PUT 请求，替换文件
router.put('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const config = req.body; // 从请求体中获取整个JSON对象

  if (!config) {
    return res.status(400).send("No configuration data provided");
  }

  try {
    const projectExists = await Project.exists({ _id: projectId });
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });

    if (!projectExists || !roomTypeExists) {
      return res.status(404).json({ error: "Project or Room Type not found" });
    }

    const typeCode = await getTypeCode(roomTypeId);

    const roomConfig = await RoomConfig.findOneAndUpdate(
      { projectId, roomTypeId },
      { config, typeCode },
      { new: true }
    );

    if (!roomConfig) {
      return res.status(404).send("Configuration not found for replacement");
    }

    res.status(200).json({
      result: "Configuration replaced successfully",
      config: config
    });
  } catch (error) {
    console.error('Error replacing configuration:', error); // 打印错误日志以便调试
    res.status(500).send("Error replacing configuration");
  }
});

// 处理 DELETE 请求，删除文件
router.delete('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;

  try {
    const projectExists = await Project.exists({ _id: projectId });
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });

    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!roomTypeExists) {
      return res.status(404).json({ error: "Room Type not found" });
    }

    const roomConfig = await RoomConfig.findOneAndDelete({ projectId, roomTypeId });

    if (!roomConfig) {
      return res.status(404).send("Configuration not found");
    }

    // 删除文件系统中的文件
    const folderPath = path.join(__dirname, '..', 'json_lists', projectId, roomConfig.typeCode);
    if (fs.existsSync(folderPath)) {
      fs.rmdirSync(folderPath, { recursive: true });
    }

    res.status(200).send("Configuration deleted successfully");
  } catch (error) {
    console.error('Error deleting configuration:', error); // 打印错误日志以便调试
    res.status(500).send("Error deleting configuration");
  }
});

module.exports = router;