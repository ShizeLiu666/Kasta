const express = require('express');
const { Project } = require('../database'); // Import the Project model
const router = express.Router();

// handle GET requests for the projects list
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find(); // Fetch projects from MongoDB
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
    const result = await Project.findByIdAndDelete(projectId); // Delete project from MongoDB

    if (result) {
      res.status(200).json({ message: 'Project deleted successfully' });
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error("Error in POST /api/projects/delete:", error);
    res.status(500).send("Error deleting the project.");
  }
});

// handle POST requests to add a new project
router.post('/', async (req, res) => {
  try {
    const { name, address, password } = req.body;
    const newProject = new Project({
      name,
      address,
      password
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    res.status(500).send("Error adding the project.");
  }
});

//! New route to verify project password
router.post('/verify_password', async (req, res) => {
  const { id, password } = req.body;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.password === password) {
      return res.status(200).json({ message: 'Password is correct' });
    } else {
      return res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Error in POST /api/projects/verify_password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;