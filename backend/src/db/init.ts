import { pool } from './index';
import fs from 'fs';
import path from 'path';

async function initDB() {
  try {
    const schemaPath = path.join(__dirname, '../..', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema.sql...');
    await pool.query(sql);
    console.log('Database tables created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDB();
