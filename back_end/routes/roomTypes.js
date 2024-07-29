const express = require('express');
const { RoomType } = require('../database'); // Import the models
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

// handle GET requests for the room type list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    console.log(`GET /api/projects/${projectId}/roomTypes`);
    const roomTypes = await RoomType.find({ projectId });
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
    const roomTypes = await RoomType.find({ projectId });
    res.setHeader('Content-Disposition', 'attachment; filename=roomTypes.json');
    res.status(200).json(roomTypes);
  } catch (error) {
    console.error("Error in GET /api/projects/:projectId/roomTypes/download:", error);
    res.status(500).send("Error processing your request.");
  }
});

// handle POST requests to add new room types
router.post('/', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const newRoomTypes = req.body;
    console.log(`POST /api/projects/${projectId}/roomTypes`);

    // 处理每个房型，生成 typeCode 并添加 projectId
    const roomTypesToInsert = newRoomTypes.map(roomType => {
      const typeCode = generateTypeCode(roomType.name);
      return { ...roomType, projectId, typeCode };
    });

    // 插入房型到数据库
    await RoomType.insertMany(roomTypesToInsert);
    res.status(200).send("Room types added successfully.");
  } catch (error) {
    console.error("Error in POST /api/projects/:projectId/roomTypes:", error);
    res.status(500).send("Error adding the room types.");
  }
});

// handle POST requests to delete multiple room types by room type IDs
router.post('/delete', authenticateToken, async (req, res) => {
  try {
    const { roomTypeIds } = req.body;
    console.log(`POST /api/projects/:projectId/roomTypes/delete`);

    const deleteResults = await Promise.all(roomTypeIds.map(async (roomTypeId) => {
      const roomType = await RoomType.findById(roomTypeId);

      if (!roomType) {
        return { roomTypeId, status: 'not found' };
      }

      await RoomType.findByIdAndDelete(roomTypeId);
      return { roomTypeId, status: 'deleted' };
    }));
    res.status(200).json({ message: 'Room types processed', results: deleteResults });
  } catch (error) {
    console.error("Error in POST /api/projects/:projectId/roomTypes/delete:", error);
    res.status(500).send("Error deleting the room types.");
  }
});

module.exports = router;