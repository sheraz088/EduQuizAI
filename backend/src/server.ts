import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, FastifyServerOptions } from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

// Import routes
import quizRoutes from './routes/quizRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import summaryRoutes from './routes/summaryRoutes';
// TODO: Import student, auth? routes if needed

// Load environment variables from .env file
dotenv.config();

// --- Type Augmentation for @fastify/jwt --- 
declare module '@fastify/jwt' {
    interface FastifyJWT {
      payload: { id: string; email: string; role: string }; // Define structure of JWT payload
      user: {
        id: string;
        email: string;
        role: string;
        // Add other relevant user fields from payload
      };
    }
}

// --- Type Augmentation for Fastify Instance (for Decorators) ---
declare module 'fastify' {
    export interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const buildServer = (opts: FastifyServerOptions = {}): FastifyInstance => {
  // Initialize Fastify with Zod type provider
  const server: FastifyInstance = Fastify(opts).withTypeProvider<ZodTypeProvider>();

  // Set Zod as the validator and serializer
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // --- Register Core Plugins ---
  server.register(cors, {
    // Configure CORS appropriately for your frontend URL in production
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  server.register(sensible); // Adds useful utilities like http errors
  server.register(multipart, {
      // Example limits - adjust as needed
      limits: {
          fieldNameSize: 100, // Max field name size in bytes
          fieldSize: 1000000, // Max field value size in bytes
          fields: 10,         // Max number of non-file fields
          fileSize: 10000000, // For multipart forms, the max file size in bytes (10MB here)
          files: 1,           // Max number of file fields
          headerPairs: 2000   // Max number of header key=>value pairs
      }
  });
  server.register(jwt, {
      secret: process.env.JWT_SECRET || 'fallback-secret-key-replace-in-env' // Ensure JWT_SECRET is set in .env!
  });

  // --- Authentication Decorator ---
  // This decorator verifies the JWT and attaches user info to the request
  // You would call request.authenticate() in route preHandlers
  server.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      // request.user is now populated based on the token payload
    } catch (err) {
      reply.code(401).send({ message: "Authentication required", error: "Unauthorized" });
    }
  });

  // Simple health check route
  server.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  // --- Register Application Routes ---
  server.register(quizRoutes, { prefix: '/api/quizzes' });
  server.register(assignmentRoutes, { prefix: '/api/assignments' });
  server.register(summaryRoutes, { prefix: '/api/summaries' });
  // TODO: Register other routes (student, auth?)

  return server;
};

const start = async () => {
  const server = buildServer({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await server.listen({ port: port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
  // Note: Removed console.log as Fastify logger handles startup message
};

if (require.main === module) {
  start();
} else {
  module.exports = buildServer;
} 