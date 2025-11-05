const FOLDER = 'assets/images/';

export const POST = async ({ request, env }) => {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) return new Response('No file uploaded', { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const size = arrayBuffer.byteLength;
  const asset_id = FOLDER + crypto.randomUUID(); // Web Crypto API
  const updated_at = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO assets (asset_id, mime_type, updated_at, size, data)
    VALUES (?, ?, ?, ?, ?)
  `).bind(asset_id, file.type, updated_at, size, new Uint8Array(arrayBuffer)).run();

  return new Response(JSON.stringify({ asset_id }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const GET = async ({ url, env }) => {
  const asset_id = url.searchParams.get('id');
  if (!asset_id) return new Response('Missing id', { status: 400 });

  const row = await env.DB.prepare(`
    SELECT mime_type, data FROM assets WHERE asset_id = ?
  `).bind(asset_id).first();

  if (!row) return new Response('Not found', { status: 404 });

  return new Response(row.data, {
    headers: {
      'Content-Type': row.mime_type,
      'Content-Disposition': `inline; filename="${asset_id}"`
    }
  });
};
