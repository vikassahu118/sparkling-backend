import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';

const app = express();

// --- Core Middlewares ---

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '16kb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Serve static files (e.g., product images) from a 'public' directory
app.use(express.static('public'));

// Parse cookies
app.use(cookieParser());

// --- Health Check Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// --- API Routes ---
import apiRouter from './api/index.js';
app.use('/api/v1', apiRouter);

// --- Error Handling Middleware (TODO) ---
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.message || 'Internal Server Error',
//   });
// });

export { app };