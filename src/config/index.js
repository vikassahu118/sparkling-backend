import dotenv from 'dotenv';

dotenv.config();

// Centralized configuration object
export const config = {
  port: process.env.PORT,
  corsOrigin: process.env.CORS_ORIGIN,
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    accessExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY,
    refreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    refreshExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add OAuth keys here
};