import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

// Ensure these are set in your .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseBucket = 'product-images' // Or your preferred bucket name

if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		'Supabase URL or Anon Key is not defined. Check your .env file.'
	)
	// Optionally, throw an error or handle this case as appropriate for your application
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.isAdmin) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	// TODO: Add authentication here to ensure only authorized users can upload
	// Partially done: Added admin check
	try {
		const formData = await req.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
		}

		// Optional: Add file type/size validation here
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
				{ status: 400 }
			)
		}
		const maxSize = 5 * 1024 * 1024 // 5MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB` },
				{ status: 400 }
			)
		}

		const fileExtension = file.name.split('.').pop()
		const fileName = `${randomUUID()}.${fileExtension}`
		const filePath = `${fileName}` // Path within the bucket

		const { data, error: uploadError } = await supabase.storage
			.from(supabaseBucket)
			.upload(filePath, file, {
				cacheControl: '3600', // Optional: Cache control settings
				upsert: false, // Optional: true to overwrite if file with same name exists
			})

		if (uploadError) {
			console.error('Supabase upload error:', uploadError)
			return NextResponse.json(
				{ error: 'Failed to upload image.', details: uploadError.message },
				{ status: 500 }
			)
		}

		// Construct the public URL
		const { data: publicUrlData } = supabase.storage
			.from(supabaseBucket)
			.getPublicUrl(data.path)

		if (!publicUrlData || !publicUrlData.publicUrl) {
			console.error('Failed to get public URL for path:', data.path)
			return NextResponse.json(
				{ error: 'Image uploaded but failed to retrieve public URL.' },
				{ status: 500 }
			)
		}

		return NextResponse.json(
			{ imageUrl: publicUrlData.publicUrl },
			{ status: 200 }
		)
	} catch (error) {
		console.error('Upload API error:', error)
		// Check if the error is due to missing Supabase config and provide a more specific message
		if (!supabaseUrl || !supabaseAnonKey) {
			return NextResponse.json(
				{
					error:
						'Image upload service is not configured. Please contact support.',
				},
				{ status: 500 }
			)
		}
		return NextResponse.json(
			{ error: 'An unexpected error occurred during file upload.' },
			{ status: 500 }
		)
	}
}
