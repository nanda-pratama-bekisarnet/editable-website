import slugify from 'slugify';
import { SHORTCUTS } from './constants';
import { nanoid } from '$lib/util';
import { ADMIN_PASSWORD } from '$env/static/private';

// Cloudflare D1 version – every function accepts `env.DB`
export async function createArticle(env, title, content, teaser, currentUser) {
  if (!currentUser) throw new Error('Not authorized');

  let slug = slugify(title, { lower: true, strict: true });

  const existing = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?')
    .bind(slug)
    .first();

  if (existing) slug += '-' + nanoid();

  await env.DB.prepare(`
    INSERT INTO articles (slug, title, content, teaser, published_at)
    VALUES (?, ?, ?, ?, DATETIME('now'))
  `)
    .bind(slug, title, content, teaser)
    .run();

  const newArticle = await env.DB.prepare(
    'SELECT slug, created_at FROM articles WHERE slug = ?'
  )
    .bind(slug)
    .first();

  return newArticle;
}

export async function updateArticle(env, slug, title, content, teaser, currentUser) {
  if (!currentUser) throw new Error('Not authorized');

  await env.DB.prepare(`
    UPDATE articles
    SET title = ?, content = ?, teaser = ?, updated_at = datetime('now')
    WHERE slug = ?
  `)
    .bind(title, content, teaser, slug)
    .run();

  const updated = await env.DB.prepare(
    'SELECT slug, updated_at FROM articles WHERE slug = ?'
  )
    .bind(slug)
    .first();

  return updated;
}

export async function authenticate(env, password, sessionTimeout) {
  const expires = __getDateTimeMinutesAfter(sessionTimeout);
  if (password === ADMIN_PASSWORD) {
    const sessionId = nanoid();

    await env.DB.prepare('DELETE FROM sessions WHERE expires < ?')
      .bind(new Date().toISOString())
      .run();

    await env.DB.prepare(
      'INSERT INTO sessions (session_id, expires) VALUES (?, ?)'
    )
      .bind(sessionId, expires)
      .run();

    return { sessionId };
  } else {
    throw new Error('Authentication failed.');
  }
}

export async function destroySession(env, sessionId) {
  await env.DB.prepare('DELETE FROM sessions WHERE session_id = ?')
    .bind(sessionId)
    .run();
  return true;
}

export async function getArticles(env, currentUser) {
  const query = currentUser
    ? `SELECT *, COALESCE(published_at, updated_at, created_at) AS modified_at
       FROM articles ORDER BY modified_at DESC`
    : `SELECT * FROM articles WHERE published_at IS NOT NULL ORDER BY published_at DESC`;

  const { results } = await env.DB.prepare(query).all();
  return results;
}

export async function getNextArticle(env, slug) {
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
    SELECT * FROM (
      SELECT * FROM previous_published
      UNION
      SELECT * FROM latest_article
    )
    ORDER BY published_at ASC
    LIMIT 1;
  `;
  return await env.DB.prepare(query).bind(slug, slug).first();
}

export async function search(env, q, currentUser) {
  const query = currentUser
    ? `
      SELECT title AS name, '/blog/' || slug AS url, COALESCE(published_at, updated_at, created_at) AS modified_at
      FROM articles
      WHERE title LIKE ? COLLATE NOCASE
      ORDER BY modified_at DESC;
    `
    : `
      SELECT title AS name, '/blog/' || slug AS url, COALESCE(published_at, updated_at, created_at) AS modified_at
      FROM articles
      WHERE title LIKE ? COLLATE NOCASE AND published_at IS NOT NULL
      ORDER BY modified_at DESC;
    `;

  const { results } = await env.DB.prepare(query).bind(`%${q}%`).all();

  SHORTCUTS.forEach(s => {
    if (s.name.toLowerCase().includes(q.toLowerCase())) {
      results.push(s);
    }
  });

  return results;
}

export async function getArticleBySlug(env, slug) {
  return await env.DB.prepare('SELECT * FROM articles WHERE slug = ?')
    .bind(slug)
    .first();
}

export async function deleteArticle(env, slug, currentUser) {
  if (!currentUser) throw new Error('Not authorized');
  const result = await env.DB.prepare('DELETE FROM articles WHERE slug = ?')
    .bind(slug)
    .run();
  return result.success;
}

export async function getCurrentUser(env, sessionId) {
  const session = await env.DB.prepare(
    'SELECT session_id, expires FROM sessions WHERE session_id = ? AND expires > ?'
  )
    .bind(sessionId, new Date().toISOString())
    .first();

  return session ? { name: 'Admin' } : null;
}

export async function createOrUpdatePage(env, page_id, page, currentUser) {
  if (!currentUser) throw new Error('Not authorized');

  const existing = await env.DB.prepare(
    'SELECT page_id FROM pages WHERE page_id = ?'
  )
    .bind(page_id)
    .first();

  if (existing) {
    return await env.DB.prepare(
      'UPDATE pages SET data = ?, updated_at = ? WHERE page_id = ? RETURNING page_id'
    )
      .bind(JSON.stringify(page), new Date().toISOString(), page_id)
      .first();
  } else {
    return await env.DB.prepare(
      'INSERT INTO pages (page_id, data, updated_at) VALUES (?, ?, ?) RETURNING page_id'
    )
      .bind(page_id, JSON.stringify(page), new Date().toISOString())
      .first();
  }
}

export async function getPage(env, page_id) {
  const page = await env.DB.prepare('SELECT data FROM pages WHERE page_id = ?')
    .bind(page_id)
    .first();
  return page?.data ? JSON.parse(page.data) : null;
}

export async function createOrUpdateCounter(env, counter_id) {
  const existing = await env.DB.prepare(
    'SELECT counter_id FROM counters WHERE counter_id = ?'
  )
    .bind(counter_id)
    .first();

  if (existing) {
    return await env.DB.prepare(
      'UPDATE counters SET count = count + 1 WHERE counter_id = ? RETURNING count'
    )
      .bind(counter_id)
      .first();
  } else {
    return await env.DB.prepare(
      'INSERT INTO counters (counter_id, count) VALUES (?, 1) RETURNING count'
    )
      .bind(counter_id)
      .first();
  }
}

export async function storeAsset(env, asset_id, file) {
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

  await env.DB.prepare(sql)
    .bind(asset_id, file.type, new Date().toISOString(), file.size, buffer)
    .run();
}

export async function getAsset(env, asset_id) {
  const row = await env.DB.prepare(
    'SELECT asset_id, mime_type, updated_at, size, data FROM assets WHERE asset_id = ?'
  )
    .bind(asset_id)
    .first();

  if (!row) return null;

  return {
    filename: row.asset_id.split('/').pop(),
    mimeType: row.mime_type,
    lastModified: row.updated_at,
    size: row.size,
    data: new Blob([row.data], { type: row.mime_type }),
  };
}

function __getDateTimeMinutesAfter(minutes) {
  return new Date(Date.now() + minutes * 60000).toISOString();
}
