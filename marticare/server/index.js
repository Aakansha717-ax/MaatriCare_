
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from "./routes/ai.js";
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import vaccinationRoutes from './routes/vaccinations.js';
import reminderRoutes from './routes/reminders.js';
import appointmentRoutes from './routes/appointments.js';
import notificationRoutes from './routes/notifications.js';
import permissionRoutes from './routes/permissions.js';
import dataRoutes from './routes/data.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'MaatriCare API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
  });
});

// Diagnostic route
app.get('/api/debug-auth', (req, res) => {
  res.json({ message: 'Correct server is running!' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/data', dataRoutes);
app.use("/api/ai", aiRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
  });
});

// Error handler

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://maatri-care-mddg-fsesowgeg-escape-code.vercel.app',
  'https://maatri-care-mddg-git-main-escape-code.vercel.app',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

if (res.headersSent) {
  return next(err);
}

res.status(err.status || 500).json({
  message:
    err.status && err.status < 500
      ? err.message
      : 'Internal server error',
});

// Start only after MongoDB connects
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`MaatriCare API server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start MaatriCare API:', err.message);
    process.exitCode = 1;
  }
};

startServer();
