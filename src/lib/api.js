import slugify from 'slugify';
import { SHORTCUTS } from './constants';
import { nanoid } from '$lib/util';
import { Blob } from 'node:buffer';

/**
 * Creates a new article
 */
export async function createArticle(platform, title, content, teaser, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = platform.env.DB;

  let slug = slugify(title, { lower: true, strict: true });
  const articleExists = await db.prepare('SELECT * FROM articles WHERE slug = ?').bind(slug).get();
  if (articleExists) slug = slug + '-' + nanoid();

  await db.prepare(`
    INSERT INTO articles (slug, title, content, teaser, published_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(slug, title, content, teaser).run();

  return await db.prepare('SELECT slug, created_at FROM articles WHERE slug = ?').bind(slug).get();
}

/**
 * Updates an article
 */
export async function updateArticle(platform, slug, title, content, teaser, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = platform.env.DB;

  await db.prepare(`
    UPDATE articles
    SET title = ?, content = ?, teaser = ?, updated_at = datetime('now')
    WHERE slug = ?
  `).bind(title, content, teaser, slug).run();

  return await db.prepare('SELECT slug, updated_at FROM articles WHERE slug = ?').bind(slug).get();
}

/**
 * Authentication
 */
export async function authenticate(platform, password, sessionTimeout) {
  const db = platform.env.DB;
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
  const db = platform.env.DB;
  await db.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
  return true;
}

/**
 * List all available articles (newest first)
 */
export async function getArticles(platform, currentUser) {
  const db = platform.env.DB;
  let query;

  if (currentUser) {
    query = `
      SELECT *, COALESCE(published_at, updated_at, created_at) AS modified_at
      FROM articles
      ORDER BY modified_at DESC
    `;
  } else {
    query = `
      SELECT * FROM articles
      WHERE published_at IS NOT NULL
      ORDER BY published_at DESC
    `;
  }

  const result = await db.prepare(query).all();
  return result.results;
}

/**
 * Determine next article
 */
export async function getNextArticle(platform, slug) {
  const db = platform.env.DB;
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
  const result = await db.prepare(query).bind(slug, slug).get();
  return result;
}

/**
 * Search for content
 */
export async function search(platform, q, currentUser) {
  const db = platform.env.DB;
  let query;
  if (currentUser) {
    query = `
      SELECT title AS name, '/blog/' || slug AS url,
      COALESCE(published_at, updated_at, created_at) AS modified_at
      FROM articles
      WHERE title LIKE ? COLLATE NOCASE
      ORDER BY modified_at DESC;
    `;
  } else {
    query = `
      SELECT title AS name, '/blog/' || slug AS url,
      COALESCE(published_at, updated_at, created_at) AS modified_at
      FROM articles
      WHERE title LIKE ? COLLATE NOCASE AND published_at IS NOT NULL
      ORDER BY modified_at DESC;
    `;
  }

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
  const db = platform.env.DB;
  return await db.prepare('SELECT * FROM articles WHERE slug = ?').bind(slug).get();
}

/**
 * Delete article
 */
export async function deleteArticle(platform, slug, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = platform.env.DB;

  const result = await db.prepare('DELETE FROM articles WHERE slug = ?').bind(slug).run();
  return result.success;
}

/**
 * Get current user
 */
export async function getCurrentUser(platform, session_id) {
  const db = platform.env.DB;
  const stmt = await db.prepare(
    'SELECT session_id, expires FROM sessions WHERE session_id = ? AND expires > ?'
  ).bind(session_id, new Date().toISOString()).get();

  if (stmt) {
    return { name: 'Admin' };
  } else {
    return null;
  }
}

/**
 * Create or update a page
 */
export async function createOrUpdatePage(platform, page_id, page, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const db = platform.env.DB;

  const pageExists = await db.prepare('SELECT page_id FROM pages WHERE page_id = ?').bind(page_id).get();
  const jsonData = JSON.stringify(page);
  const now = new Date().toISOString();

  if (pageExists) {
    return await db.prepare(
      'UPDATE pages SET data = ?, updated_at = ? WHERE page_id = ? RETURNING page_id'
    ).bind(jsonData, now, page_id).get();
  } else {
    return await db.prepare(
      'INSERT INTO pages (page_id, data, updated_at) values(?, ?, ?) RETURNING page_id'
    ).bind(page_id, jsonData, now).get();
  }
}

/**
 * Get page data
 */
export async function getPage(platform, page_id) {
  const db = platform.env.DB;
  const page = await db.prepare('SELECT data FROM pages WHERE page_id = ?').bind(page_id).get();
  return page?.data ? JSON.parse(page.data) : null;
}

/**
 * Counter helper
 */
export async function createOrUpdateCounter(platform, counter_id) {
  const db = platform.env.DB;
  const counterExists = await db.prepare('SELECT counter_id FROM counters WHERE counter_id = ?')
    .bind(counter_id)
    .get();

  if (counterExists) {
    return await db.prepare(
      'UPDATE counters SET count = count + 1 WHERE counter_id = ? RETURNING count'
    ).bind(counter_id).get();
  } else {
    return await db.prepare(
      'INSERT INTO counters (counter_id, count) values(?, 1) RETURNING count'
    ).bind(counter_id).get();
  }
}

/**
 * Store asset
 */
export async function storeAsset(platform, asset_id, file) {
  const db = platform.env.DB;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const sql = `
    INSERT INTO assets (asset_id, mime_type, updated_at, size, data)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (asset_id) DO UPDATE SET
      mime_type = excluded.mime_type,
      updated_at = excluded.updated_at,
      size = excluded.size,
      data = excluded.data
  `;
  await db.prepare(sql)
    .bind(asset_id, file.type, new Date().toISOString(), file.size, buffer)
    .run();
}

/**
 * Get asset
 */
export async function getAsset(platform, asset_id) {
  const db = platform.env.DB;
  const sql = `
    SELECT asset_id, mime_type, updated_at, size, data
    FROM assets
    WHERE asset_id = ?
  `;
  const row = await db.prepare(sql).bind(asset_id).get();

  if (!row) return null;

  return {
    filename: row.asset_id.split('/').slice(-1)[0],
    mimeType: row.mime_type,
    lastModified: row.updated_at,
    size: row.size,
    data: new Blob([row.data], { type: row.mime_type })
  };
}

/**
 * Helpers
 */
function __getDateTimeMinutesAfter(minutes) {
  return new Date(Date.now() + minutes * 60000).toISOString();
}
