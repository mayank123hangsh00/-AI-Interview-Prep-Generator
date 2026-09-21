import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import kitRoutes from './routes/kits.js';

// Validate environment variables
validateEnv();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // If explicit client URL or local environment or any vercel.app deployment, allow it
    const allowed = [
      env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ].filter(Boolean);

    if (allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, origin);
    }

    // Dynamic fallback for any requesting origin to prevent CORS blocks on Vercel deployment URLs
    return callback(null, origin);
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Client URL: ${env.CLIENT_URL}`);
  });

  try {
    await connectDB();
  } catch (err) {
    console.error('⚠️ Initial MongoDB connection failed:', err);
  }
}

start().catch(console.error);

export default app;
