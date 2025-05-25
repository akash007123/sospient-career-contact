require('dotenv').config(); // Load env variables at the top

const app = require('./app');
const mongoose = require('mongoose');
require('./config/db');

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

startServer();