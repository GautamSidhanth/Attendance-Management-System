import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

// POST /attendance/mark -> Student
router.post('/mark', requireAuth, requireRole(['Student']), async (req, res) => {
  const { session_id, status } = req.body;
  const user = req.user;

  try {
    // Check if session exists and is active (we could check time, but let's keep it simple)
    const sessionCheck = await pool.query('SELECT * FROM sessions WHERE id = $1', [session_id]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if student belongs to the batch of the session
    const batchId = sessionCheck.rows[0].batch_id;
    const studentCheck = await pool.query(
      'SELECT * FROM batch_students WHERE batch_id = $1 AND student_id = $2',
      [batchId, user.id]
    );
    if (studentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this batch' });
    }

    // Upsert attendance
    const newAttendance = await pool.query(`
      INSERT INTO attendance (session_id, student_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id, student_id)
      DO UPDATE SET status = EXCLUDED.status, marked_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [session_id, user.id, status]);

    res.json(newAttendance.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
