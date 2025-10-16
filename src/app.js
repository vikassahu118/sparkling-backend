import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';

const app = express();

// --- Core Middlewares ---

// CORS configuration should be first
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// CORRECTED: Body parsers must be right after CORS and before any routes.
// This ensures the request body is parsed before it's needed.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Other middlewares can come after
app.use(express.static('public'));
app.use(cookieParser());

// --- Health Check Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// --- API Routes ---
import apiRouter from './api/index.js';
app.use('/api/v1', apiRouter);

// --- Error Handling Middleware (Future Implementation) ---
// app.use((err, req, res, next) => { ... });

export { app };
