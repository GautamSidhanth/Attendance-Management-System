import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

// GET /institutions/:id/summary -> Programme Manager
router.get('/institutions/:id', requireAuth, requireRole(['Programme Manager']), async (req, res) => {
  const { id } = req.params;

  try {
    const summaryQuery = `
      SELECT 
        b.id as batch_id, b.name as batch_name,
        COUNT(a.id) as total_attendance_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count
      FROM batches b
      LEFT JOIN sessions s ON b.id = s.batch_id
      LEFT JOIN attendance a ON s.id = a.session_id
      WHERE b.institution_id = $1
      GROUP BY b.id
    `;
    const summary = await pool.query(summaryQuery, [id]);

    res.json(summary.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /programme/summary -> Programme Manager / Monitoring Officer
router.get('/programme', requireAuth, requireRole(['Programme Manager', 'Monitoring Officer']), async (req, res) => {
  try {
    const summaryQuery = `
      SELECT 
        i.id as institution_id, i.name as institution_name,
        COUNT(a.id) as total_attendance_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count
      FROM institutions i
      LEFT JOIN batches b ON i.id = b.institution_id
      LEFT JOIN sessions s ON b.id = s.batch_id
      LEFT JOIN attendance a ON s.id = a.session_id
      GROUP BY i.id
    `;
    const summary = await pool.query(summaryQuery);

    res.json(summary.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /institution/data -> Institution
router.get('/institution/data', requireAuth, requireRole(['Institution']), async (req, res) => {
  try {
    const institutionId = req.user.institution_id;
    
    // Fetch batches
    const batches = await pool.query('SELECT id, name, created_at FROM batches WHERE institution_id = $1 ORDER BY created_at DESC', [institutionId]);
    
    // Fetch trainers
    const trainers = await pool.query('SELECT id, name, clerk_user_id FROM users WHERE institution_id = $1 AND role = $2', [institutionId, 'Trainer']);
    
    res.json({
      batches: batches.rows,
      trainers: trainers.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /trainer/data -> Trainer
router.get('/trainer/data', requireAuth, requireRole(['Trainer']), async (req, res) => {
  try {
    const trainerId = req.user.id;
    
    // Fetch batches assigned to this trainer
    const batches = await pool.query(`
      SELECT b.id, b.name 
      FROM batches b
      JOIN batch_trainers bt ON b.id = bt.batch_id
      WHERE bt.trainer_id = $1
      ORDER BY b.created_at DESC
    `, [trainerId]);
    
    // Fetch sessions created by this trainer
    const sessions = await pool.query(`
      SELECT s.id, s.title, s.date, b.name as batch_name 
      FROM sessions s
      JOIN batches b ON s.batch_id = b.id
      WHERE s.trainer_id = $1
      ORDER BY s.date DESC, s.start_time DESC
    `, [trainerId]);
    
    res.json({
      batches: batches.rows,
      sessions: sessions.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
