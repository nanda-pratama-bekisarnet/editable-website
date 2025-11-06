import { v4 as uuidv4 } from 'uuid';

export const POST = async ({ request, platform }) => {
	if (!platform?.env.R2_BUCKET || !platform?.env.DB) {
		return new Response('Storage bindings not configured.', { status: 500 });
	}

	const formData = await request.formData();
	const file = formData.get('imageFile');

	if (!file || !(file instanceof File) || file.size === 0) {
		return new Response('No file uploaded or file invalid.', { status: 400 });
	}

	try {
		// Convert the file to WebP using the built-in Image API
		const imageBitmap = await createImageBitmap(file);
		const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(imageBitmap, 0, 0);

		// Encode to WebP
		const webpBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
		const arrayBuffer = await webpBlob.arrayBuffer();

		// Generate a new UUID-based filename
		const newFilename = `${uuidv4()}.webp`;
		const objectKey = `images/${newFilename}`;
		const publicUrl = `https://pub-d9e98b47ac19405d910faf87fc7b274a.r2.dev/${objectKey}`;

		// Upload the WebP image to R2
		await platform.env.R2_BUCKET.put(objectKey, arrayBuffer, {
			httpMetadata: { contentType: 'image/webp' }
		});

		// Save the new filename to D1 (do not keep original name)
		await platform.env.DB.prepare(
			'INSERT INTO images (filename, url) VALUES (?, ?)'
		)
			.bind(newFilename, publicUrl)
			.run();

		// Redirect back to /image-test
		return new Response(null, {
			status: 303,
			headers: { Location: '/image-test' }
		});
	} catch (error) {
		console.error('WebP conversion/upload failed:', error);
		return new Response('Image conversion failed.', { status: 500 });
	}
};
