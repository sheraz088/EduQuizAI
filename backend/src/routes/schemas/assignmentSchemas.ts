import { z } from 'zod';
import { RouteGenericInterface } from 'fastify';

// --- Schemas for Assignment Routes ---

// Schema for the non-file fields in multipart/form-data for creation
export const CreateAssignmentBodySchema = z.object({
    title: z.object({ value: z.string().min(1) }),
    description: z.object({ value: z.string().optional() }),
    dueDate: z.object({ value: z.string().datetime().optional() }) // Expect ISO string, will be new Date() in controller
    // File part is handled separately by multipart plugin
});

export const AssignmentParamsSchema = z.object({
  id: z.string().cuid() // Assumes CUIDs
});

// Schema for the non-file fields in multipart/form-data for submission
export const SubmitAssignmentBodySchema = z.object({
    textAnswer: z.object({ value: z.string().optional() })
    // File part is handled separately
});

// --- Generic Interfaces for Route Handlers ---

export interface GetAssignmentByIdRouteGeneric extends RouteGenericInterface {
    Params: z.infer<typeof AssignmentParamsSchema>;
}

// Note: Submit route only has params validated by schema, body is multipart
export interface SubmitAssignmentRouteGeneric extends RouteGenericInterface {
    Params: z.infer<typeof AssignmentParamsSchema>;
    // Body is not defined here as it's multipart/form-data handled manually
} 