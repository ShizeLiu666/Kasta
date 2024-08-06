const express = require('express');
const { RoomConfig, RoomType, Project } = require('../database'); // 确保正确导入模型
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// get typeCode
const getTypeCode = async (roomTypeId) => {
  const roomType = await RoomType.findById(roomTypeId);
  return roomType ? roomType.typeCode : null;
};

// get request - room configuration
router.get('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;

  try {
    // check project is existing
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // check room type of project is existing
    const roomTypeExists = await RoomType.exists({ _id: roomTypeId });
    if (!roomTypeExists) {
      return res.status(404).json({ error: "Room Type not found" });
    }

    // use project id and room type id to find room configurations
    const roomConfigs = await RoomConfig.find({ projectId, roomTypeId });
    if (!roomConfigs.length) {
      return res.status(404).json({ error: "No configurations found" });
    }

    res.status(200).json(roomConfigs);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).send("Error fetching files");
  }
});

// post request - upload a new room configuration
router.post('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const config = req.body; // get entire json object from request body

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
      config // use the JSON object in the request body as the config field 
    });

    await newRoomConfig.save();
    
    res.status(201).json({
      result: "Configuration uploaded successfully",
      config: config
    });
  } catch (error) {
    console.error('Error uploading configuration:', error);
    res.status(500).send("Error uploading configuration");
  }
});

// 处理 PUT 请求，替换文件
router.put('/files', authenticateToken, async (req, res) => {
  const { projectId, roomTypeId } = req.params;
  const config = req.body;

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
    console.error('Error replacing configuration:', error);
    res.status(500).send("Error replacing configuration");
  }
});

// delete request - delete a room configuration
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
    res.status(200).send("Configuration deleted successfully");
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).send("Error deleting configuration");
  }
});

module.exports = router;