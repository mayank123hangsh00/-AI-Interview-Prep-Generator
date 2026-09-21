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
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});
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
    await connectDB();
    app.listen(env.PORT, () => {
        console.log(`🚀 Server running on port ${env.PORT}`);
        console.log(`   Environment: ${env.NODE_ENV}`);
        console.log(`   Client URL: ${env.CLIENT_URL}`);
    });
}
start().catch(console.error);
export default app;
//# sourceMappingURL=index.js.map