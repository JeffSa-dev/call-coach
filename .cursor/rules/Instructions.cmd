# Call Coach Development Guide

## Project Overview

You are building an AI-powered platform that helps Customer Success Managers improve their client interactions through personalized coaching and feedback. The application analyzes call transcripts, provides structured assessments, and offers interactive coaching to develop critical B2B customer success skills.

## Architecture

The core components include:

- **Frontend**: Next.js 14.1.0 with TypeScript and Chakra UI
- **Database**: Supabase with PostgreSQL
- **AI Integration**: Anthropic's Claude API
- **Hosting**: Vercel for both frontend and serverless functions

## Project Structure

call-coach/
├── src/
│   ├── pages/
│   │   ├── api/ # API routes (serverless functions)
│   │   │   ├── index.ts # Root API endpoint
│   │   │   ├── health.ts # Health check endpoint
│   │   │   ├── analysis/ # Analysis endpoints
│   │   │   ├── conversation/ # Conversation endpoints
│   │   │   └── chat.ts # Claude/Anthropic integration
│   │   ├── _app.tsx # App configuration
│   │   ├── index.tsx # Home/Upload page
│   │   ├── analysis/ # Analysis pages
│   │   └── coaching/ # Coaching pages
│   ├── components/ # React Components
│   ├── styles/ # CSS and styling
│   ├── lib/ # Service integrations
│   ├── hooks/ # Custom React hooks
│   └── utils/ # Helper functions
├── public/ # Static files
├── package.json # Dependencies
└── next.config.js # Next.js configuration

## Key Features

1. **Transcript Analysis**: Upload and analyze customer call transcripts
2. **Structured Feedback**: Get insights across four competency areas:
   - Proving Value
   - Communicating Value
   - Competitive Positioning
   - Expansion Opportunity Identification
3. **Interactive Coaching**: AI-powered conversation to improve skills
4. **Practice Scenarios**: Role-play exercises for skill development

## Pages

1. /login (Login) // Login page
   - Create a login page with email/password input
   - Use Supabase for authentication
   - Redirect to / after login   

2. / (Home) // Upload transcript and get analysis
   -This is the starting point of the user journey:
   - Create the file upload UI with drag-and-drop
   - Implement form fields for metadata (customer name, call type, objective)
   - Add validation for the form
   - Connect it to your Supabase storage

3. /analysis (Analysis) // View analysis results
   - Display the analysis results in a structured format
   - Include key insights and recommendations
   - Provide a summary of the call
   - Show competency scores

4. /coaching (Coaching) // Practice scenarios
   - Display practice scenarios with AI-powered coaching
   - Allow users to select a scenario and practice
   - Provide feedback and recommendations
   - Track progress and skills

5. /settings (Settings) // User settings
   - Allow users to manage their account information
   - Provide a way to contact support  
## Development Workflow

### Core Workflows

1. **Transcript Analysis Flow**:
   - User uploads transcript → Storage → Processing → Claude Analysis → Results

2. **Coaching Conversation Flow**:
   - User initiates coaching → Context preparation → Interactive dialogue

4. Run development server: `npm run dev`

## Database Schema

1. **users** - Store user information
- id, name, email, organization_id, created_at, updated_at

2. **analyses** - Store transcript analyses
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- title (TEXT) - user-friendly name for the session
- customer_name (TEXT)
- call_type (TEXT)
- file_type (TEXT) - 'json', 'pdf', etc.
- transcript_url (TEXT) - storage URL
- text_content (TEXT, nullable) - extracted text content
- file_metadata (JSONB, nullable) - format-specific information
- status (TEXT - 'uploaded', 'processing', 'completed', 'error')
- results (JSONB - Structured analysis results)
- metadata (JSONB - Call context and objectives)
- tags (TEXT[], nullable) - For categorization
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP, nullable)

3. **conversations** - Store coaching conversations
- id, analysis_id, messages, created_at, updated_at

## Important Development Notes

### Claude API Integration

- The Claude API integration is in `lib/claude.ts`
- Prompt engineering is crucial for consistent analysis
- Context management is important to stay within token limits

### Supabase Integration

- Supabase client setup is in `lib/supabase.ts`
- File storage is used for transcript uploads
- Database operations should use the Supabase client

### UI Components

- Use Chakra UI for consistent styling
- Follow the Split Panel design for analysis and coaching
- Ensure responsive design works across devices


## Resources

- [Anthropic Claude API Documentation](https://docs.anthropic.com/claude/reference/complete_post)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Chakra UI Documentation](https://chakra-ui.com/docs/getting-started)