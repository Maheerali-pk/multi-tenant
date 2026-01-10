// /app/api/invite-from-super-admin/route.ts  (Next.js App Router example)
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { NextRequest } from 'next/server'
import { InviteFromSuperAdminRequest } from '@/app/types/api.types'
import { formatUserRole } from '@/app/helpers/utils'

export async function POST(req: NextRequest) {
	const { email, full_name, tenant_id, role, title, sendInvitation = true }: InviteFromSuperAdminRequest = await req.json()

	try {
		// tenant_employee role doesn't require auth account - create directly in database
		if (role === 'tenant_employee') {
			// Validate tenant_id is required for tenant_employee
			if (!tenant_id) {
				return new Response(JSON.stringify({ error: 'Tenant ID is required for tenant employee' }), { status: 400 })
			}

			// Generate a unique ID for the user (since no auth account)
			const { randomUUID } = await import('crypto')
			const userId = randomUUID()

			// Insert directly into users table without auth account
			const { error: profileError } = await supabaseAdmin
				.from('users')
				.insert({
					id: userId,
					auth_user_id: null, // No auth account for tenant_employee
					email,
					name: full_name,
					role,
					tenant_id: tenant_id,
					title: title || null,
					invitation_pending: null // No invitations for tenant_employee
				})

			if (profileError) {
				return new Response(JSON.stringify({ error: profileError.message }), { status: 500 })
			}

			return new Response(JSON.stringify({ ok: true, userId }), { status: 200 })
		}

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

		let userData: { user: { id: string } | null } | null = null
		let userId: string

		if (sendInvitation) {
			// 1) Invite user via Supabase - this creates the user and sends invitation email
			const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
				email,
				{
					data: {
						full_name,
						role,
						tenant_id: tenant_id || null,
						tenant_name: tenantName,
						title: title || null,
						user_role: formatUserRole(role),
					},
					redirectTo,
				}
			)

			if (inviteError) {
				return new Response(JSON.stringify({ error: inviteError.message }), { status: 400 })
			}

			if (!data.user) {
				return new Response(JSON.stringify({ error: 'Failed to invite user' }), { status: 500 })
			}

			userData = data
			userId = data.user.id
		} else {
			// Create user without sending invitation email
			const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
				email,
				email_confirm: false, // User needs to confirm via invitation later
				user_metadata: {
					full_name,
					role,
					tenant_id: tenant_id || null,
					tenant_name: tenantName,
					title: title || null,
					user_role: formatUserRole(role),
				},
			})

			if (createError) {
				return new Response(JSON.stringify({ error: createError.message }), { status: 400 })
			}

			if (!data.user) {
				return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500 })
			}

			userData = data
			userId = data.user.id
		}

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
				title: title || null,
				invitation_pending: !sendInvitation // Set to true if we didn't send invitation
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
