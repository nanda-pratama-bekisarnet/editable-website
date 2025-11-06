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
		let arrayBuffer: ArrayBuffer;
		let objectKey: string;
		let contentType: string;

		// Check if running in Cloudflare Worker (browser APIs available)
		if (typeof createImageBitmap !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
			// Convert to WebP
			const imageBitmap = await createImageBitmap(file);
			const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(imageBitmap, 0, 0);

			const webpBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
			arrayBuffer = await webpBlob.arrayBuffer();
			objectKey = `images/${uuidv4()}.webp`;
			contentType = 'image/webp';
		} else {
			// Local Node.js fallback: upload original file without conversion
			arrayBuffer = await file.arrayBuffer();
			const extension = file.name.split('.').pop() || 'bin';
			objectKey = `images/${uuidv4()}.${extension}`;
			contentType = file.type;
		}

		// Upload to R2
		await platform.env.R2_BUCKET.put(objectKey, arrayBuffer, {
			httpMetadata: { contentType }
		});

		// Replace with your R2 public URL
		const publicUrl = `https://pub-d9e98b47ac19405d910faf87fc7b274a.r2.dev/${objectKey}`;

		// Save record to D1
		await platform.env.DB.prepare(
			'INSERT INTO images (filename, url) VALUES (?, ?)'
		)
			.bind(
				// Replace original extension with .webp if converted
				typeof createImageBitmap !== 'undefined' ? file.name.replace(/\.[^/.]+$/, '.webp') : file.name,
				publicUrl
			)
			.run();

		// Redirect back to /image-test
		return new Response(null, {
			status: 303,
			headers: { Location: '/image-test' }
		});
	} catch (error) {
		console.error('Upload failed:', error);
		return new Response('Image upload failed.', { status: 500 });
	}
};
