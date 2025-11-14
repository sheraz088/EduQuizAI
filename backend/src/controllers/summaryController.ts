import { FastifyRequest, FastifyReply } from 'fastify';
import * as SummaryService from '../services/summaryService';
import { saveFile } from '../utils/fileHandler';
import { MultipartFile } from '@fastify/multipart';

// --- Removed custom Request Type Definitions ---

// --- Controller Functions ---

export const handleCreateSummary = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const creatorId = request.user.id;

        // Process multipart data
        const data = await request.file(); // Use request.file() for single file upload
        
        if (!data) {
            return reply.badRequest('File upload is required for summary generation.');
        }
        
        // Explicitly cast the file part from the stream
        const filePart = data as unknown as MultipartFile;

        const originalFilePath = await saveFile(filePart);
        if (!originalFilePath) {
            return reply.internalServerError('Failed to save uploaded file.'); 
        }

        // --- Placeholder for Text Extraction & AI Summary Generation ---
        // 1. Extract text from originalFilePath
        // const extractedText = await extractText(originalFilePath);
        // 2. Call AI service to generate summary
        // const summaryText = await generateSummaryFromText(extractedText);
        const summaryText = `Placeholder summary for ${originalFilePath}. Replace with actual AI generation.`; // Placeholder
        // --- End Placeholder ---

        const summaryData = {
            originalFilePath,
            summaryText,
            creatorId,
        };

        const newSummary = await SummaryService.createSummary(summaryData);
        reply.code(201).send(newSummary);
    } catch (error) {
        request.log.error(error, 'Error creating summary');
        if (error instanceof Error) {
            reply.badRequest(error.message);
        } else {
            reply.internalServerError('An unexpected error occurred during summary creation');
        }
    }
};

export const handleGetAllSummaries = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (!request.user) return reply.unauthorized('Authentication required.');
        const userId = request.user.id; // Get summaries for the logged-in user

        const summaries = await SummaryService.getAllSummaries(userId);
        reply.send(summaries);
    } catch (error) {
        request.log.error(error, 'Error getting all summaries');
        reply.internalServerError('Failed to retrieve summaries');
    }
};

// --- TODO: Add handlers for getting specific summaries, deleting, etc. --- 