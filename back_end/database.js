const mongoose = require('mongoose');

//! 连接到主数据库
const mainDB = mongoose.createConnection('mongodb://174.138.109.122:27017/kasta', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mainDB.on('error', console.error.bind(console, 'connection error:'));
mainDB.once('open', function() {
  console.log('Connected to main MongoDB');
});

//! 定义模型
// 用户模型
const userSchema = new mongoose.Schema({
  username: String,
  password: String
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

// 导出模型供其他模块使用
module.exports = { User, Project, RoomType, RoomConfig };