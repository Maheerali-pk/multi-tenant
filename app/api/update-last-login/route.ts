// /app/api/update-last-login/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
	try {
		const { userId }: { userId: string } = await req.json()

		if (!userId) {
			return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 })
		}

		// Update last_loggedin_at to current timestamp
		const { error: updateError } = await supabaseAdmin
			.from('users')
			.update({
				last_loggedin_at: new Date().toISOString(),
			})
			.eq('id', userId)

		if (updateError) {
			console.error('Error updating last login:', updateError)
			return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
		}

		return new Response(JSON.stringify({ ok: true }), { status: 200 })
	} catch (error: any) {
		console.error('Error in update-last-login:', error)
		return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { status: 500 })
	}
}
