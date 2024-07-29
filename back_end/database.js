const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/kasta', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model('users', userSchema);

// Project Schema and Model
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true }
});

const Project = mongoose.model('projects', projectSchema);

// RoomType Schema and Model
const roomTypeSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projects', required: true },
  typeCode: { type: String, required: true },
  name: { type: String, required: true }
});

const RoomType = mongoose.model('roomTypes', roomTypeSchema);

// RoomConfig Schema and Model
const roomConfigSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projects', required: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'roomTypes', required: true },
  typeCode: { type: String, required: true }, // Add typeCode field
  config: { type: mongoose.Schema.Types.Mixed, required: true }
});

const RoomConfig = mongoose.model('roomConfigs', roomConfigSchema);

// Initialize Users
const initUsers = async () => {
  const users = [
    { username: 'jackliu@haneco.com.au', password: 'kasta' }
  ];

  for (const user of users) {
    const existingUser = await User.findOne({ username: user.username });
    if (!existingUser) {
      await new User(user).save();
    }
  }
};

initUsers();

module.exports = { User, Project, RoomType, RoomConfig };