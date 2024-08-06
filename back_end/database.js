const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const mongoURI_development = 'mongodb://localhost:27017';
const production_development = 'mongodb://admin:kasta_31July@174.138.109.122:27017/kasta?authSource=admin';

// 连接到数据库
const mainDB = mongoose.createConnection(production_development);

mainDB.on('error', (error) => {
  console.error('Database connection error:', error);
});
mainDB.once('open', async function() {
  console.log('Connected to main MongoDB');

  // 检查并初始化用户
  await initializeUser();
});

// 定义模型
// 用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mainDB.model('users', userSchema);

// 项目模型
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true }
});
const Project = mainDB.model('projects', projectSchema);

// 房间类型模型
const roomTypeSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projects', required: true },
  typeCode: { type: String, required: true },
  name: { type: String, required: true }
});
const RoomType = mainDB.model('roomTypes', roomTypeSchema);

// 房间配置模型
const roomConfigSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projects', required: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'roomTypes', required: true },
  typeCode: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true }
});
const RoomConfig = mainDB.model('roomConfigs', roomConfigSchema);

// 初始化用户
const initializeUser = async () => {
  const defaultUser = {
    username: 'jackliu@haneco.com.au',
    password: 'kasta'
  };

  const user = await User.findOne({ username: defaultUser.username });
  if (!user) {
    const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
    const newUser = new User({
      username: defaultUser.username,
      password: hashedPassword
    });
    await newUser.save();
    console.log('Default user initialized.');
  } else {
    console.log('Default user already exists.');
  }
};

// 导出模型供其他模块使用
module.exports = { User, Project, RoomType, RoomConfig };
