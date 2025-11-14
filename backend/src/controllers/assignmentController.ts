import { FastifyRequest, FastifyReply } from 'fastify';
import * as AssignmentService from '../services/assignmentService';
import { PrismaClientKnownRequestError } from '../generated/prisma/runtime/library';
import { saveFile } from '../utils/fileHandler';
import { MultipartFile } from '@fastify/multipart';
import { z } from 'zod';
import { AssignmentParamsSchema, GetAssignmentByIdRouteGeneric, SubmitAssignmentRouteGeneric } from '../routes/schemas/assignmentSchemas';

// --- Type Helper for Multipart Fields ---
// Fastify wraps non-file fields in objects with a 'value' property
interface MultipartFieldValue { value: any; }

// --- Controller Functions ---

// Handle generic multipart request first, validate fields inside
export const handleCreateAssignment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const creatorId = request.user.id;

        // Type assertion for multipart body
        const body = request.body as { [key: string]: MultipartFieldValue | MultipartFile };
        
        // Safely access field values
        const title = (body.title as MultipartFieldValue)?.value;
        const description = (body.description as MultipartFieldValue)?.value;
        const dueDateString = (body.dueDate as MultipartFieldValue)?.value;
        const filePart = body.file as MultipartFile | undefined;

        // Basic Manual Validation 
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return reply.badRequest('Missing or invalid title field.');
        }
        if (dueDateString && typeof dueDateString === 'string' && isNaN(Date.parse(dueDateString))) {
            return reply.badRequest('Invalid dueDate format (must be ISO string).');
        }
        if (description && typeof description !== 'string') {
             return reply.badRequest('Invalid description field.');
        }

        let filePath: string | null = null;
        if (filePart) {
            // Ensure it's a file part, not a field named 'file' accidentally
            if (!filePart.file || typeof filePart.fieldname === 'undefined') { 
                 return reply.badRequest('Invalid file field in request body.');
            }
            filePath = await saveFile(filePart);
        }

        const assignmentData = {
            title,
            description,
            creatorId,
            filePath,
            dueDate: dueDateString ? new Date(dueDateString) : undefined,
        };

        const newAssignment = await AssignmentService.createAssignment(assignmentData);
        reply.code(201).send(newAssignment);
    } catch (error) {
        request.log.error(error, 'Error creating assignment');
        if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

// Request type here can be generic as query params are optional
export const handleGetAllAssignments = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const userIdFromQuery = (request.query as { userId?: string }).userId;
        const userId = userIdFromQuery || request.user.id; // Default to logged-in user

        const assignments = await AssignmentService.getAllAssignments(userId);
        reply.send(assignments);
    } catch (error) {
        request.log.error(error, 'Error getting all assignments');
        reply.internalServerError('Failed to retrieve assignments');
    }
};

// Remove old GetAssignmentRequest type definition
// Update handler signature using FastifyRequest<RouteGenericInterfaceType>
export const handleGetAssignmentById = async (request: FastifyRequest<GetAssignmentByIdRouteGeneric>, reply: FastifyReply) => {
    try {
        const assignmentId = request.params.id; // Type is now inferred correctly
        const assignment = await AssignmentService.getAssignmentById(assignmentId);
        if (!assignment) {
            return reply.notFound(`Assignment with ID ${assignmentId} not found`);
        }
        reply.send(assignment);
    } catch (error) {
        request.log.error(error, 'Error getting assignment by ID');
         if (error instanceof PrismaClientKnownRequestError && error.code === 'P2023') {
            return reply.badRequest('Invalid Assignment ID format');
        }
        reply.internalServerError('Failed to retrieve assignment');
    }
};

// Remove old SubmitAssignmentRequest type definition
// Update handler signature using FastifyRequest<RouteGenericInterfaceType>
export const handleSubmitAssignment = async (request: FastifyRequest<SubmitAssignmentRouteGeneric>, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const userId = request.user.id;
        const assignmentId = request.params.id; // Type is now inferred correctly

        const body = request.body as { [key: string]: MultipartFieldValue | MultipartFile };
        const textAnswer = (body.textAnswer as MultipartFieldValue)?.value;
        const filePart = body.file as MultipartFile | undefined;
        
        let filePath: string | null = null;
        if (filePart) {
             if (!filePart.file || typeof filePart.fieldname === 'undefined') {
                 return reply.badRequest('Invalid file field in request body.');
             }
            filePath = await saveFile(filePart);
        }

        if (textAnswer === undefined && !filePath) {
            return reply.badRequest('Submission requires either textAnswer field or a file.');
        }
        if (textAnswer !== undefined && typeof textAnswer !== 'string') {
            return reply.badRequest('Invalid textAnswer field.');
        }

        const submissionData = { 
            assignmentId, 
            userId,
            textAnswer,
            filePath 
        };

        const newSubmission = await AssignmentService.submitAssignment(submissionData);
        reply.code(201).send(newSubmission);
    } catch (error) {
        request.log.error(error, 'Error submitting assignment');
        if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred');
        }
    }
};

// --- TODO: Add handlers for getting submissions, grading, etc. --- 