const express = require('express');
const fs = require('fs');
const path = require('path'); // 添加这行代码引入 path 模块
const router = express.Router();

// ! API 1 - get projects
const getProjects = () => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'json_lists', 'projects_list.json');
    console.log(`Reading file from: ${filePath}`);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        reject(err);
      } else {
        try {
          const projects = JSON.parse(data);
          console.log('Projects data:', projects);
          resolve(projects);
        } catch (parseError) {
          console.error(`Error parsing JSON data: ${parseError.message}`);
          reject(parseError);
        }
      }
    });
  });
};

// handle GET ’download‘ requests for the projects list
router.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    res.status(500).send("Error reading the projects data.");
  }
});

module.exports = router;