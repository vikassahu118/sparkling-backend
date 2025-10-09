import dotenv from 'dotenv';
import { app } from './src/app.js';
import { connectDB } from './src/config/db.config.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect to the database
connectDB()
  .then(() => {
    // Start the server only if the database connection is successful
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port: ${PORT}`);
    });

    app.on('error', (error) => {
      console.error('Express app error:', error);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Database connection failed!', err);
    process.exit(1);
  });