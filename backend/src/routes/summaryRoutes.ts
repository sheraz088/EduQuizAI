import { FastifyInstance } from 'fastify';
import {
  handleCreateSummary,
  handleGetAllSummaries
} from '../controllers/summaryController';
import {
    SummaryParamsSchema 
} from './schemas/summarySchemas';

// TODO: Add schemas for request validation

async function summaryRoutes(server: FastifyInstance) {

  // --- Authenticated Routes ---

  // POST /api/summaries - Create a new summary (requires auth, multipart)
  server.post('/', {
      preHandler: [server.authenticate]
      // File upload handled by multipart, validation in controller
    }, 
    handleCreateSummary
  );

  // GET /api/summaries - Get all summaries for the logged-in user (requires auth)
  server.get('/', {
      preHandler: [server.authenticate]
    }, 
    handleGetAllSummaries
  );

  // --- TODO: Add routes for getting specific summaries, deleting, etc. ---
  // server.get('/:id', { schema: { params: SummaryParamsSchema }, preHandler: [server.authenticate] }, handleGetSummaryById);
  // server.delete('/:id', { schema: { params: SummaryParamsSchema }, preHandler: [server.authenticate] }, handleDeleteSummary);

}

export default summaryRoutes; 