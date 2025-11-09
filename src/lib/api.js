import slugify from 'slugify';
import { SHORTCUTS } from './constants';
import { nanoid } from '$lib/util';

/**
 * Helpers
 */
function __getDateTimeMinutesAfter(minutes) {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

/**
 * Get database from platform
 */
function getDB(platform) {
  if (!platform?.env?.DB) throw new Error('Database not found on platform.env.DB');
  return platform.env.DB;
}

/**
 * Creates a new article
 */
export async function createArticle(platform, title, content, teaser, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = getDB(platform);

  let slug = slugify(title, { lower: true, strict: true });
  const existsResult = await db.prepare('SELECT * FROM articles WHERE slug = ?').bind(slug).all();
  if (existsResult.results.length > 0) slug = `${slug}-${nanoid()}`;

  await db.prepare(`
    INSERT INTO articles (slug, title, content, teaser, published_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(slug, title, content, teaser).run();

  const result = await db.prepare('SELECT slug, created_at FROM articles WHERE slug = ?').bind(slug).all();
  return result.results[0] || null;
}

/**
 * Updates an article
 */
export async function updateArticle(platform, slug, title, content, teaser, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = getDB(platform);

  await db.prepare(`
    UPDATE articles
    SET title = ?, content = ?, teaser = ?, updated_at = datetime('now')
    WHERE slug = ?
  `).bind(title, content, teaser, slug).run();

  const result = await db.prepare('SELECT slug, updated_at FROM articles WHERE slug = ?').bind(slug).all();
  return result.results[0] || null;
}

/**
 * Authentication
 */
export async function authenticate(platform, password, sessionTimeout) {
  const db = getDB(platform);
  const expires = __getDateTimeMinutesAfter(sessionTimeout);
  const adminPassword = platform.env.ADMIN_PASSWORD;

  if (password !== adminPassword) throw new Error('Authentication failed.');

  const sessionId = nanoid();
  await db.prepare('DELETE FROM sessions WHERE expires < ?').bind(new Date().toISOString()).run();
  await db.prepare('INSERT INTO sessions (session_id, expires) VALUES (?, ?)').bind(sessionId, expires).run();

  return { sessionId };
}

/**
 * Destroy session
 */
export async function destroySession(platform, sessionId) {
  const db = getDB(platform);
  await db.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
  return true;
}

/**
 * List all available articles (newest first)
 */
export async function getArticles(platform, currentUser) {
  const db = getDB(platform);
  const query = currentUser
    ? `SELECT *, COALESCE(published_at, updated_at, created_at) AS modified_at FROM articles ORDER BY modified_at DESC`
    : `SELECT * FROM articles WHERE published_at IS NOT NULL ORDER BY published_at DESC`;

  const result = await db.prepare(query).all();
  return result.results;
}

/**
 * Determine next article
 */
export async function getNextArticle(platform, slug) {
  const db = getDB(platform);
  const query = `
    WITH previous_published AS (
      SELECT title, teaser, slug, published_at
      FROM articles
      WHERE published_at < (SELECT published_at FROM articles WHERE slug = ?)
      ORDER BY published_at DESC
      LIMIT 1
    ),
    latest_article AS (
      SELECT title, teaser, slug, published_at
      FROM articles
      WHERE slug <> ?
      ORDER BY published_at DESC
      LIMIT 1
    )
    SELECT title, teaser, slug, published_at
    FROM (
      SELECT * FROM previous_published
      UNION
      SELECT * FROM latest_article
    )
    ORDER BY published_at ASC
    LIMIT 1;
  `;
  const result = await db.prepare(query).bind(slug, slug).all();
  return result.results[0] || null;
}

/**
 * Search for content
 */
export async function search(platform, q, currentUser) {
  const db = getDB(platform);
  const query = currentUser
    ? `SELECT title AS name, '/blog/' || slug AS url, COALESCE(published_at, updated_at, created_at) AS modified_at
       FROM articles
       WHERE title LIKE ? COLLATE NOCASE
       ORDER BY modified_at DESC;`
    : `SELECT title AS name, '/blog/' || slug AS url, COALESCE(published_at, updated_at, created_at) AS modified_at
       FROM articles
       WHERE title LIKE ? COLLATE NOCASE AND published_at IS NOT NULL
       ORDER BY modified_at DESC;`;

  const result = await db.prepare(query).bind(`%${q}%`).all();
  const results = result.results;

  SHORTCUTS.forEach(shortcut => {
    if (shortcut.name.toLowerCase().includes(q.toLowerCase())) {
      results.push(shortcut);
    }
  });

  return results;
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(platform, slug) {
  const db = getDB(platform);
  const result = await db.prepare('SELECT * FROM articles WHERE slug = ?').bind(slug).all();
  return result.results[0] || null;
}

/**
 * Delete article
 */
export async function deleteArticle(platform, slug, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = getDB(platform);
  const result = await db.prepare('DELETE FROM articles WHERE slug = ?').bind(slug).run();
  return result.success;
}

/**
 * Get current user
 */
export async function getCurrentUser(platform, session_id) {
  if (!session_id) return null;
  const db = getDB(platform);
  const result = await db.prepare(
    'SELECT session_id, expires FROM sessions WHERE session_id = ? AND expires > ?'
  ).bind(session_id, new Date().toISOString()).all();
  const row = result.results[0];
  return row ? { name: 'Admin' } : null;
}

/**
 * Create or update a page
 */
export async function createOrUpdatePage(platform, page_id, page, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = getDB(platform);

  const pageExistsResult = await db.prepare('SELECT page_id FROM pages WHERE page_id = ?').bind(page_id).all();
  const pageExists = pageExistsResult.results[0];
  const jsonData = JSON.stringify(page);
  const now = new Date().toISOString();

  if (pageExists) {
    const updateResult = await db.prepare(
      'UPDATE pages SET data = ?, updated_at = ? WHERE page_id = ? RETURNING page_id'
    ).bind(jsonData, now, page_id).all();
    return updateResult.results[0] || null;
  } else {
    const insertResult = await db.prepare(
      'INSERT INTO pages (page_id, data, updated_at) VALUES (?, ?, ?) RETURNING page_id'
    ).bind(page_id, jsonData, now).all();
    return insertResult.results[0] || null;
  }
}

/**
 * Get page data
 */
export async function getPage(platform, page_id) {
  const db = getDB(platform);
  const result = await db.prepare('SELECT data FROM pages WHERE page_id = ?').bind(page_id).all();
  const row = result.results[0];
  return row?.data ? JSON.parse(row.data) : null;
}

/**
 * Counter helper
 */
export async function createOrUpdateCounter(platform, counter_id) {
  const db = getDB(platform);
  const counterResult = await db.prepare('SELECT counter_id FROM counters WHERE counter_id = ?').bind(counter_id).all();
  const counterExists = counterResult.results[0];

  if (counterExists) {
    const updateResult = await db.prepare(
      'UPDATE counters SET count = count + 1 WHERE counter_id = ? RETURNING count'
    ).bind(counter_id).all();
    return updateResult.results[0] || null;
  } else {
    const insertResult = await db.prepare(
      'INSERT INTO counters (counter_id, count) VALUES (?, 1) RETURNING count'
    ).bind(counter_id).all();
    return insertResult.results[0] || null;
  }
}
/**
 * Store asset (migrated to R2, but DB unchanged)
 */
export async function storeAsset(platform, asset_id, file) {
  const db = getDB(platform);
  const arrayBuffer = await file.arrayBuffer();

  // 1️⃣ Upload to R2 instead of storing binary in D1
  const r2 = platform.env.R2_BUCKET;
  await r2.put(asset_id, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  });

  // 2️⃣ Store metadata in D1 (same SQL, keep structure)
  // You can put an empty buffer or a small note instead of the actual data
  const sql = `
    INSERT INTO assets (asset_id, mime_type, updated_at, size, data)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (asset_id) DO UPDATE SET
      mime_type = excluded.mime_type,
      updated_at = excluded.updated_at,
      size = excluded.size,
      data = excluded.data
  `;

  const placeholder = new TextEncoder().encode(`r2://${asset_id}`);
  await db.prepare(sql)
    .bind(asset_id, file.type, new Date().toISOString(), file.size, placeholder)
    .run();
}


/**
 * Get asset (reads file from R2, metadata from D1)
 */
export async function getAsset(platform, asset_id) {
  const db = getDB(platform);

  const result = await db.prepare(`
    SELECT asset_id, mime_type, updated_at, size
    FROM assets
    WHERE asset_id = ?
  `).bind(asset_id).all();

  const row = result.results[0];
  if (!row) return null;

  // Try to get from R2
  const r2 = platform.env.R2_BUCKET;
  const object = await r2.get(asset_id);
  if (!object) return null;

  const data = await object.arrayBuffer();

  return {
    filename: row.asset_id.split('/').slice(-1)[0],
    mimeType: row.mime_type,
    lastModified: row.updated_at,
    size: row.size,
    data: new Blob([data], { type: row.mime_type }),
    // Optionally include a public R2 URL if you want to display it directly:
    url: `${platform.env.R2_PUBLIC_URL}/${asset_id}`
  };
}
