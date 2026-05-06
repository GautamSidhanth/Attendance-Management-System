import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

// POST /sessions -> Trainer
router.post('/', requireAuth, requireRole(['Trainer']), async (req, res) => {
  const { batch_id, title, date, start_time, end_time } = req.body;
  const user = req.user;

  try {
    // Verify trainer is assigned to this batch
    const check = await pool.query(
      'SELECT * FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2',
      [batch_id, user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'You do not manage this batch' });
    }

    const newSession = await pool.query(
      'INSERT INTO sessions (batch_id, trainer_id, title, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [batch_id, user.id, title, date, start_time, end_time]
    );

    res.json(newSession.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sessions/:id/attendance -> Trainer
router.get('/:id/attendance', requireAuth, requireRole(['Trainer']), async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // Verify trainer owns this session
    const check = await pool.query('SELECT * FROM sessions WHERE id = $1 AND trainer_id = $2', [id, user.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view this session' });
    }

    const attendance = await pool.query(`
      SELECT a.*, u.name as student_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.session_id = $1
    `, [id]);

    res.json(attendance.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sessions/active -> Student
router.get('/active', requireAuth, requireRole(['Student']), async (req, res) => {
  const user = req.user;

  try {
    const sessions = await pool.query(`
      SELECT s.*, b.name as batch_name, t.name as trainer_name
      FROM sessions s
      JOIN batches b ON s.batch_id = b.id
      JOIN users t ON s.trainer_id = t.id
      JOIN batch_students bs ON bs.batch_id = b.id
      WHERE bs.student_id = $1
      ORDER BY s.date DESC, s.start_time DESC
    `, [user.id]);

    res.json(sessions.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
