const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// ! API 1 - Get projects
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

// ! API 2 - Delete a project by name
const deleteProjectByName = (projectName) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'json_lists', 'projects_list.json');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        reject(err);
      } else {
        try {
          const projects = JSON.parse(data);
          const updatedProjects = projects.filter(project => project.name !== projectName);
          fs.writeFile(filePath, JSON.stringify(updatedProjects, null, 2), (writeErr) => {
            if (writeErr) {
              console.error(`Error writing file: ${writeErr.message}`);
              reject(writeErr);
            } else {
              resolve(updatedProjects);
            }
          });
        } catch (parseError) {
          console.error(`Error parsing JSON data: ${parseError.message}`);
          reject(parseError);
        }
      }
    });
  });
};

// ! API 3 - Add a new project
const addProject = (newProject) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'json_lists', 'projects_list.json');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        reject(err);
      } else {
        try {
          const projects = JSON.parse(data);
          projects.push(newProject);
          fs.writeFile(filePath, JSON.stringify(projects, null, 2), (writeErr) => {
            if (writeErr) {
              console.error(`Error writing file: ${writeErr.message}`);
              reject(writeErr);
            } else {
              resolve(projects);
            }
          });
        } catch (parseError) {
          console.error(`Error parsing JSON data: ${parseError.message}`);
          reject(parseError);
        }
      }
    });
  });
};

// Handle GET requests for the projects list
router.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    res.status(500).send("Error reading the projects data.");
  }
});

// Handle DELETE requests to remove a project by name
router.delete('/:name', async (req, res) => {
  try {
    const projectName = req.params.name;
    const updatedProjects = await deleteProjectByName(projectName);
    res.status(200).json(updatedProjects);
  } catch (error) {
    console.error("Error in DELETE /api/projects/:name:", error);
    res.status(500).send("Error deleting the project.");
  }
});

// Handle POST requests to add a new project
router.post('/', async (req, res) => {
  try {
    const newProject = req.body;
    const updatedProjects = await addProject(newProject);
    res.status(201).json(updatedProjects);
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    res.status(500).send("Error adding the project.");
  }
});

module.exports = router;