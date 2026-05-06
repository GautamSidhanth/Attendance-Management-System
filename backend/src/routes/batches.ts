import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db';
import crypto from 'crypto';

const router = Router();

// POST /batches -> Trainer / Institution
router.post('/', requireAuth, requireRole(['Trainer', 'Institution']), async (req, res) => {
  const { name } = req.body;
  const user = req.user;

  try {
    const institutionId = user.institution_id;
    if (!institutionId) {
      return res.status(400).json({ error: 'User does not belong to an institution' });
    }

    const newBatch = await pool.query(
      'INSERT INTO batches (name, institution_id) VALUES ($1, $2) RETURNING *',
      [name, institutionId]
    );

    // If Trainer created it, add them as a trainer for this batch
    if (user.role === 'Trainer') {
      await pool.query(
        'INSERT INTO batch_trainers (batch_id, trainer_id) VALUES ($1, $2)',
        [newBatch.rows[0].id, user.id]
      );
    }

    res.json(newBatch.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /batches/:id/invite -> Trainer
router.post('/:id/invite', requireAuth, requireRole(['Trainer']), async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // Check if trainer is associated with this batch
    const check = await pool.query(
      'SELECT * FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2',
      [id, user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'You do not manage this batch' });
    }

    // In a real app, we might store tokens. For simplicity, we use the batch ID as the invite token.
    // Or we encrypt the batch ID. We'll use base64 encoding of batch ID for a simple invite link.
    const inviteToken = Buffer.from(`batch_${id}`).toString('base64');
    
    // In real app, we'd return a full URL based on env vars
    res.json({ inviteToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /batches/:id/join -> Student
router.post('/:id/join', requireAuth, requireRole(['Student']), async (req, res) => {
  const { id } = req.params;
  const { inviteToken } = req.body;
  const user = req.user;

  try {
    const expectedToken = Buffer.from(`batch_${id}`).toString('base64');
    if (inviteToken !== expectedToken) {
      return res.status(400).json({ error: 'Invalid invite token' });
    }

    // Add student to batch
    await pool.query(
      'INSERT INTO batch_students (batch_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, user.id]
    );

    res.json({ message: 'Joined batch successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /batches/:id/summary -> Institution
router.get('/:id/summary', requireAuth, requireRole(['Institution']), async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // Verify institution owns this batch
    const batch = await pool.query('SELECT * FROM batches WHERE id = $1 AND institution_id = $2', [id, user.institution_id]);
    if (batch.rows.length === 0) {
      return res.status(403).json({ error: 'Batch not found or unauthorized' });
    }

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      WHERE s.batch_id = $1
    `;
    const summary = await pool.query(summaryQuery, [id]);

    res.json(summary.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
