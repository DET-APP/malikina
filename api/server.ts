import EXPRESS from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { initDatabase } from './db/schema.js';
import { xassidaRoutes } from './routes/xassidas.js';
import { authorRoutes } from './routes/authors.js';

dotenv.config();

const app = EXPRESS();
const PORT = process.env.PORT || 5000;

const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Malikina API',
      version: '1.0.0',
      description: 'REST API for authors, xassidas, verses, and PDF extraction.'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`,
        description: 'Current API server'
      }
    ],
    tags: [
      { name: 'Health' },
      { name: 'Authors' },
      { name: 'Xassidas' }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': { description: 'API is healthy' }
          }
        }
      },
      '/api/authors': {
        get: {
          tags: ['Authors'],
          summary: 'List all authors',
          responses: { '200': { description: 'Authors list' } }
        },
        post: {
          tags: ['Authors'],
          summary: 'Create author',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    photo_url: { type: 'string' },
                    birth_year: { type: 'integer' },
                    death_year: { type: 'integer' },
                    tradition: { type: 'string' }
                  },
                  required: ['name']
                }
              }
            }
          },
          responses: { '201': { description: 'Author created' } }
        }
      },
      '/api/authors/{id}': {
        get: {
          tags: ['Authors'],
          summary: 'Get one author',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Author details' },
            '404': { description: 'Author not found' }
          }
        },
        put: {
          tags: ['Authors'],
          summary: 'Update author',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Author updated' } }
        },
        delete: {
          tags: ['Authors'],
          summary: 'Delete author',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Author deleted' } }
        }
      },
      '/api/xassidas': {
        get: {
          tags: ['Xassidas'],
          summary: 'List all xassidas',
          responses: { '200': { description: 'Xassidas list' } }
        },
        post: {
          tags: ['Xassidas'],
          summary: 'Create xassida',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    author_id: { type: 'string' },
                    description: { type: 'string' }
                  },
                  required: ['title', 'author_id']
                }
              }
            }
          },
          responses: { '201': { description: 'Xassida created' } }
        }
      },
      '/api/xassidas/{id}': {
        get: {
          tags: ['Xassidas'],
          summary: 'Get one xassida with verses',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Xassida details' },
            '404': { description: 'Xassida not found' }
          }
        },
        put: {
          tags: ['Xassidas'],
          summary: 'Update xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Xassida updated' } }
        },
        delete: {
          tags: ['Xassidas'],
          summary: 'Delete xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Xassida deleted' } }
        }
      },
      '/api/xassidas/{id}/verses': {
        get: {
          tags: ['Xassidas'],
          summary: 'Get verses for a xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Verses list' } }
        },
        post: {
          tags: ['Xassidas'],
          summary: 'Save verses for a xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    verses: {
                      type: 'array',
                      items: { type: 'object' }
                    }
                  },
                  required: ['verses']
                }
              }
            }
          },
          responses: { '201': { description: 'Verses saved' } }
        }
      },
      '/api/xassidas/{id}/upload-pdf': {
        post: {
          tags: ['Xassidas'],
          summary: 'Upload PDF and extract verses',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary'
                    }
                  },
                  required: ['file']
                }
              }
            }
          },
          responses: { '200': { description: 'PDF processed' } }
        }
      }
    }
  },
  apis: []
});

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:8080,http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(EXPRESS.json({ limit: '50mb' }));
app.use(EXPRESS.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
await initDatabase();

// Routes
app.use('/api/xassidas', xassidaRoutes);
app.use('/api/authors', authorRoutes);
app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

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
  console.log(`   GET  /api/docs`);
  console.log(`   GET  /api/openapi.json`);
  console.log(`   GET  /api/xassidas`);
  console.log(`   POST /api/xassidas`);
  console.log(`   GET  /api/xassidas/:id`);
  console.log(`   PUT  /api/xassidas/:id`);
  console.log(`   DELETE /api/xassidas/:id`);
  console.log(`   GET  /api/xassidas/:id/verses`);
  console.log(`   POST /api/xassidas/:id/verses`);
});
