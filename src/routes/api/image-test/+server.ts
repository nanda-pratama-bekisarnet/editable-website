import { fail, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

// Handle POST /api/image-test
export const POST = async ({ request, platform }) => {
	if (!platform?.env.R2_BUCKET || !platform?.env.DB) {
		return new Response('Storage bindings not configured.', { status: 500 });
	}

	const formData = await request.formData();
	const file = formData.get('imageFile');

	if (!file || !(file instanceof File) || file.size === 0) {
		return new Response('No file uploaded or file invalid.', { status: 400 });
	}

	const fileExtension = file.name.split('.').pop();
	const objectKey = `images/${uuidv4()}.${fileExtension}`;

	try {
		// Upload to R2
		await platform.env.R2_BUCKET.put(objectKey, await file.arrayBuffer(), {
			httpMetadata: { contentType: file.type }
		});

		// Replace with your R2 public domain
		const publicUrl = `https://pub-d9e98b47ac19405d910faf87fc7b274a.r2.dev/${objectKey}`;

		// Insert into D1
		await platform.env.DB.prepare(
			'INSERT INTO images (filename, url) VALUES (?, ?)'
		)
			.bind(file.name, publicUrl)
			.run();

		// Redirect back to /image-test so the page reloads with new image
		return new Response(null, {
			status: 303,
			headers: { Location: '/image-test' }
		});
	} catch (err) {
		console.error('Upload failed:', err);
		return new Response('Upload failed due to a server error.', { status: 500 });
	}
};
