const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // 使用内存存储文件
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('Received file:', file.originalname);
    const filetypes = /xlsx|xls/;
    const mimetype = /application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application\/vnd.ms-excel/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    console.log('MIME type:', file.mimetype);
    console.log('Extension:', path.extname(file.originalname).toLowerCase());

    if (mimetype.test(file.mimetype) && extname) {
      return cb(null, true);
    } else {
      console.log('Invalid file type:', file.mimetype, path.extname(file.originalname).toLowerCase());
      return cb(new Error('Only Excel files are allowed'));
    }
  }
});

router.post('/convert', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!req.file) {
      console.error('No file uploaded or invalid file type');
      return res.status(400).json({ error: 'No file uploaded or file type is incorrect. Only Excel files are allowed.' });
    }
    
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }

    console.log('File uploaded successfully:', req.file.originalname);

    const scriptPath = path.join(__dirname, '..', 'convert.py');
    console.log('Script path:', scriptPath);

    const pythonExecutable = '/usr/bin/python3';  // 使用服务器上的Python 3解释器
    console.log('Python executable:', pythonExecutable);

    const pythonProcess = spawn(pythonExecutable, [scriptPath], { shell: true });

    pythonProcess.stdin.write(req.file.buffer);
    pythonProcess.stdin.end();

    let pythonOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        return res.status(500).send(`Python process exited with code ${code}`);
      }

      try {
        const result = JSON.parse(pythonOutput);
        res.json(result);
      } catch (err) {
        res.status(500).send('Error parsing JSON output from Python script');
      }
    });
  });
});

module.exports = router;