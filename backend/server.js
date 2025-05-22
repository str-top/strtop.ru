const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Increase payload size limit to 50MB (default is 100kb)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/student_votes', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Модели
const VoteSession = mongoose.model('VoteSession', {
  voteCode: String,
  resultsCode: String,
  projects: [{
    id: String,
    name: String,
    icon: String, // This will store the URL of the uploaded image
    imageUrl: String // Optional field to store the URL of the uploaded image
  }],
  votes: [{
    userId: String,
    userProject: String,
    ranking: [String]
  }],
  createdAt: { type: Date, default: Date.now }
});

// API
// Batch upload endpoint
app.post('/api/upload/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const responses = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename
    }));
    
    res.json(responses);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload endpoint (keep for single file uploads)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const response = {
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename
    };
    
    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/votes', async (req, res) => {
  try {
    // Log the size of the incoming request body
    const bodyString = JSON.stringify(req.body);
    console.log('Vote request body size:', Buffer.byteLength(bodyString, 'utf8'), 'bytes');
    
    const { projects } = req.body;
    
    // Validate that all projects have URLs
    if (!projects.every(project => project.imageUrl)) {
      return res.status(400).json({ error: 'All projects must have image URLs' });
    }

    const voteCode = Math.floor(10000 + Math.random() * 90000).toString();
    const resultsCode = Math.floor(10000 + Math.random() * 90000).toString();
    
    const projectsWithIds = projects.map(project => ({
      ...project,
      id: Math.random().toString(36).substr(2, 9)
    }));

  const voteSession = new VoteSession({
    voteCode,
    resultsCode,
    projects: projectsWithIds,
    votes: []
  });

  await voteSession.save();
  
  res.json({
    voteCode,
    resultsCode
  });
  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ error: 'Failed to create vote session' });
  }
});

app.get('/api/votes/:code', async (req, res) => {
  const session = await VoteSession.findOne({ voteCode: req.params.code });
  if (!session) return res.status(404).send('Голосование не найдено');
  
  res.json({
    projects: session.projects
  });
});

app.post('/api/votes/:code/vote', async (req, res) => {
  const { userProject, ranking } = req.body;
  
  const session = await VoteSession.findOne({ voteCode: req.params.code });
  if (!session) return res.status(404).send('Голосование не найдено');
  
  // Генерируем уникальный ID для пользователя
  const userId = Math.random().toString(36).substr(2, 9);
  
  session.votes.push({
    userId,
    userProject,
    ranking
  });
  
  await session.save();
  res.json({ success: true });
});

app.get('/api/results/:code', async (req, res) => {
  const session = await VoteSession.findOne({ resultsCode: req.params.code });
  if (!session) return res.status(404).send('Результаты не найдены');
  
  // Подсчет результатов
  const results = session.projects.map(project => {
    // Количество голосов, где этот проект выбран как свой
    const votes = session.votes.filter(v => v.userProject === project.id).length;
    
    // Средний ранг (исключая голоса, где проект был выбран как свой)
    let totalRank = 0;
    let count = 0;
    
    session.votes.forEach(vote => {
      if (vote.userProject !== project.id) {
        const rank = vote.ranking.indexOf(project.id);
        if (rank !== -1) {
          totalRank += rank + 1; // +1 потому что индекс начинается с 0
          count++;
        }
      }
    });
    
    const averageRank = count > 0 ? totalRank / count : 0;
    
    return {
      project,
      votes,
      averageRank
    };
  });
  
  res.json(results);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
