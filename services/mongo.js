const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas savienojums izveidots'))
  .catch(err => console.error('MongoDB kļūda:', err))
