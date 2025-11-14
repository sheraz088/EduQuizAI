import { FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import util from 'util';

const pump = util.promisify(require('stream').pipeline);
const uploadsDir = path.join(__dirname, '../../uploads'); // Store uploads outside src

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Processes a single uploaded file from a multipart request and saves it.
 * @param part The multipart file data from the request.
 * @returns The relative path where the file was saved or null if no file.
 * @throws Error if file saving fails.
 */
export const saveFile = async (part: MultipartFile | undefined | null): Promise<string | null> => {
  if (!part || !part.file) {
    return null; // No file uploaded for this part
  }

  // Generate a unique filename (e.g., timestamp-originalName)
  const uniqueFilename = `${Date.now()}-${part.filename}`;
  const filePath = path.join(uploadsDir, uniqueFilename);

  try {
    await pump(part.file, fs.createWriteStream(filePath));
    console.log(`File saved successfully: ${filePath}`);
    // Return the path relative to the project root (or a URL if serving files)
    // Adjust this path based on how you intend to serve/access these files later
    return path.join('uploads', uniqueFilename).replace(/\\/g, '/'); // Use forward slashes for consistency
  } catch (err) {
    console.error('Error saving file:', err);
    // Clean up broken file if write failed
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    throw new Error(`Failed to save uploaded file: ${part.filename}`);
  }
}; 