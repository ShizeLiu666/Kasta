const mongoose = require('mongoose');

// 连接到主数据库
const mainDB = mongoose.createConnection('mongodb://174.138.109.122:27017/kasta', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mainDB.on('error', console.error.bind(console, 'connection error:'));
mainDB.once('open', async function() {
  console.log('Connected to main MongoDB');

  // 检查并初始化集合
  await checkAndInitializeCollections();
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

// 检查并初始化集合
const checkAndInitializeCollections = async () => {
  const collections = await mainDB.db.listCollections().toArray();
  const collectionNames = collections.map(col => col.name);

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

  if (!collectionNames.includes('users')) {
    await initUsers();
    console.log('Users collection initialized.');
  }

  if (!collectionNames.includes('projects')) {
    await mainDB.createCollection('projects');
    console.log('Projects collection initialized');
  }

  if (!collectionNames.includes('roomTypes')) {
    await mainDB.createCollection('roomTypes');
    console.log('RoomTypes collection initialized');
  }

  if (!collectionNames.includes('roomConfigs')) {
    await mainDB.createCollection('roomConfigs');
    console.log('RoomConfigs collection initialized');
  }
};

module.exports = { User, Project, RoomType, RoomConfig };