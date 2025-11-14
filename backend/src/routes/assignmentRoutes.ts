import { FastifyInstance } from 'fastify';
import {
    AssignmentParamsSchema,
    // CreateAssignmentBodySchema, // Can't easily validate multipart body fields with Zod here
    // SubmitAssignmentBodySchema  // 
} from './schemas/assignmentSchemas';
import {
  handleCreateAssignment,
  handleGetAllAssignments,
  handleGetAssignmentById,
  handleSubmitAssignment
} from '../controllers/assignmentController';

// TODO: Add schemas for request validation

async function assignmentRoutes(server: FastifyInstance) {

  // GET /api/assignments - Get all assignments (requires auth to filter)
  server.get('/', {
      preHandler: [server.authenticate] // Ensure user is logged in
    }, 
    handleGetAllAssignments // Controller handles request type internally
  );

  // GET /api/assignments/:id - Get a specific assignment (requires auth)
  server.get('/:id', {
      schema: { 
          params: AssignmentParamsSchema 
      },
      preHandler: [server.authenticate]
    }, 
    handleGetAssignmentById // Controller handles request type internally
  );

  // POST /api/assignments - Create a new assignment (requires auth, multipart)
  server.post('/', {
      preHandler: [server.authenticate]
      // Validation is done inside the controller after parsing multipart
    }, 
    handleCreateAssignment // Controller handles request type internally
  );

  // POST /api/assignments/:id/submit - Submit an assignment (requires auth, multipart)
  server.post('/:id/submit', {
      schema: { 
          params: AssignmentParamsSchema 
      }, 
      preHandler: [server.authenticate]
      // Validation is done inside the controller after parsing multipart
    }, 
    handleSubmitAssignment // Controller handles request type internally
  );

  // --- TODO: Add routes for getting submissions, grading, etc. (teacher/admin only?) ---
  // server.get('/:id/submissions', { preHandler: [server.authenticate] }, handleGetSubmissions);
  // server.post('/submissions/:submissionId/grade', { preHandler: [server.authenticate] }, handleGradeSubmission);
}

export default assignmentRoutes; 