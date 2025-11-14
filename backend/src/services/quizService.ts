import prisma from '../utils/prismaClient';
import { Prisma } from '../generated/prisma';

// --- Quiz Creation Data Types ---
// Define more specific types based on frontend input
interface CreateQuizInput {
  title: string;
  description?: string;
  type: 'MCQ' | 'DESCRIPTIVE' | 'MIXED'; // Matches Prisma enum
  timeLimitMinutes?: number;
  randomizeQuestions?: boolean;
  creatorId: string; // Assuming this comes from the authenticated user context
  questions: CreateQuestionInput[];
}

interface CreateQuestionInput {
  text: string;
  type: 'MCQ' | 'DESCRIPTIVE'; // Matches Prisma enum
  order: number;
  options?: CreateOptionInput[]; // Only for MCQ
}

interface CreateOptionInput {
  text: string;
  isCorrect: boolean;
}

// Define student details interface for online quizzes
interface StudentDetails {
  name: string;
  enrollmentNumber: string;
  email?: string;
  quizId: string;
}

// --- Service Functions ---

export const createQuiz = async (data: CreateQuizInput) => {
  const { title, description, type, timeLimitMinutes, randomizeQuestions, creatorId, questions } = data;

  // Basic validation (more robust validation should happen at the controller/route level)
  if (!title || !type || !creatorId || !questions || questions.length === 0) {
    throw new Error('Missing required fields for quiz creation');
  }

  return prisma.quiz.create({
    data: {
      title,
      description,
      type,
      timeLimitMinutes,
      randomizeQuestions,
      creator: {
        connect: { id: creatorId },
      },
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          type: q.type,
          order: q.order,
          options: q.type === 'MCQ' && q.options ? {
            create: q.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          } : undefined,
        })),
      },
    },
    include: {
      questions: {
        include: {
          options: true, // Include options when fetching the created quiz
        },
      },
      creator: {
        select: { id: true, name: true, email: true } // Select specific creator fields
      }
    },
  });
};

export const getAllQuizzes = async (userId?: string) => {
  // Optional: Filter quizzes by creator or assigned user if userId is provided
  const whereClause = userId ? {
    OR: [
      { creatorId: userId },
      // Add logic here if you implement assigning quizzes to users
      // { assignedStudents: { some: { id: userId } } }
    ]
  } : {};

  return prisma.quiz.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { questions: true } } // Get the count of questions
    }
  });
};

export const getQuizById = async (quizId: string) => {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      creator: { select: { id: true, name: true } },
      questions: {
        orderBy: { order: 'asc' }, // Ensure questions are ordered
        include: {
          options: true, // Include options for MCQ questions
        },
      },
    },
  });
};

// Create online quiz function
export const createOnlineQuiz = async (data: CreateQuizInput & { isOnlineAttempt: boolean }) => {
  const { title, description, type, timeLimitMinutes, randomizeQuestions, creatorId, questions, isOnlineAttempt } = data;

  // Basic validation (more robust validation should happen at the controller/route level)
  if (!title || !type || !creatorId || !questions || questions.length === 0) {
    throw new Error('Missing required fields for quiz creation');
  }

  return prisma.quiz.create({
    data: {
      title,
      description,
      type,
      timeLimitMinutes,
      randomizeQuestions,
      isOnlineAttempt, // Set flag for online quiz
      creator: {
        connect: { id: creatorId },
      },
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          type: q.type,
          order: q.order,
          options: q.type === 'MCQ' && q.options ? {
            create: q.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          } : undefined,
        })),
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
      creator: {
        select: { id: true, name: true, email: true }
      }
    },
  });
};

// New function to get online quiz by ID
export const getOnlineQuizById = async (quizId: string) => {
  return prisma.quiz.findFirst({
    where: { 
      id: quizId,
      isOnlineAttempt: true
    },
    include: {
      creator: { select: { id: true, name: true } },
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: true,
        },
      },
    },
  });
};

export const submitQuizAnswers = async (quizId: string, userId: string, answers: { questionId: string; optionId?: string; textAnswer?: string }[]) => {
    // Basic validation
    if (!quizId || !userId || !answers || answers.length === 0) {
        throw new Error('Missing required fields for submitting answers');
    }

    // In a real app, you'd fetch the quiz questions to validate answers,
    // check if the quiz is timed and if the time limit is exceeded, etc.
    // For MCQs, you could pre-calculate correctness here.

    const answersToCreate = answers.map(ans => ({
        userId: userId,
        questionId: ans.questionId,
        quizId: quizId, // Denormalized
        optionId: ans.optionId,
        textAnswer: ans.textAnswer,
        // isCorrect: calculate correctness if possible
    }));

    // Use a transaction to ensure all answers are created or none
    return prisma.$transaction([
        ...answersToCreate.map(data => prisma.answer.create({ data }))
    ]);
};

// New function to handle student quiz submissions
export const submitOnlineQuizWithStudentDetails = async (
  quizId: string, 
  answers: { questionId: string; optionId?: string; textAnswer?: string }[],
  studentDetails: StudentDetails
) => {
  // Check if the quiz exists
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  });

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  if (!quiz.isOnlineAttempt) {
    throw new Error('This quiz is not available for online attempts');
  }

  // Create or find the student record in QuizStudent table
  const quizStudent = await prisma.quizStudent.upsert({
    where: {
      quizId_enrollmentNumber: {
        quizId: quizId,
        enrollmentNumber: studentDetails.enrollmentNumber
      }
    },
    update: {
      name: studentDetails.name,
      email: studentDetails.email
    },
    create: {
      quizId: quizId,
      name: studentDetails.name,
      enrollmentNumber: studentDetails.enrollmentNumber,
      email: studentDetails.email
    }
  });

  // Calculate the score
  let correctCount = 0;
  const totalQuestions = quiz.questions.length;
  
  // Create the results array with correctness info
  const results = answers.map(answer => {
    const question = quiz.questions.find(q => q.id === answer.questionId);
    if (!question) return null;
    
    let isCorrect = false;
    if (question.type === 'MCQ' && answer.optionId) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      isCorrect = answer.optionId === correctOption?.id;
      if (isCorrect) correctCount++;
    }
    
    return {
      questionId: answer.questionId,
      optionId: answer.optionId,
      isCorrect
    };
  }).filter(Boolean);
  
  // Calculate percentage score
  const percentageScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  
  // Save the student's answers and create QuizAttempt record
  const quizAttempt = await prisma.quizAttempt.create({
    data: {
      quizId: quizId,
      studentId: quizStudent.id,
      score: percentageScore,
      completedAt: new Date(),
      answers: {
        create: answers.map(ans => ({
          questionId: ans.questionId,
          optionId: ans.optionId,
          textAnswer: ans.textAnswer,
          isCorrect: results.find(r => r?.questionId === ans.questionId)?.isCorrect || false
        }))
      }
    },
    include: {
      answers: true,
      student: true
    }
  });
  
  return {
    quizId,
    studentId: quizStudent.id,
    studentName: studentDetails.name,
    enrollmentNumber: studentDetails.enrollmentNumber,
    score: percentageScore,
    totalQuestions,
    correctAnswers: correctCount,
    submittedAt: quizAttempt.completedAt,
    attemptId: quizAttempt.id
  };
};

// Function to get all students and their scores for a quiz
export const getQuizStudentResults = async (quizId: string) => {
  // Check if the quiz exists
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { title: true, creatorId: true, isOnlineAttempt: true }
  });

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Get all attempts for this quiz, including student details
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId },
    include: {
      student: true,
      answers: {
        include: {
          question: true
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  });

  return {
    quizId,
    quizTitle: quiz.title,
    isOnlineAttempt: quiz.isOnlineAttempt,
    studentResults: attempts.map(attempt => ({
      attemptId: attempt.id,
      studentId: attempt.studentId,
      studentName: attempt.student.name,
      enrollmentNumber: attempt.student.enrollmentNumber,
      email: attempt.student.email,
      score: attempt.score,
      completedAt: attempt.completedAt,
      answerCount: attempt.answers.length
    }))
  };
};

export const getQuizResults = async (quizId: string, userId: string) => {
    // Fetch the answers submitted by the user for this quiz
    const userAnswers = await prisma.answer.findMany({
        where: {
            quizId: quizId,
            userId: userId,
        },
        include: {
            question: { // Include question details
                include: {
                    options: true // Include options to show correct answers
                }
            }
        }
    });

    // Fetch the quiz itself for context (e.g., title)
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { title: true, questions: { select: { id: true, type: true, options: true } } } });

    if (!quiz) {
        throw new Error('Quiz not found');
    }

    // --- Calculate score and format results ---
    // This is a simplified example. Real grading logic might be more complex,
    // especially for descriptive questions which would require manual/AI grading.
    let correctCount = 0;
    const results = userAnswers.map(ans => {
        let isCorrect = false;
        const question = quiz.questions.find(q => q.id === ans.questionId);
        if (question?.type === 'MCQ') {
            const correctOption = question.options.find(opt => opt.isCorrect);
            isCorrect = ans.optionId === correctOption?.id;
            if (isCorrect) correctCount++;
        }
        // Descriptive questions would need separate grading logic

        return {
            questionId: ans.questionId,
            questionText: ans.question.text,
            questionType: ans.question.type,
            userAnswer: ans.optionId ? ans.question.options.find(o => o.id === ans.optionId)?.text : ans.textAnswer,
            correctAnswer: question?.type === 'MCQ' ? question.options.find(opt => opt.isCorrect)?.text : "(Descriptive - Needs Grading)", // Placeholder for correct descriptive answer
            isCorrect: isCorrect,
            options: ans.question.options // Include options for displaying choices
        };
    });

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return {
        quizId,
        quizTitle: quiz.title,
        userId,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        results
    };
}; 