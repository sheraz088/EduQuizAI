import { FastifyRequest, FastifyReply, RouteHandlerMethod } from 'fastify';
import * as QuizService from '../services/quizService';
import { PrismaClientKnownRequestError } from '../generated/prisma/runtime/library';
import { saveFile } from '../utils/fileHandler';
import { MultipartFile } from '@fastify/multipart';
import { z } from 'zod';
import { QuizParamsSchema, SubmitAnswersRouteGeneric, GetQuizResultsRouteGeneric, OnlineQuizSubmissionRouteGeneric } from '../routes/schemas/quizSchemas';
import { QuizType } from '../generated/prisma';

// --- Type Helper for Multipart Fields ---
interface MultipartFieldValue { value: any; }

// --- Request Type Definitions ---
interface QuizBodyData {
    title: string;
    description?: string;
    type: 'MCQ' | 'DESCRIPTIVE' | 'MIXED';
    timeLimitMinutes?: number;
    randomizeQuestions?: boolean;
    questions: string; // Expecting JSON string for questions
    file?: MultipartFile;
}

type CreateQuizRequest = FastifyRequest<{
    Body: QuizBodyData;
}>;

type GetQuizRequest = FastifyRequest<{ Params: z.infer<typeof QuizParamsSchema> }>;
type GetAllQuizzesRequest = FastifyRequest<{ Querystring: { userId?: string }; }>;

// --- Controller Functions ---

export const handleCreateQuiz = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const creatorId = request.user.id;

        const body = request.body as { [key: string]: MultipartFieldValue | MultipartFile };

        // Safely access non-file fields
        const title = (body.title as MultipartFieldValue)?.value;
        const description = (body.description as MultipartFieldValue)?.value;
        const typeString = (body.type as MultipartFieldValue)?.value;
        const timeLimitMinutes = (body.timeLimitMinutes as MultipartFieldValue)?.value;
        const randomizeQuestions = (body.randomizeQuestions as MultipartFieldValue)?.value;
        const questionsJsonString = (body.questions as MultipartFieldValue)?.value;
        const filePart = body.file as MultipartFile | undefined;

        // --- Basic Validation ---
        if (!title || typeof title !== 'string' || title.trim() === '') {
             return reply.badRequest('Missing or invalid title field.');
        }
        // Validate type and assert it
        if (!typeString || typeof typeString !== 'string' || !['MCQ', 'DESCRIPTIVE', 'MIXED'].includes(typeString)) {
             return reply.badRequest('Missing or invalid quiz type field (MCQ, DESCRIPTIVE, MIXED).');
        }
        const type = typeString as QuizType; // Type assertion after validation

        if (!questionsJsonString || typeof questionsJsonString !== 'string') {
            return reply.badRequest('Missing or invalid questions field (must be JSON string).');
        }
        // Add more checks for other fields (timeLimitMinutes format, randomizeQuestions boolean etc.)

        let parsedQuestions;
        try {
            parsedQuestions = JSON.parse(questionsJsonString);
            // TODO: Add detailed validation for the *structure* of parsedQuestions using Zod (maybe QuestionSchema from quizSchemas)
        } catch (e) {
            return reply.badRequest('Invalid JSON format for questions data.');
        }

        let filePath: string | null = null;
        if (filePart) {
            if (!filePart.file || typeof filePart.fieldname === 'undefined') {
                return reply.badRequest('Invalid file field in request body.');
            }
            filePath = await saveFile(filePart);
            // TODO: Add text extraction logic here if needed
            // const extractedText = await extractText(filePath);
            // TODO: Add AI question generation logic here if needed
            // const generatedQuestions = await generateQuestionsFromText(extractedText, type);
            // Potentially merge/replace parsedQuestions with generatedQuestions
        }

        const quizData = {
            title,
            description,
            type,
            timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
            randomizeQuestions: randomizeQuestions === true || String(randomizeQuestions).toLowerCase() === 'true',
            creatorId,
            questions: parsedQuestions // Using provided/parsed questions
        };

        const newQuiz = await QuizService.createQuiz(quizData);
        reply.code(201).send(newQuiz);
    } catch (error) {
        request.log.error(error, 'Error creating quiz');
        if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

export const handleGetAllQuizzes = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const userIdFromQuery = (request.query as { userId?: string }).userId;
        const userId = userIdFromQuery || request.user.id; 

        const quizzes = await QuizService.getAllQuizzes(userId);
        reply.send(quizzes);
    } catch (error) {
        request.log.error(error, 'Error getting all quizzes');
        reply.internalServerError('Failed to retrieve quizzes');
    }
};

export const handleGetQuizById = async (request: GetQuizRequest, reply: FastifyReply) => {
    try {
        const quizId = request.params.id;
        const quiz = await QuizService.getQuizById(quizId);
        if (!quiz) {
            return reply.notFound(`Quiz with ID ${quizId} not found`);
        }
        reply.send(quiz);
    } catch (error) {
        request.log.error(error, 'Error getting quiz by ID');
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2023') {
            return reply.badRequest('Invalid Quiz ID format');
        }
        reply.internalServerError('Failed to retrieve quiz');
    }
};

export const handleSubmitAnswers = async (request: FastifyRequest<SubmitAnswersRouteGeneric>, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const userId = request.user.id;
        const quizId = request.params.id;
        const answers = request.body.answers;

        await QuizService.submitQuizAnswers(quizId, userId, answers);
        reply.code(201).send({ message: 'Answers submitted successfully' });

    } catch (error) {
        request.log.error(error, 'Error submitting quiz answers');
        if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

export const handleGetQuizResults = async (request: FastifyRequest<GetQuizResultsRouteGeneric>, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const userId = request.user.id;
        const quizId = request.params.id;

        const results = await QuizService.getQuizResults(quizId, userId);
        reply.send(results);

    } catch (error) {
        request.log.error(error, 'Error fetching quiz results');
        if (error instanceof Error && error.message === 'Quiz not found') {
            reply.notFound('Quiz not found');
        } else if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

// New controller function for creating online quizzes
export const handleCreateOnlineQuiz = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const creatorId = request.user.id;

        const body = request.body as any;
        
        // Validate required fields for online quiz
        const { title, questions, timeLimitMinutes, randomizeQuestions } = body;
        
        if (!title || typeof title !== 'string') {
            return reply.badRequest('Missing or invalid title field.');
        }
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return reply.badRequest('Questions array is required and must not be empty.');
        }
        
        // Create the online quiz
        const quizData = {
            title,
            description: body.description,
            type: 'MCQ' as QuizType, // Online quizzes are always MCQ
            timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
            randomizeQuestions: randomizeQuestions === true || randomizeQuestions === 'true',
            creatorId,
            questions: questions,
            isOnlineAttempt: true // Mark as online attempt
        };

        const newQuiz = await QuizService.createOnlineQuiz(quizData);
        reply.code(201).send(newQuiz);
    } catch (error) {
        request.log.error(error, 'Error creating online quiz');
        if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

// New controller function for getting online quiz by ID
export const handleGetOnlineQuizById = async (request: FastifyRequest<{ Params: z.infer<typeof QuizParamsSchema> }>, reply: FastifyReply) => {
    try {
        const quizId = request.params.id;
        const quiz = await QuizService.getOnlineQuizById(quizId);
        
        if (!quiz) {
            return reply.notFound(`Quiz with ID ${quizId} not found`);
        }
        
        if (!quiz.isOnlineAttempt) {
            return reply.badRequest('This quiz is not configured for online attempts');
        }
        
        // For security, don't send correct answers to client
        const safeQuiz = {
            ...quiz,
            questions: quiz.questions.map(q => ({
                ...q,
                options: q.options.map(o => ({
                    id: o.id,
                    text: o.text
                    // isCorrect is deliberately omitted
                }))
            }))
        };
        
        reply.send(safeQuiz);
    } catch (error) {
        request.log.error(error, 'Error getting online quiz by ID');
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2023') {
            return reply.badRequest('Invalid Quiz ID format');
        }
        reply.internalServerError('Failed to retrieve quiz');
    }
};

// New controller function for submitting student quiz answers with enrollment details
export const handleSubmitOnlineQuiz = async (request: FastifyRequest<OnlineQuizSubmissionRouteGeneric>, reply: FastifyReply) => {
    try {
        const quizId = request.params.id;
        const { answers, studentName, enrollmentNumber, email } = request.body;
        
        // Validate the quiz exists and is an online quiz
        const quiz = await QuizService.getQuizById(quizId);
        if (!quiz) {
            return reply.notFound(`Quiz with ID ${quizId} not found`);
        }
        
        if (!quiz.isOnlineAttempt) {
            return reply.badRequest('This quiz is not configured for online attempts');
        }
        
        // Format the answers for storage
        const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            optionId,
            // No textAnswer for MCQ
        }));
        
        // Create a virtual/temporary user for the student or find existing
        const studentDetails = {
            name: studentName,
            enrollmentNumber,
            email,
            quizId
        };
        
        // Submit answers and get results
        const results = await QuizService.submitOnlineQuizWithStudentDetails(
            quizId, 
            formattedAnswers, 
            studentDetails
        );
        
        reply.code(201).send(results);
    } catch (error) {
        request.log.error(error, 'Error submitting online quiz');
        if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

// New controller function for getting student quiz results
export const handleGetQuizStudentResults = async (request: FastifyRequest<{ Params: z.infer<typeof QuizParamsSchema> }>, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const userId = request.user.id;
        const quizId = request.params.id;

        // Get the quiz to check if user is the creator
        const quiz = await QuizService.getQuizById(quizId);
        if (!quiz) {
            return reply.notFound(`Quiz with ID ${quizId} not found`);
        }
        
        // Only allow the quiz creator to see the results
        if (quiz.creatorId !== userId) {
            return reply.forbidden('You are not authorized to view the results for this quiz');
        }
        
        // Get all student results for this quiz
        const results = await QuizService.getQuizStudentResults(quizId);
        reply.send(results);

    } catch (error) {
        request.log.error(error, 'Error fetching student quiz results');
        if (error instanceof Error && error.message === 'Quiz not found') {
            reply.notFound('Quiz not found');
        } else if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

// --- TODO: Add handlers for updating, deleting quizzes --- 