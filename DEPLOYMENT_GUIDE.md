# HeHo Chatbot Platform - Complete Feature Guide

## Overview
This is a fully functional AI chatbot builder platform with deployment capabilities, analytics, and team management features.

## Features Implemented

### 1. Dashboard (Improved Analytics)
- **Location**: `/app/dashboard`
- **Features**:
  - Real-time chatbot count
  - Daily message and token usage with progress bars
  - 1M tokens per day limit (increased from 10K)
  - Health status showing remaining capacity
  - Quick stats and chatbot grid view

### 2. Side Navigation
- **Location**: Component in `/components/app-sidebar.tsx`
- **Features**:
  - Dashboard link
  - Chatbots management tab
  - Database management tab
  - Usage analytics tab
  - Settings access
  - Quick logout button

### 3. Chatbots Management Tab
- **Location**: `/app/chatbots`
- **Features**:
  - View all created chatbots
  - Quick chat access for each bot
  - Personal analytics per chatbot
  - Settings management per bot
  - Deploy/undeploy functionality
  - Delete chatbots
  - Created date tracking

### 4. Chatbot Analytics
- **Location**: `/app/chatbots/[id]/analytics`
- **Features**:
  - Per-chatbot statistics
  - Conversation count tracking
  - Total messages and response time metrics
  - Chatbot information display

### 5. Database Management Tab
- **Location**: `/app/database`
- **Features**:
  - View connected tables
  - Table structure visualization
  - Row count display
  - Integration with Supabase schema

### 6. Usage Analytics Tab
- **Location**: `/app/usage`
- **Features**:
  - Time range filtering: Daily, Weekly, Monthly, Yearly
  - Total messages counter
  - Total tokens usage (in K format)
  - API calls tracking
  - Interactive line charts for trends
  - Bar charts for API call distribution
  - Detailed daily breakdown table
  - Database read/write operations tracking

### 7. Create Chatbot (Improved)
- **Location**: `/app/chatbots/create`
- **Features**:
  - AI-generated prompts using OpenRouter
  - Theme selection (Dark, Light, Blue, Green, Purple)
  - Goal-based setup wizard
  - Tone selection (Friendly, Professional, Strict)
  - Model selection from popular options
  - Real-time character count for descriptions
  - Validation for minimum 200 characters

### 8. Deploy System
- **Location**: `/app/chatbots/[id]/deploy`
- **Features**:
  - One-click deployment toggle
  - Public URL generation
  - Embed code generation (HTML/JavaScript)
  - iframe embed code
  - Deployment status indicator
  - Integration guide for different platforms
  - Copy-to-clipboard functionality

### 9. Public Chatbot Pages
- **Location**: `/deploy/[id]`
- **Features**:
  - No authentication required
  - Theme matching chatbot settings
  - Full chat functionality
  - Real-time message streaming
  - Responsive mobile design
  - Error handling and messaging

## API Endpoints

### POST `/api/chat`
Handles both authenticated and public chatbot messages.
- **Authentication**: Optional (required for private, not required for deployed/public)
- **Payload**:
  ```json
  {
    "chatbotId": "string",
    "message": "string",
    "isPublic": "boolean"
  }
  ```

### POST `/api/generate-prompt`
AI-generated system prompt creation.
- **Payload**:
  ```json
  {
    "name": "string",
    "goal": "string"
  }
  ```

## Settings Management

### User Settings (`/app/settings`)
- OpenRouter API key management
- Supabase configuration
- Database permissions control
- Account information
- Secure key encryption

### Chatbot Settings (`/app/chatbots/[id]/settings`)
- Chatbot name and goal
- Project description
- Tone customization
- AI model selection

## Limits & Quotas

- **Free Plan**:
  - Unlimited chatbots created
  - 10,000 messages per day
  - 1,000,000 tokens per day
  - Full deployment capabilities

## Database Schema Requirements

Your Supabase should have:
- `chatbots` table with fields: id, user_id, name, goal, description, tone, model, theme, deployed, deploy_url, created_at
- `usage` table with fields: id, user_id, date, messages, tokens, api_calls, db_reads, db_writes
- `users` table with fields: id, email, openrouter_key_encrypted, supabase_url, supabase_key_encrypted, setup_completed

## Environment Variables

Required for deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (for OpenRouter referrer)

## Deployment Checklist

- [ ] Set all environment variables
- [ ] Create required Supabase tables
- [ ] Test OpenRouter API connection
- [ ] Verify Supabase permissions
- [ ] Test creating a chatbot
- [ ] Test deploying a chatbot
- [ ] Test public chatbot access
- [ ] Verify analytics tracking
- [ ] Test embed code on test website
- [ ] Deploy to production

## Next Steps for Enhancement

1. Add conversation history persistence
2. Implement chatbot training/fine-tuning
3. Add team/organization support
4. Advanced analytics with charts
5. Custom domain support for deployed bots
6. WebSocket integration for real-time features
7. Webhook system for external integrations
8. Export analytics to CSV/PDF
