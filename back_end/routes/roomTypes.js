const express = require('express');
const { RoomType, RoomConfig, Project } = require('../database'); // Import the models
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');
const fs = require('fs');
const path = require('path'); // Ensure `path` module is imported

// 生成 typeCode 的函数
const generateTypeCode = (name) => {
  return name
    .split(' ')
    .filter(word => word.toLowerCase() !== 'room')
    .map(word => word[0].toUpperCase())
    .join('');
};

// 处理获取房型列表的 GET 请求
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.log(`GET /api/projects/${projectId}/roomTypes`);
    const roomTypes = await RoomType.find({ projectId });
    res.status(200).json(roomTypes);
  } catch (error) {
    console.error("Error in GET /api/projects/:projectId/roomTypes:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理添加新房型的 POST 请求
router.post('/', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { name } = req.body;
    console.log(`POST /api/projects/${projectId}/roomTypes`);

    if (!name) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const typeCode = generateTypeCode(name);
    const existingRoomType = await RoomType.findOne({ projectId, name });

    if (existingRoomType) {
      return res.status(409).json({ error: 'Room type already exists' });
    }

    const newRoomType = new RoomType({ projectId, name, typeCode });
    const savedRoomType = await newRoomType.save();
    res.status(201).json(savedRoomType);
  } catch (error) {
    console.error("Error in POST /api/projects/:projectId/roomTypes:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    res.status(500).send("Error adding the room type.");
  }
});

// 封装的函数，用于验证 roomType 和 project 之间的关系
const validateRoomTypeAndProject = async (projectId, roomTypeId) => {
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    throw new Error("Room Type not found");
  }

  if (roomType.projectId.toString() !== projectId) {
    throw new Error("Room Type does not belong to the specified Project");
  }

  return roomType;
};

// 处理删除房型的 POST 请求
router.post('/delete', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { roomTypeId } = req.body;

    if (!roomTypeId) {
      console.log('Invalid request format');
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // 验证 roomTypeId 和 projectId
    const roomType = await validateRoomTypeAndProject(projectId, roomTypeId);
    console.log(`Deleting room type for project: ${projectId}`);

    // 删除与该房型相关的所有配置文件
    await RoomConfig.deleteMany({ roomTypeId });
    console.log(`Deleted room configurations for room type: ${roomTypeId}`);

    // 删除房型
    await RoomType.findByIdAndDelete(roomTypeId);
    console.log(`Deleted room type: ${roomTypeId}`);

    // 删除房型对应的文件夹
    const folderPath = path.join(__dirname, '..', 'json_lists', projectId, roomType.typeCode);
    if (fs.existsSync(folderPath)) {
      fs.rmdirSync(folderPath, { recursive: true });
      console.log(`Deleted folder: ${folderPath}`);
    }

    res.status(200).json({ message: 'Room type and related configurations and folder deleted successfully' });
  } catch (error) {
    console.error("Error in POST /api/projects/:projectId/roomTypes/delete:", error);
    const statusCode = error.message.includes('not found') || error.message.includes('does not belong') ? 404 : 500;
    res.status(statusCode).send(`Error deleting the room type: ${error.message}`);
  }
});

// 处理更新房型的 PUT 请求
router.put('/:roomTypeId', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { roomTypeId } = req.params;
    const { name } = req.body;
    console.log(`PUT /api/projects/${projectId}/roomTypes/${roomTypeId}`);

    if (!name) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const typeCode = generateTypeCode(name);

    const updatedRoomType = await RoomType.findByIdAndUpdate(
      roomTypeId,
      { name, typeCode },
      { new: true }
    );

    if (!updatedRoomType) {
      return res.status(404).send("Room type not found.");
    }

    // 更新 RoomConfig 表中的所有关联配置的 typeCode
    await RoomConfig.updateMany(
      { roomTypeId: roomTypeId },
      { $set: { typeCode: typeCode } }
    );

    res.status(200).json(updatedRoomType);
  } catch (error) {
    console.error("Error in PUT /api/projects/:projectId/roomTypes/:roomTypeId:", error);
    res.status(500).send("Error updating the room type.");
  }
});

module.exports = router;