import prisma from '../utils/prismaClient';

// --- Assignment Creation/Submission Data Types ---
interface CreateAssignmentInput {
  title: string;
  description?: string;
  filePath?: string | null; // Allow null
  dueDate?: Date;
  creatorId: string; // From authenticated user
  // Add assignedStudentsIds if assigning directly on creation
}

interface SubmitAssignmentInput {
  assignmentId: string;
  userId: string; // From authenticated user
  filePath?: string | null; // Allow null
  textAnswer?: string;
}

// --- Service Functions ---

export const createAssignment = async (data: CreateAssignmentInput) => {
  const { title, description, filePath, dueDate, creatorId } = data;

  if (!title || !creatorId) {
    throw new Error('Missing required fields for assignment creation');
  }

  return prisma.assignment.create({
    data: {
      title,
      description,
      filePath,
      dueDate,
      creator: {
        connect: { id: creatorId },
      },
      // TODO: Connect assignedStudents if provided
    },
    include: {
      creator: { select: { id: true, name: true } },
    },
  });
};

export const getAllAssignments = async (userId?: string) => {
   // Optional: Filter assignments by creator or assigned user
   const whereClause = userId ? {
    OR: [
      { creatorId: userId },
      // { assignedStudents: { some: { id: userId } } }
    ]
  } : {};

  return prisma.assignment.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { submissions: true } } 
    }
  });
};

export const getAssignmentById = async (assignmentId: string) => {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      creator: { select: { id: true, name: true } },
      submissions: {
          include: { user: { select: { id: true, name: true } } }
      }, // Include submissions
      // assignedStudents: true // Include assigned students
    },
  });
};

export const submitAssignment = async (data: SubmitAssignmentInput) => {
  const { assignmentId, userId, filePath, textAnswer } = data;

  if (!assignmentId || !userId || (!filePath && !textAnswer)) {
    throw new Error('Missing required fields for assignment submission');
  }

  // Optional: Check if assignment exists and if user is assigned
  // Optional: Check if submission deadline has passed

  return prisma.submission.create({
    data: {
      assignment: {
        connect: { id: assignmentId },
      },
      user: {
        connect: { id: userId },
      },
      filePath,
      textAnswer,
    },
  });
};

// --- TODO: Add functions for getting submissions, grading, etc. --- 