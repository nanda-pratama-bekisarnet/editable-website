import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';

interface Comment {
 id: number;
 content: string;
 created_at: string;
}

// Helper function to initialize the database
async function initializeDatabase(db: D1Database) {
 console.log('Initializing database');
 // Hand rolled SQL to create the table schema (NOT RECOMMENDED)
 const createTableSQL =
  'CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)';
 await db.exec(createTableSQL);
}

// GET - Retrieve all comments
export const GET: RequestHandler = async ({ platform }) => {
 try {
  const db = platform?.env?.DB;
  if (!db) {
   return json({ error: 'Database not available' }, { status: 500 });
  }

  // Initialize the comments table if it doesn't exist
  await initializeDatabase(db);

  const { results } = await db.prepare('SELECT * FROM comments ORDER BY created_at DESC').all();

  return json({ comments: results as unknown as Comment[] });
 } catch (error) {
  console.error('Error fetching comments:', error);
  return json({ error: 'Failed to fetch comments' }, { status: 500 });
 }
};

// POST - Create a new comment
export const POST: RequestHandler = async ({ request, platform }) => {
 try {
  const db = platform?.env?.DB;
  if (!db) {
   return json({ error: 'Database not available' }, { status: 500 });
  }

  const { content } = await request.json();

  if (!content || content.trim() === '') {
   return json({ error: 'Comment content is required' }, { status: 400 });
  }

  // Initialize the comments table if it doesn't exist
  await initializeDatabase(db);

  // Insert the comment
  await db.prepare('INSERT INTO comments (content) VALUES (?)').bind(content.trim()).run();

  return json({ message: 'Comment created successfully' }, { status: 201 });
 } catch (error) {
  console.error('Error creating comment:', error);
  return json({ error: 'Failed to create comment' }, { status: 500 });
 }
};

// DELETE - Delete a comment by ID
export const DELETE: RequestHandler = async ({ url, platform }) => {
 try {
  const db = platform?.env?.DB;
  if (!db) {
   return json({ error: 'Database not available' }, { status: 500 });
  }

  const commentId = url.searchParams.get('id');
  if (!commentId) {
   return json({ error: 'Comment ID is required' }, { status: 400 });
  }

  // First check if the comment exists
  const commentToDelete = await db
   .prepare('SELECT * FROM comments WHERE id = ?')
   .bind(parseInt(commentId))
   .first();

  if (!commentToDelete) {
   return json({ error: 'Comment not found' }, { status: 404 });
  }

  // Delete the comment
  await db.prepare('DELETE FROM comments WHERE id = ?').bind(parseInt(commentId)).run();

  return json({ message: 'Comment deleted successfully', comment: commentToDelete });
 } catch (error) {
  console.error('Error deleting comment:', error);
  return json({ error: 'Failed to delete comment' }, { status: 500 });
 }
};