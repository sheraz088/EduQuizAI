import { z } from 'zod';

// --- Schemas for Summary Routes ---

// Summary creation only involves file upload, 
// so no specific Zod schema for the body needed here.
// Validation (e.g., file type/size) is handled by multipart config.

export const SummaryParamsSchema = z.object({
  id: z.string().cuid() // If you add routes to get/delete specific summaries
}); 