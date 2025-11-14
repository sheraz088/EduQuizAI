# Study Material Generator

This project helps teachers and students generate study materials from existing documents. It can create quizzes, assignments, and summaries using AI.

## Features

- Generate multiple-choice questions (MCQs) or descriptive questions
- Create assignments with detailed answers
- Generate comprehensive summaries
- Take quizzes online with automatic scoring
- Store and manage your generated materials

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python, Prisma ORM
- **AI**: LangChain with Groq
- **Auth**: Supabase
- **Database**: PostgreSQL

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Python 3.9 or higher
- PostgreSQL database
- Supabase account for auth
- Groq API key

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example`:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=your-postgresql-connection-string
   DIRECT_URL=your-direct-database-url
   ```

5. Initialize and update the database:
   ```
   npx prisma migrate dev
   ```

6. Start the backend server:
   ```
   uvicorn app:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file based on `.env.local.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Upload documents (PDF, DOCX, TXT, PPTX)
2. Select the type of material to generate
3. Configure options (number of questions, etc.)
4. Click Generate
5. View, save, or take quiz online

## Environment Variables

### Backend
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct database URL (for some deployment setups)

### Frontend
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `NEXT_PUBLIC_API_URL`: URL for the backend API (default: http://localhost:8000)

## Troubleshooting

- If you encounter database connection issues, check that your Prisma schema matches your database state.
- For auth issues, verify your Supabase configuration and ensure the tokens are being sent properly.
- If PDF generation fails, check that the output directory exists and is writable. 