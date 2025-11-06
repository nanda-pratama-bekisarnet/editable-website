import { v4 as uuidv4 } from 'uuid';

export const POST = async ({ request, platform }) => {
	if (!platform?.env.R2_BUCKET || !platform?.env.DB || !platform?.env.R2_PUBLIC_URL) {
		return new Response('Storage bindings not configured.', { status: 500 });
	}

	const formData = await request.formData();
	const file = formData.get('imageFile');

	if (!file || !(file instanceof File) || file.size === 0) {
		return new Response('No file uploaded or file invalid.', { status: 400 });
	}

	try {
		const arrayBuffer = await file.arrayBuffer();
		const ext = file.name.split('.').pop() || 'bin';
		const newFilename = `${uuidv4()}.${ext}`;
		const objectKey = `images/${newFilename}`;

		// Use R2_PUBLIC_URL from environment
		const publicUrl = `${platform.env.R2_PUBLIC_URL}/${objectKey}`;

		// Upload the file as-is
		await platform.env.R2_BUCKET.put(objectKey, arrayBuffer, {
			httpMetadata: { contentType: file.type || 'application/octet-stream' }
		});

		// Save filename and URL in D1
		await platform.env.DB.prepare(
			'INSERT INTO images (filename, url) VALUES (?, ?)'
		).bind(newFilename, publicUrl).run();

		return new Response(null, {
			status: 303,
			headers: { Location: '/image-test' }
		});
	} catch (error) {
		console.error('Upload failed:', error);
		return new Response('Image upload failed.', { status: 500 });
	}
};
