# HeHo Complete Application - Feature Documentation

## Application Overview
HeHo is a fully-functional AI chatbot builder with advanced analytics, deployment capabilities, and real-time chat features. The application now includes all requested features with a complete side-navigation dashboard.

---

## Core Features Implemented

### 1. Dashboard (Improved & Analytics-Rich)
**Path**: `/app/dashboard`

**Features**:
- Real-time active chatbots counter
- Daily message tracking with progress bar (limit: 10,000/day)
- Token usage tracking with progress bar (limit: 1,000,000/day) 
- Health status indicator showing remaining capacity percentage
- Quick access to all chatbots in a responsive grid
- Create new chatbot button
- Settings quick access
- Automatic redirect to setup if not configured

**Error Fix**: Fixed `[object Object]` error in `loadData()` by:
- Adding proper error handling for all database queries
- Using optional chaining and null coalescing
- Catching and logging specific errors instead of logging error objects

---

### 2. Side Navigation Bar
**Component**: `/components/app-sidebar.tsx`

**Features**:
- Logo with HeHo branding
- Navigation links:
  - Dashboard (BarChart3)
  - Chatbots (MessageSquare)
  - Database (Database)
  - Usage (Zap)
  - Settings (Settings)
- Active route highlighting
- Sign out button in footer
- Responsive width (w-64)
- Clean dark theme matching app aesthetic

**Integration**: Updated `/app/app/(app)/layout.tsx` to include the sidebar with flexbox layout

---

### 3. Chatbots Management Tab
**Path**: `/app/chatbots`

**Features**:
- Grid view of all created chatbots
- Each chatbot card displays:
  - Name and goal
  - AI model badge
  - Creation date
  - Quick Chat button
  - Analytics button (links to chatbot analytics page)
  - Settings button (links to chatbot settings)
  - Delete button with confirmation
- Deployed status with shareable URL preview
- Empty state with create chatbot CTA
- Header with create chatbot button

**Data Tracked**:
- Chatbot ID, name, goal, model
- Deployment status and URLs
- Creation timestamp

---

### 4. Chatbot Personal Analytics
**Path**: `/app/chatbots/[id]/analytics`

**Features**:
- Per-chatbot performance metrics
- Statistics cards showing:
  - Total conversations
  - Total messages processed
  - Average response time
- Chatbot information panel with:
  - Full name
  - Selected model
  - Goal/purpose
  - Creation date
- Expandable for future metrics

---

### 5. Database Management Tab
**Path**: `/app/database`

**Features**:
- View all Supabase tables
- Table structure visualization
- Row count per table
- Column list display
- Create table button
- Informational messaging about database integration
- Error handling when Supabase not configured
- Future: Direct SQL table creation

---

### 6. Advanced Usage Analytics Tab
**Path**: `/app/usage`

**Features**:

#### Time Range Filters
- Daily (last 30 days)
- Weekly (last 90 days)
- Monthly (last 12 months)
- Yearly (last 5 years)

#### Statistics Cards
- Total messages in period
- Total tokens used (formatted as K for thousands)
- Total API calls made

#### Visual Charts
1. **Messages & Tokens Trend Chart**
   - Line chart showing dual metrics
   - X-axis: dates
   - Y-axis: message/token counts
   - Interactive tooltip on hover

2. **API Calls Distribution**
   - Bar chart by date
   - Shows API call volume trends
   - Color-coded for easy reading

#### Detailed Table
- Date-by-date breakdown
- Columns: Date, Messages, Tokens, API Calls, DB Reads, DB Writes
- Sortable and scrollable
- Hover effect for better readability

---

### 7. Improved Create Chatbot Page
**Path**: `/app/chatbots/create`

**Features**:

#### AI-Generated Prompts
- **Button**: "AI Generate" button next to description field
- **Powered by**: OpenRouter API with GPT-4o-mini
- **Functionality**: Generates detailed system prompts based on:
  - Chatbot name
  - Selected goal
- **Output**: 200+ character descriptions automatically filled
- **User Control**: Can edit or write custom descriptions

#### Theme Selection
- 5 pre-built themes:
  1. Dark (Black background, white text)
  2. Light (White background, dark text)
  3. Blue (Blue gradient theme)
  4. Green (Green gradient theme)
  5. Purple (Purple gradient theme)
- Visual theme preview squares
- Selected theme highlighted with white border
- Theme applied to deployed chatbot pages

#### Smart Defaults
- Name field with 50 character limit
- Goal selector with predefined options
- Tone selector (Friendly, Professional, Strict)
- AI Model selector with 4 popular options
- Real-time character count (min 200 required)

#### Validation
- Name required
- Goal required
- Description minimum 200 characters
- All form validation with clear error messages

---

### 8. Deploy System & Shareable Links
**Path**: `/app/chatbots/[id]/deploy`

**Features**:

#### Deployment Control
- One-click deploy/undeploy toggle
- Deployment status indicator (Active badge when deployed)
- Public URL generation (format: `yoursite.com/deploy/[chatbotId]`)
- Copy URL to clipboard functionality

#### Embed Code Generation
Two embedding options provided:

1. **Widget Embed Code**
   ```html
   <!-- Includes HeHo JavaScript library -->
   <!-- Auto-resizable and responsive -->
   <!-- Includes CSS styling -->
   ```

2. **iframe Embed Code**
   ```html
   <!-- Direct iframe embedding -->
   <!-- Simple, no dependencies -->
   <!-- Width and height customizable -->
   ```

#### Integration Guide
- Platform-specific instructions:
  - Next.js / React (dynamic imports)
  - HTML / Static sites
  - Styling customization tips

#### Copy-to-Clipboard
- One-click copy for both code types
- Visual feedback with check icon
- Auto-reset after 2 seconds

---

### 9. Public Chatbot Pages (No Auth Required)
**Path**: `/deploy/[chatbotId]`

**Features**:

#### Styling & Theme
- Respects chatbot's selected theme
- Responsive design (works on all screen sizes)
- Professional header with chatbot name and goal
- Clean message layout

#### Chat Functionality
- Send and receive messages
- Real-time message display
- Message history in conversation
- Loading indicators during response
- Error handling with user-friendly messages

#### No Authentication Required
- Publicly accessible link
- No login needed
- Anyone with link can chat
- Usage tracked in your analytics

#### Message Tracking
- All messages counted in daily usage
- Tokens tracked per message
- Analytics available in dashboard
- Usage limits still apply

---

## API Endpoints

### POST `/api/chat`
**Purpose**: Handle both authenticated and public chat messages

**Parameters**:
```typescript
{
  chatbotId: string      // Required
  message: string        // Required
  isPublic?: boolean     // Optional, for public access
}
```

**Response**:
```typescript
{
  reply: string         // AI response
  tokens?: number       // Tokens used
}
```

**Authentication**:
- Required for private chatbot access
- Optional for deployed/public chatbots
- Validates user ownership before sending

---

### POST `/api/generate-prompt`
**Purpose**: Generate AI system prompts for new chatbots

**Parameters**:
```typescript
{
  name: string    // Chatbot name
  goal: string    // Chatbot purpose
}
```

**Response**:
```typescript
{
  prompt: string  // Generated system prompt (200+ chars)
}
```

**Model**: Uses GPT-4o-mini for fast, quality generations

---

## Settings Pages

### User Settings (`/app/settings`)
- **API Key Management**: OpenRouter API key configuration
- **Database Setup**: Supabase URL and credentials
- **Permission Control**: Read, Insert, Create, Delete toggles
- **Encryption**: All keys encrypted before storage
- **Logout**: Sign out functionality

### Chatbot Settings (`/app/chatbots/[id]/settings`)
- **Name**: Update chatbot display name
- **Goal**: Change chatbot's purpose
- **Description**: Edit system prompt/context
- **Tone**: Adjust personality (Friendly/Professional/Strict)
- **Model**: Switch AI models
- **Save**: Changes persist immediately

---

## Limits & Quotas

**Free Plan Includes**:
- Unlimited chatbot creation
- 10,000 messages per day (tracked in usage)
- 1,000,000 tokens per day (1M tokens!)
- Unlimited deployments
- Full analytics access
- Public chatbot sharing
- Embed anywhere on web

**Tracking**:
- Daily usage reset at midnight UTC
- Per-user tracking with fine-grained analytics
- Separate counts: messages, tokens, API calls, DB operations

---

## Database Schema

Required Supabase tables:

### chatbots
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to auth.users)
- name: text
- goal: text
- description: text
- tone: text (friendly|professional|strict)
- model: text (AI model ID)
- theme: text (dark|light|blue|green|purple)
- deployed: boolean
- deploy_url: text (nullable)
- created_at: timestamp
- updated_at: timestamp
```

### usage
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key)
- date: date
- messages: integer
- tokens: integer
- api_calls: integer
- db_reads: integer
- db_writes: integer
- updated_at: timestamp
```

### users (extended)
```sql
- id: uuid (primary key, from auth)
- openrouter_key_encrypted: text (encrypted)
- supabase_url: text
- supabase_key_encrypted: text (encrypted)
- supabase_permissions: jsonb
- setup_completed: boolean
```

---

## Security Features

1. **API Key Encryption**: All sensitive keys encrypted before storage
2. **User Isolation**: Each user can only access their own chatbots
3. **Public Access Control**: Only deployed chatbots accessible publicly
4. **Permission-Based Access**: Database permissions enforced per user
5. **Session Management**: Supabase auth handles sessions
6. **Error Handling**: No sensitive data in error messages

---

## Mobile Experience

- Desktop-optimized interface
- Mobile detection message (requires desktop)
- Responsive components for future mobile support
- Chatbot widget works on any device (embedded)

---

## Future Enhancement Opportunities

1. **Team Features**: Share chatbots with team members
2. **Advanced Analytics**: More detailed metrics and visualizations
3. **Custom Domains**: Deploy to custom subdomains
4. **Training Data**: Upload PDFs/docs for context
5. **Webhook Integration**: Send chat data to external services
6. **Conversation History**: Persistent multi-turn conversations
7. **Fine-Tuning**: Custom model training per chatbot
8. **Export Features**: Analytics export (CSV/PDF)
9. **API Access**: REST API for programmatic access
10. **Billing Integration**: Stripe for premium plans

---

## Getting Started

1. **Navigate to Dashboard**: `/app/dashboard`
2. **Create Chatbot**: Click "Create Chatbot" button
3. **Use AI Generate**: Let AI create your system prompt (optional)
4. **Select Theme**: Choose visual appearance
5. **Configure**: Add name, goal, description, tone, model
6. **Test Chat**: Start chatting in `/app/chatbots/[id]`
7. **Deploy**: Go to deploy page and click deploy
8. **Share**: Copy public URL or embed code
9. **Monitor**: Track usage in analytics tab
10. **Refine**: Update settings as needed

---

## Support & Documentation

- **Setup Issues**: Check `/app/setup` page
- **Database Help**: See Database tab for schema info
- **API Errors**: Check browser console and network tab
- **Rate Limits**: Monitor in Usage analytics
- **Deployment**: See deploy page integration guide
