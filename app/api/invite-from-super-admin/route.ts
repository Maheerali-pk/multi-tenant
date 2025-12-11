// /app/api/invite-from-super-admin/route.ts  (Next.js App Router example)
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { NextRequest } from 'next/server'
import { InviteFromSuperAdminRequest } from '@/app/types/api.types'

export async function POST(req: NextRequest) {
	const { email, full_name, tenant_id, role, title }: InviteFromSuperAdminRequest = await req.json()

	try {
		// Get the base URL for redirect
		// Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL > hardcoded production URL
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
		if (tenant_id) {
			const { data: tenantData, error: tenantError } = await supabaseAdmin
				.from('tenants')
				.select('name')
				.eq('id', tenant_id)
				.single()

			if (!tenantError && tenantData) {
				tenantName = tenantData.name
			}
		}

		// 1) Invite user via Supabase - this creates the user and sends invitation email
		const { data: userData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
			email,
			{
				data: {
					full_name,
					role,
					tenant_id: tenant_id || null,
					tenant_name: tenantName,
					title: title || null,
				},
				redirectTo,
			}
		)

		if (inviteError) {
			return new Response(JSON.stringify({ error: inviteError.message }), { status: 400 })
		}

		if (!userData.user) {
			return new Response(JSON.stringify({ error: 'Failed to invite user' }), { status: 500 })
		}

		const userId = userData.user.id

		// 2) Insert profile mapping role & tenant in users table
		const { error: profileError } = await supabaseAdmin
			.from('users')
			.insert({
				id: userId,
				auth_user_id: userId,
				email,
				name: full_name,
				role,
				tenant_id: tenant_id || null,
				title: title || null
			})

		if (profileError) {
			// If profile creation fails, try to delete the auth user
			await supabaseAdmin.auth.admin.deleteUser(userId)
			return new Response(JSON.stringify({ error: profileError.message }), { status: 500 })
		}

		return new Response(JSON.stringify({ ok: true, userId }), { status: 200 })
	} catch (error: any) {
		console.error('Error in invite-from-super-admin:', error)
		return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { status: 500 })
	}
}
