// /app/api/send-invitation/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
	const { userId }: { userId: string } = await req.json()

	try {
		// Get user from users table
		const { data: userData, error: userError } = await supabaseAdmin
			.from('users')
			.select('*')
			.eq('id', userId)
			.single()

		if (userError || !userData) {
			return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
		}

		// Check if auth_created is true (user has already accepted invitation)
		if (userData.auth_created === true) {
			return new Response(JSON.stringify({ error: 'User has already accepted the invitation' }), { status: 400 })
		}

		// Get the base URL for redirect
		let baseUrl = process.env.NEXT_PUBLIC_APP_URL
		if (!baseUrl && process.env.VERCEL_URL) {
			baseUrl = `https://${process.env.VERCEL_URL}`
		}
		if (!baseUrl) {
			baseUrl = 'https://multi-tenant-beta-seven.vercel.app'
		}
		const redirectTo = `${baseUrl}/auth/accept-invite`

		// Fetch tenant name if tenant_id is provided
		let tenantName: string | null = null
		if (userData.tenant_id) {
			const { data: tenantData, error: tenantError } = await supabaseAdmin
				.from('tenants')
				.select('name')
				.eq('id', userData.tenant_id)
				.single()

			if (!tenantError && tenantData) {
				tenantName = tenantData.name
			}
		}

		// Check if auth user exists and get their current status
		let existingAuthUserId = userData.auth_user_id
		let shouldDeleteAuthUser = false

		if (existingAuthUserId) {
			// Check if user has set a password (meaning they've accepted invitation)
			const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(existingAuthUserId)

			if (!authError && authUser?.user) {
				// If user has confirmed email or has metadata, they might have started the process
				// For safety, we'll delete and recreate to ensure a fresh invitation
				shouldDeleteAuthUser = true
			}
		}

		// Delete existing auth user if needed
		if (shouldDeleteAuthUser && existingAuthUserId) {
			await supabaseAdmin.auth.admin.deleteUser(existingAuthUserId)
		}

		// Import formatUserRole helper
		const { formatUserRole } = await import('@/app/helpers/utils')

		// Send invitation email via Supabase
		const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
			userData.email,
			{
				data: {
					full_name: userData.name,
					role: userData.role,
					tenant_id: userData.tenant_id || null,
					tenant_name: tenantName,
					title: userData.title || null,
					user_role: formatUserRole(userData.role),
				},
				redirectTo,
			}
		)

		if (inviteError) {
			return new Response(JSON.stringify({ error: inviteError.message }), { status: 400 })
		}

		if (!inviteData.user) {
			return new Response(JSON.stringify({ error: 'Failed to send invitation' }), { status: 500 })
		}

		const newAuthUserId = inviteData.user.id

		// Update users table with new auth_user_id
		const { error: updateError } = await supabaseAdmin
			.from('users')
			.update({
				auth_user_id: newAuthUserId,
			})
			.eq('id', userId)

		if (updateError) {
			// If update fails, try to delete the newly created auth user
			await supabaseAdmin.auth.admin.deleteUser(newAuthUserId)
			return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
		}

		// Upsert user_invites table (insert or update with new invited_at timestamp)
		const { error: inviteUpsertError } = await supabaseAdmin
			.from('user_invites')
			.upsert({
				email: userData.email,
				invited_at: new Date().toISOString(),
				accepted_at: null, // Reset accepted_at when resending
			}, {
				onConflict: 'email',
			})

		if (inviteUpsertError) {
			console.error('Error upserting user_invites:', inviteUpsertError)
			// Don't fail the request if invite tracking fails, but log it
		}

		return new Response(JSON.stringify({ ok: true, userId }), { status: 200 })
	} catch (error: any) {
		console.error('Error in send-invitation:', error)
		return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { status: 500 })
	}
}
