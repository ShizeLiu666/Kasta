const express = require('express');
const { RoomType, Project } = require('../database'); // Import the models
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/auth');

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

// TODO 处理删除房型的 POST 请求
router.post('/delete', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { roomTypeId } = req.body;
    if (!roomTypeId) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    // 删除与该房型相关的所有配置文件
    await RoomConfig.deleteMany({ projectId: projectId, roomTypeId: roomTypeId });

    // 删除房型
    await RoomType.findByIdAndDelete(roomTypeId);

    // 删除房型对应的文件夹
    const folderPath = path.join(__dirname, '..', 'json_lists', projectId, roomType.typeCode);
    fs.rmdirSync(folderPath, { recursive: true });

    res.status(200).json({ message: 'Room type and related configurations and folder deleted successfully' });
  } catch (error) {
    console.error("Error in POST /api/projects/:projectId/roomTypes/delete:", error);
    res.status(500).send("Error deleting the room type.");
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

    res.status(200).json(updatedRoomType);
  } catch (error) {
    console.error("Error in PUT /api/projects/:projectId/roomTypes/:roomTypeId:", error);
    res.status(500).send("Error updating the room type.");
  }
});

module.exports = router;