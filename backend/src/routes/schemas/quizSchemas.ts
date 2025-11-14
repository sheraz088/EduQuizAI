import { z } from 'zod';

// --- Common Schemas ---
const QuizTypeEnum = z.enum(['MCQ', 'DESCRIPTIVE', 'MIXED']);
const QuestionTypeEnum = z.enum(['MCQ', 'DESCRIPTIVE']);

const OptionSchema = z.object({
    text: z.string().min(1),
    isCorrect: z.boolean()
});

const QuestionSchema = z.object({
    text: z.string().min(1),
    type: QuestionTypeEnum,
    order: z.number().int().min(0),
    options: z.array(OptionSchema).optional() // Required only if type is MCQ
}).refine(data => {
    // If type is MCQ, options must be provided and have at least one correct answer
    if (data.type === 'MCQ') {
        if (!data.options || data.options.length === 0) return false;
        return data.options.some(opt => opt.isCorrect);
    }
    return true; // Descriptive questions don't need options
}, {
    message: "MCQ questions must have options with at least one marked as correct.",
    path: ['options'], // path of error
});

// --- Route Specific Schemas ---

// Schema for the JSON string part of the multipart form
export const CreateQuizBodySchema = z.object({
    title: z.object({ value: z.string().min(1) }),
    description: z.object({ value: z.string().optional() }),
    type: z.object({ value: QuizTypeEnum }),
    timeLimitMinutes: z.object({ value: z.coerce.number().int().positive().optional() }), // Coerce allows string input
    randomizeQuestions: z.object({ value: z.coerce.boolean().optional() }),
    questions: z.object({ value: z.string().min(1).refine((val) => {
        try { 
            const parsed = JSON.parse(val);
            // Validate the parsed structure against an array of QuestionSchema
            return z.array(QuestionSchema).min(1).safeParse(parsed).success;
        } catch { 
            return false; 
        }
    }, { message: "Questions must be a valid JSON string representing an array of questions matching the schema." }) })
    // Note: File validation happens via multipart plugin limits, not easily in Zod for the stream itself
});

export const QuizParamsSchema = z.object({
  id: z.string().cuid() // Assumes you use CUIDs as IDs
});

export const SubmitAnswersBodySchema = z.object({
    answers: z.array(z.object({
        questionId: z.string().cuid(),
        optionId: z.string().cuid().optional(),
        textAnswer: z.string().optional()
    })).min(1)
});

// Schema for online quiz submissions by students
export const OnlineQuizSubmissionSchema = z.object({
    answers: z.record(z.string(), z.string()), // questionId -> optionId mapping
    studentName: z.string().min(1, "Student name is required"),
    enrollmentNumber: z.string().min(1, "Enrollment number is required"),
    email: z.string().email().optional()
});

// --- Types for Route Schemas ---
// These define the structure for schema validation
export const SubmitAnswersRouteSchema = {
    Params: QuizParamsSchema,
    Body: SubmitAnswersBodySchema
};

export const GetQuizResultsRouteSchema = {
    Params: QuizParamsSchema
};

export const OnlineQuizSubmissionRouteSchema = {
    Params: QuizParamsSchema,
    Body: OnlineQuizSubmissionSchema
};

// --- Generic Interfaces for Route Handlers ---
// These are used to type the handlers themselves
import { RouteGenericInterface } from 'fastify';

export interface SubmitAnswersRouteGeneric extends RouteGenericInterface {
    Params: z.infer<typeof QuizParamsSchema>;
    Body: z.infer<typeof SubmitAnswersBodySchema>;
}

export interface GetQuizResultsRouteGeneric extends RouteGenericInterface {
    Params: z.infer<typeof QuizParamsSchema>;
}

export interface OnlineQuizSubmissionRouteGeneric extends RouteGenericInterface {
    Params: z.infer<typeof QuizParamsSchema>;
    Body: z.infer<typeof OnlineQuizSubmissionSchema>;
}