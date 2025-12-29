# HeHo Platform - Quick Start Guide

## For Users

### 1. Sign Up & Setup (2 minutes)
1. Go to `/app/setup` after signing up
2. Add your OpenRouter API key (get free at openrouter.ai)
3. Add your Supabase credentials (get free at supabase.com)
4. Select database permissions (Read + Insert recommended)
5. Complete setup and go to Dashboard

### 2. Create Your First Chatbot (3 minutes)
1. Click "Create Chatbot" on Dashboard
2. Enter chatbot name (e.g., "Customer Support Bot")
3. Select a goal (e.g., "Customer Support")
4. **Click "AI Generate"** to auto-create description or write your own
5. Select theme (optional)
6. Click "Create Chatbot"

### 3. Test Your Chatbot (1 minute)
1. You'll be taken to the chat page
2. Type a message and send
3. See AI response
4. Check Dashboard for usage updates

### 4. Deploy & Share (2 minutes)
1. Go to Chatbots → Analytics → Deploy button
2. Click "Deploy Chatbot"
3. Copy the public URL
4. Share with anyone - no login needed!
5. Or copy embed code for your website

### 5. Monitor Usage
1. Go to Usage tab
2. See daily/weekly/monthly stats
3. Check messages, tokens, API calls
4. View detailed table for each day

---

## For Developers

### API Integration

#### Embed in Website
```html
<!-- Simple iframe -->
<iframe 
  src="https://yourapp.com/deploy/chatbot-id" 
  style="width: 100%; height: 600px; border: none;">
</iframe>
```

#### Or Use Embed Script
```html
<div id="my-chatbot" style="height: 600px;"></div>
<script src="https://yourapp.com/embed.js"></script>
<script>
  HeHoChatbot.embed('https://yourapp.com/deploy/chatbot-id', 'my-chatbot');
</script>
```

### Chat API
```javascript
// Send message to private chatbot
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatbotId: 'your-chatbot-id',
    message: 'Hello!',
    isPublic: false
  })
});
const { reply } = await response.json();
console.log(reply);
```

### Generate Prompt API
```javascript
// Generate system prompt from goal
const response = await fetch('/api/generate-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Bot',
    goal: 'Customer Support'
  })
});
const { prompt } = await response.json();
console.log(prompt); // Ready to use as system prompt
```

---

## Key Features Checklist

- [x] Dashboard with real-time analytics
- [x] Side navigation (Dashboard, Chatbots, Database, Usage, Settings)
- [x] Create chatbots with AI-generated prompts
- [x] Chat with deployed bots
- [x] Public sharing (no auth required)
- [x] Embed anywhere with iframe or widget
- [x] Advanced usage analytics with time filters
- [x] Theme selection (5 themes)
- [x] Per-chatbot analytics
- [x] Database management view
- [x] Settings for API keys and permissions
- [x] Copy-to-clipboard for URLs and code
- [x] Error handling and validation
- [x] Mobile detection and responsive design

---

## Limits

- **Messages**: 10,000 per day
- **Tokens**: 1,000,000 (1M) per day
- **Free Plan Chatbots**: Unlimited (create as many as you want!)

Usage resets daily at midnight UTC.

---

## Troubleshooting

### ChatBot Not Working?
1. Check OpenRouter API key in Settings
2. Verify Supabase connection
3. Ensure database permissions allow at least Read

### Deploy Page Blank?
1. Make sure you clicked "Deploy Chatbot"
2. Check if chatbot is deployed in Chatbots tab
3. Try refreshing the page

### Embed Not Showing?
1. Use full deploy URL (with domain)
2. Check CORS - iframe method is simpler
3. Verify chatbot is deployed

### Usage Not Tracking?
1. Recheck date/time on your system
2. Usage resets at midnight UTC
3. Check specific date in detailed table

---

## Next Steps

1. **Create a Support Bot**: Describe your product, let AI generate context
2. **Customize Theme**: Pick a color that matches your brand
3. **Share the Link**: Send public URL to customers
4. **Monitor Analytics**: Check Usage tab to see conversations
5. **Refine**: Adjust settings if needed
6. **Scale**: Create more bots for different purposes

---

## Support

- Check `COMPLETE_APP_FEATURES.md` for detailed feature documentation
- Review `DEPLOYMENT_GUIDE.md` for technical setup
- Issues? Check console logs and network tab in browser DevTools
