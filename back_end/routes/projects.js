const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // 引入uuid库
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
          resolve(projects);
        } catch (parseError) {
          console.error(`Error parsing JSON data: ${parseError.message}`);
          reject(parseError);
        }
      }
    });
  });
};

// ! API 2 - delete project by id
const deleteProjectById = (id) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'json_lists', 'projects_list.json');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      let projects = JSON.parse(data);
      projects = projects.filter(project => project.id !== id);
      fs.writeFile(filePath, JSON.stringify(projects, null, 2), (err) => {
        if (err) {
          return reject(err);
        }
        resolve(projects);
      });
    });
  });
};

// ! API 3 - add a new project
const addProject = (newProject) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'json_lists', 'projects_list.json');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      const projects = JSON.parse(data);
      const projectWithId = { ...newProject, id: uuidv4() }; // 生成唯一ID并添加到项目
      projects.push(projectWithId);
      fs.writeFile(filePath, JSON.stringify(projects, null, 2), (err) => {
        if (err) {
          return reject(err);
        }
        resolve(projectWithId); // 返回包含新ID的项目
      });
    });
  });
};

// handle GET requests for the projects list
router.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    res.status(500).send("Error reading the projects data.");
  }
});

// handle POST requests to delete a project by id
router.post('/delete', async (req, res) => {
  try {
    const projectId = req.body.id;
    const projects = await deleteProjectById(projectId);
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error in POST /api/projects/delete:", error);
    res.status(500).send("Error deleting the project.");
  }
});

// handle POST requests to add a new project
router.post('/', async (req, res) => {
  try {
    const newProject = req.body;
    const projectWithId = await addProject(newProject); // 返回包含新ID的项目
    res.status(201).json(projectWithId);
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    res.status(500).send("Error adding the project.");
  }
});

module.exports = router;