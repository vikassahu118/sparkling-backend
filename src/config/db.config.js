import pg from 'pg';
import { config } from './index.js';

// Create a new pool instance
const pool = new pg.Pool({
  user: config.db.user,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Function to test the database connection
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL database connected successfully.');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0].now);
    client.release();
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
    throw error;
  }
};

// Export a query function to be used by models
export const db = {
  query: (text, params) => pool.query(text, params),
};