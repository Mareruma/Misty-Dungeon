require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Atlas savienojums izveidots'))
.catch(err => console.error('MongoDB kļūda:', err));

module.exports = mongoose;
