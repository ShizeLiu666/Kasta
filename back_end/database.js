const mongoose = require('mongoose');

// 连接到主数据库
const mainDB = mongoose.createConnection('mongodb://174.138.109.122:27017/kasta', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mainDB.on('error', console.error.bind(console, 'connection error:'));
mainDB.once('open', function() {
  console.log('Connected to main MongoDB');
});

// 定义模型
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mainDB.model('users', userSchema);

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true }
});
const Project = mainDB.model('projects', projectSchema);

const roomTypeSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projects', required: true },
  typeCode: { type: String, required: true },
  name: { type: String, required: true }
});
const RoomType = mainDB.model('roomTypes', roomTypeSchema);

const roomConfigSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projects', required: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'roomTypes', required: true },
  typeCode: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true }
});
const RoomConfig = mainDB.model('roomConfigs', roomConfigSchema);

// 初始化用户
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

mainDB.once('open', async function() {
  await initUsers();
  console.log('Users initialized');
});

module.exports = { User, Project, RoomType, RoomConfig };