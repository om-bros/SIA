const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Routes
let conversationHistory = [];
let chatSessions = [];

app.post('/api/chat', upload.single('file'), async (req, res) => {
  try {
    const { message, history } = req.body;
    const assistant = JSON.parse(req.body.assistant);
    const conversationHistory = JSON.parse(history);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let promptMessage = `You are ${assistant.name}, an AI assistant with the following characteristics:
- Description: ${assistant.description}
- Capabilities: ${assistant.capabilities.join(', ')}
- Personality: ${assistant.personality}
The conversation history is:
${conversationHistory.map(entry => `${entry.sender === 'user' ? 'User' : assistant.name}: ${entry.message}`).join('\n')}
Please respond to the following message in character as ${assistant.name}:
User: ${message}
${assistant.name}:`;

    let result;
    if (req.file) {
      // Handle image data
      const filePath = path.join(uploadDir, req.file.filename);
      const fileData = fs.readFileSync(filePath);
      const base64Data = Buffer.from(fileData).toString('base64');
      console.log('Sending image to API...');
      result = await model.generateContent([
        promptMessage,
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ]);
    } else {
      // Handle text message only
      console.log('Sending text to API...');
      result = await model.generateContent(promptMessage);
    }

    console.log('API response:', result);
    const response = await result.response;
    console.log('API response:', response);
    const text = await response.text();
    console.log('API response text:', text);
    res.json({ reply: text });
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error response:', error.response);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// New route to load recent chats
app.get('/api/recent-chats', (req, res) => {
  try {
    res.status(200).json(chatSessions);
  } catch (error) {
    console.error('Error loading recent chats:', error);
    res.status(500).json({ error: 'An error occurred while loading recent chats.' });
  }
});

app.use(express.static('public'));

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});