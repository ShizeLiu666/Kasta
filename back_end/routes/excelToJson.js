const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const { RoomConfig, RoomType, Project } = require('../database'); // 仅导入 RoomConfig 和 RoomType 模型

// Configure file upload behavior
const upload = multer({
  storage: multer.memoryStorage(), // memory storage engine, temporarily stores files in the server's memory
  // used to filter and validate uploaded file types
  // - file: The file object that is currently being uploaded
  // - cb: A callback function that tells multer whether the file is accepted after validation
  fileFilter: (req, file, cb) => {
    console.log('Received file:', file.originalname); // Log the received file name
    const filetypes = /xlsx|xls/;
    const mimetype = /application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application\/vnd.ms-excel/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    console.log('MIME type:', file.mimetype);
    console.log('Extension:', path.extname(file.originalname).toLowerCase());

    // check if both MIME type and extension are valid
    if (mimetype.test(file.mimetype) && extname) {
      return cb(null, true); // accept the file
    } else {
      console.log('Invalid file type:', file.mimetype, path.extname(file.originalname).toLowerCase()); // log invalid file type
      return cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Call convert.py to convert the uploaded Excel file to JSON format
const convertExcelToJson = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'convert.py'); // python script path
    // start a child process to run the script
    const pythonProcess = spawn('python3', [scriptPath], { shell: true });

    // write the file buffer data to the child process's standard input as the script's input 
    // then close the input stream after transmission
    pythonProcess.stdin.write(fileBuffer);
    pythonProcess.stdin.end();

    // capture the script's standard output. Each time data is received, convert it to a string and store it 
    let pythonOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    // trigger the close event when the child process end
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(`Python process exited with code ${code}`); // execution failed
      } else {
        try {
          const result = JSON.parse(pythonOutput.trim()); // trim removed whitespace from start and of the string
          resolve(result); // execuation succeeded
        } catch (err) {
          reject('Error parsing JSON output from Python script');
        }
      }
    });
  });
};

// check room type and project existence
const validateRoomTypeAndProject = async (projectId, roomTypeId) => {
  // check room type is valid
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    throw new Error("Room Type not found");
  }

  // check roomType is corresponding to the specified project
  if (roomType.projectId.toString() !== projectId) {
    throw new Error("Room Type does not belong to the specified Project");
  }

  return roomType;
};

// Simple conversion functionality, input: excel, output: json characters
router.post('/convert', (req, res, next) => {
  // handle single file upload
  upload.single('file')(req, res, async (err) => {
    // 400 - file upload failed or file type is invalid
    if (!req.file) {
      console.error('No file uploaded or invalid file type');
      return res.status(400).json({ error: 'No file uploaded or file type is incorrect. Only Excel files are allowed.' });
    }
    // 400 - file size exceeded limit, file format error, etc.
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }

    try {
      // upload successful, start conversion
      const jsonData = await convertExcelToJson(req.file.buffer);
      res.json(jsonData); // after successful conversion, send the generated JSON data as a response to the client
    } catch (error) {
      console.error("Error during conversion:", error);
      res.status(500).send('Error during conversion');
    }
  });
});

//! 新增的接口：转换并保存到指定项目和房型
router.post('/:projectId/:roomTypeId/files', upload.single('file'), async (req, res) => {
  try {
    // Check if a file is uploaded and its type is correct
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file type is incorrect. Only Excel files are allowed.' });
    }

    // Extract projectId and roomTypeId from the URL parameters
    const { projectId, roomTypeId } = req.params;

    // Check if the roomTypeId and projectId are valid
    // const roomType = await RoomType.findById(roomTypeId);
    // const project = await Project.findById(projectId);
    // if (!roomType) {
    //   return res.status(404).send("Room Type not found");
    // }
    // if (!project) {
    //   return res.status(404).send("Project not found");
    // }
    const roomType = await validateRoomTypeAndProject(projectId, roomTypeId);

    const jsonData = await convertExcelToJson(req.file.buffer);
    
    // check if a configuration already exists for this project and room type
    // 409 - duplicate uploads
    const existingConfig = await RoomConfig.findOne({ projectId, roomTypeId });
    if (existingConfig) {
      return res.status(409).send("Configuration for this room type already exists");
    }

    // create a new RoomConfig object and save it to the database
    const newRoomConfig = new RoomConfig({
      projectId,
      roomTypeId,
      typeCode: roomType.typeCode,  // Use the typeCode from the room type
      config: jsonData
    });

    await newRoomConfig.save();

    res.status(201).json({
      result: "Configuration uploaded and converted successfully",
      config: jsonData
    });

  } catch (error) {
    console.error('Error processing or saving configuration:', error);
    res.status(500).send("Error processing or saving configuration");
  }
});

//! PUT 请求接口：覆盖现有的配置文件
router.put('/:projectId/:roomTypeId/files', upload.single('file'), async (req, res) => {
  try {
    // Check if a file is uploaded and its type is correct
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file type is incorrect. Only Excel files are allowed.' });
    }

    // Extract projectId and roomTypeId from the URL parameters
    const { projectId, roomTypeId } = req.params;
    
    // Check if the roomTypeId and projectId are valid
    // const roomType = await RoomType.findById(roomTypeId);
    // const project = await Project.findById(projectId);
    // if (!roomType) {
    //   return res.status(404).send("Room Type not found");
    // }
    // if (!project) {
    //   console.log('here');
    //   return res.status(404).send("Project not found");
    // }

    const roomType = await validateRoomTypeAndProject(projectId, roomTypeId);

    // Check if the configuration exists for this project and room type
    const existingConfig = await RoomConfig.findOne({ projectId, roomTypeId });
    if (!existingConfig) {
      return res.status(404).send("Configuration not found for replacement");
    }

    // Convert the uploaded Excel file to JSON data
    const jsonData = await convertExcelToJson(req.file.buffer);

    // Update the existing configuration with the new data
    existingConfig.config = jsonData;
    existingConfig.typeCode = roomType.typeCode;
    
    await existingConfig.save();

    // Return a success response with the updated configuration
    res.status(200).json({
      result: "Configuration replaced successfully",
      config: jsonData
    });

  } catch (error) {
    console.error('Error replacing configuration:', error);
    res.status(500).send("Error replacing configuration");
  }
});

module.exports = router;