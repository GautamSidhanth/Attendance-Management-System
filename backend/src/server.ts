import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth, requireRole } from './middleware/auth';
import { pool } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// User Onboarding (First time login)
app.post('/api/users/onboard', requireAuth, async (req, res) => {
  const { name, role, institutionName } = req.body;
  const clerkUserId = req.auth?.userId;

  if (!clerkUserId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Check if user already exists
    const existing = await pool.query('SELECT * FROM users WHERE clerk_user_id = $1', [clerkUserId]);
    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    let institutionId = null;

    if (role === 'Institution') {
      // Create new institution if role is Institution
      const instResult = await pool.query(
        'INSERT INTO institutions (name) VALUES ($1) RETURNING id',
        [institutionName || `${name}'s Institution`]
      );
      institutionId = instResult.rows[0].id;
    } else if (role === 'Trainer' && req.body.institutionId) {
       institutionId = req.body.institutionId;
    }

    const newUser = await pool.query(
      'INSERT INTO users (clerk_user_id, name, role, institution_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [clerkUserId, name, role, institutionId]
    );

    res.json(newUser.rows[0]);
  } catch (error) {
    console.error('Onboard error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get all institutions for trainers to select during onboarding
app.get('/api/institutions', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM institutions ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Include other routes here
import batchesRouter from './routes/batches';
import sessionsRouter from './routes/sessions';
import attendanceRouter from './routes/attendance';
import summaryRouter from './routes/summary';

app.use('/api/batches', batchesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/summary', summaryRouter);

// Get current user profile
app.get('/api/users/me', requireAuth, async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404).json({ error: 'User not onboarded' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
