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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// handle POST requests to add new room types
router.post('/:projectId/roomTypes', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { roomTypes } = req.body;

    console.log(`POST /api/projects/${projectId}/roomTypes`);

    // 检查请求格式
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    if (!Array.isArray(roomTypes)) {
      return res.status(400).json({ error: 'RoomTypes must be an array.' });
    }

    for (const roomType of roomTypes) {
      if (!roomType.name) {
        return res.status(400).json({ error: 'Each roomType must have a name.' });
      }
    }

    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const existingRoomTypes = await RoomType.find({ projectId });
    const existingRoomTypeNames = existingRoomTypes.map(rt => rt.name);

    // 处理每个房型，生成 typeCode 并添加 projectId
    const roomTypesToInsert = roomTypes.map(roomType => {
      const typeCode = generateTypeCode(roomType.name);
      return { ...roomType, projectId, typeCode };
    });

    // 检查是否有重复房型，并分离出非重复房型
    const duplicateRoomTypes = roomTypesToInsert.filter(roomType => 
      existingRoomTypeNames.includes(roomType.name)
    );

    const nonDuplicateRoomTypes = roomTypesToInsert.filter(roomType => 
      !existingRoomTypeNames.includes(roomType.name)
    );

    // 插入非重复房型到数据库
    if (nonDuplicateRoomTypes.length > 0) {
      await RoomType.insertMany(nonDuplicateRoomTypes);
    }

    res.status(200).json({
      message: nonDuplicateRoomTypes.length > 0 ? "Room types added successfully." : "No new room types to add.",
      duplicateRoomTypes: duplicateRoomTypes.map(rt => rt.name),
      addedRoomTypes: nonDuplicateRoomTypes.map(rt => rt.name)
    });
  } catch (error) {
    console.error("Error in POST /api/projects/:projectId/roomTypes:", error);
    res.status(500).send("Internal server error.");
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

    const notFoundRoomTypes = deleteResults.filter(result => result.status === 'not found').map(result => result.roomTypeId);
    const deletedRoomTypes = deleteResults.filter(result => result.status === 'deleted').map(result => result.roomTypeId);

    res.status(200).json({
      message: deletedRoomTypes.length > 0 ? "Room types processed" : "No room types deleted.",
      notFoundRoomTypes,
      deletedRoomTypes
    });
  } catch (error) {
    console.error("Error in POST /api/projects/:projectId/roomTypes/delete:", error);
    res.status(500).send("Error deleting the room types.");
  }
});

// handle PUT requests to update a room type by room type ID
router.put('/:roomTypeId', authenticateToken, async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const { name } = req.body;
    console.log(`PUT /api/projects/${projectId}/roomTypes/${roomTypeId}`);

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