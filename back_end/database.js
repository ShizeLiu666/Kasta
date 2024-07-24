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

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model('User', userSchema);

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

module.exports = User;