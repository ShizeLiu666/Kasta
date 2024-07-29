const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./database');
const projectsRouter = require('./routes/projects');
const authRouter = require('./routes/auth');
const roomTypesRouter = require('./routes/roomTypes');
const configRouter = require('./routes/config');
const excelToJsonRouter = require('./routes/excelToJson');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://174.138.109.122:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // Enable pre-flight (OPTIONS) requests for all routes

app.use('/api/projects', projectsRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects/:projectId/roomTypes', roomTypesRouter);
app.use('/api/config/:projectId/:roomTypeId', configRouter); // Updated route for config
app.use('/api/excelToJson', excelToJsonRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;