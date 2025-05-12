const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Configure CORS with specific options
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

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
    icon: String
  }],
  votes: [{
    userId: String,
    userProject: String,
    ranking: [String]
  }],
  createdAt: { type: Date, default: Date.now }
});

// API
app.post('/api/votes', async (req, res) => {
  const { projects } = req.body;
  const voteCode = Math.floor(10000 + Math.random() * 90000).toString();
  const resultsCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  const projectsWithIds = projects.map(project => ({
    ...project,
    id: Math.random().toString(36).substr(2, 9)
  }));

  const session = new VoteSession({
    voteCode,
    resultsCode,
    projects: projectsWithIds
  });

  await session.save();
  
  res.json({
    voteCode,
    resultsCode
  });
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
