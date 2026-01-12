import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { NextRequest } from 'next/server'

export async function DELETE(req: NextRequest) {
	try {
		const { userId, authUserId } = await req.json()

		if (!userId) {
			return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 })
		}

		// Get user email before deletion (needed for user_invites deletion)
		const { data: userData, error: userFetchError } = await supabaseAdmin
			.from('users')
			.select('email')
			.eq('id', userId)
			.single()

		if (userFetchError) {
			console.error('Error fetching user email:', userFetchError)
			// Continue with deletion even if we can't get email
		}

		// Delete user's comments from policy_comments table first
		const { error: commentsDeleteError } = await supabaseAdmin
			.from('policy_comments')
			.delete()
			.eq('user_id', userId)

		if (commentsDeleteError) {
			console.error('Error deleting user comments:', commentsDeleteError)
			// Continue with user deletion even if comments deletion fails
		}

		// Delete from user_invites table by email (if email exists)
		if (userData?.email) {
			const { error: invitesDeleteError } = await supabaseAdmin
				.from('user_invites')
				.delete()
				.eq('email', userData.email)

			if (invitesDeleteError) {
				console.error('Error deleting user from user_invites:', invitesDeleteError)
				// Continue with user deletion even if user_invites deletion fails
			}
		}

		// Delete from users table
		const { error: deleteError } = await supabaseAdmin
			.from('users')
			.delete()
			.eq('id', userId)

		if (deleteError) {
			console.error('Error deleting user from database:', deleteError)
			return new Response(JSON.stringify({ error: deleteError.message || 'Failed to delete user from database' }), { status: 500 })
		}

		// Delete from Supabase Auth (if auth_user_id exists)
		if (authUserId) {
			const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)

			if (authDeleteError) {
				console.error('Error deleting user from auth:', authDeleteError)
				return new Response(JSON.stringify({ error: authDeleteError.message || 'Failed to delete user from authentication system' }), { status: 500 })
			}
		}

		return new Response(JSON.stringify({ ok: true }), { status: 200 })
	} catch (error: any) {
		console.error('Error in delete-user:', error)
		return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { status: 500 })
	}
}

