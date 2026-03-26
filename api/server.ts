import EXPRESS from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/schema.js';
import { xassidaRoutes } from './routes/xassidas.js';
import { authorRoutes } from './routes/authors.js';

dotenv.config();

const app = EXPRESS();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(EXPRESS.json());
app.use(EXPRESS.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
await initDatabase();

// Routes
app.use('/api/xassidas', xassidaRoutes);
app.use('/api/authors', authorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: EXPRESS.Request, res: EXPRESS.Response, next: EXPRESS.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`✅ Xassida API running on http://localhost:${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   GET  /api/xassidas`);
  console.log(`   POST /api/xassidas`);
  console.log(`   GET  /api/xassidas/:id`);
  console.log(`   PUT  /api/xassidas/:id`);
  console.log(`   DELETE /api/xassidas/:id`);
  console.log(`   GET  /api/xassidas/:id/verses`);
  console.log(`   POST /api/xassidas/:id/verses`);
});
