import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import apiRoutes from './routes/api.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Security & utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Ngenyangin API',
    docs: '/api/v1',
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;

