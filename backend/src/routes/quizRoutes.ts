import { FastifyInstance } from 'fastify';
import {
  handleCreateQuiz,
  handleGetAllQuizzes,
  handleGetQuizById,
  handleSubmitAnswers,
  handleGetQuizResults,
  handleCreateOnlineQuiz,
  handleGetOnlineQuizById,
  handleSubmitOnlineQuiz,
  handleGetQuizStudentResults
} from '../controllers/quizController';
import {
    CreateQuizBodySchema,
    QuizParamsSchema,
    SubmitAnswersBodySchema,
    OnlineQuizSubmissionSchema
} from './schemas/quizSchemas';

// TODO: Add schemas for request validation (e.g., using Zod)
// import { createQuizSchema, quizParamsSchema, quizAnswersSchema } from './schemas/quizSchemas';

async function quizRoutes(server: FastifyInstance) {

  // --- Public or Authenticated Routes (adjust based on auth strategy) ---

  // GET /api/quizzes - Get all quizzes (potentially filtered)
  server.get('/', {
    // Add preHandler: [server.authenticate] if needed for filtering based on user
  }, handleGetAllQuizzes);

  // GET /api/quizzes/:id - Get a specific quiz by ID
  server.get(
    '/:id',
    {
      schema: { params: QuizParamsSchema }
      // Add preHandler: [server.authenticate] if auth needed to view
    },
    handleGetQuizById
  );

  // GET /api/quizzes/online/:id - Get a specific online quiz by ID
  server.get(
    '/online/:id',
    {
      schema: { params: QuizParamsSchema }
    },
    handleGetOnlineQuizById
  );

  // GET /api/quizzes/:id/student-results - Get student results for a quiz
  server.get(
    '/:id/student-results',
    {
      schema: { params: QuizParamsSchema },
      preHandler: [server.authenticate] // Only the creator should see results
    },
    handleGetQuizStudentResults
  );

  // --- Authenticated Routes (Requires user to be logged in) ---

  // POST /api/quizzes - Create a new quiz (Multipart)
  server.post(
    '/',
    {
      // Note: Zod schema validates the non-file fields parsed by multipart
      // Actual file validation (size, type) is handled by @fastify/multipart config
      // We don't define a Zod schema for the full multipart body here.
      preHandler: [server.authenticate] // Requires authentication
    },
    handleCreateQuiz
  );

  // POST /api/quizzes/online - Create an online quiz
  server.post(
    '/online',
    {
      preHandler: [server.authenticate] // Requires authentication
    },
    handleCreateOnlineQuiz
  );

  // POST /api/quizzes/:id/submit - Submit answers for a quiz
  server.post(
    '/:id/submit',
    {
      schema: { params: QuizParamsSchema, body: SubmitAnswersBodySchema },
      preHandler: [server.authenticate] // Requires authentication
    },
    handleSubmitAnswers
  );

  // POST /api/quizzes/online/:id/submit - Submit answers for an online quiz with student details
  server.post(
    '/online/:id/submit',
    {
      schema: { params: QuizParamsSchema, body: OnlineQuizSubmissionSchema }
    },
    handleSubmitOnlineQuiz
  );

  // GET /api/quizzes/:id/results - Get results for a specific quiz (for the logged-in user)
  server.get(
    '/:id/results',
    {
      schema: { params: QuizParamsSchema },
      preHandler: [server.authenticate] // Requires authentication
    },
    handleGetQuizResults
  );

  // --- TODO: Add routes for updating and deleting quizzes (likely restricted to creators/admins) ---
  // server.put('/:id', { preHandler: [server.authenticate], schema: {...} }, handleUpdateQuiz);
  // server.delete('/:id', { preHandler: [server.authenticate], schema: {...} }, handleDeleteQuiz);
}

export default quizRoutes; 