const express = require('express');
const fs = require('fs');
const path = require('path');
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

// ! API 2 - delete project by name
const deleteProject = (name) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'json_lists', 'projects_list.json');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      let projects = JSON.parse(data);
      projects = projects.filter(project => project.name !== name);
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
      projects.push(newProject);
      fs.writeFile(filePath, JSON.stringify(projects, null, 2), (err) => {
        if (err) {
          return reject(err);
        }
        resolve(projects);
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

// handle DELETE requests to delete a project by name
router.delete('/:name', async (req, res) => {
  try {
    const projectName = req.params.name;
    const projects = await deleteProject(projectName);
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error in DELETE /api/projects/:name:", error);
    res.status(500).send("Error deleting the project.");
  }
});

// handle POST requests to add a new project
router.post('/', async (req, res) => {
  try {
    const newProject = req.body;
    const projects = await addProject(newProject);
    res.status(201).json(projects);
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    res.status(500).send("Error adding the project.");
  }
});

module.exports = router;