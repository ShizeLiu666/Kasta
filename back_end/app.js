const express = require('express');
const app = express();
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./database');
const projectsRouter = require('./routes/projects');
const authRouter = require('./routes/auth');
const roomTypesRouter = require('./routes/roomTypes');
const configRouter = require('./routes/config');

app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // Enable pre-flight (OPTIONS) requests for all routes

app.use('/api/projects', projectsRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects/:projectId/roomTypes', roomTypesRouter);
app.use('/api/projects/:projectId/config', configRouter);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
//