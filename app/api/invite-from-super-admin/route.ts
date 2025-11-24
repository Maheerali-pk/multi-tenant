// /app/api/invite-tenant-admin/route.ts  (Next.js App Router example)
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { NextRequest } from 'next/server'
import { InviteFromSuperAdminRequest } from '@/app/types/api.types'
import nodemailer from 'nodemailer'

// Generate a random password
function generateRandomPassword(length: number = 12): string {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
	let password = ''
	for (let i = 0; i < length; i++) {
		password += charset.charAt(Math.floor(Math.random() * charset.length))
	}
	return password
}

// Send email with credentials using nodemailer
async function sendCredentialsEmail(
	email: string,
	fullName: string,
	password: string,
	role: string,
	title?: string,
	tenantName?: string
) {
	const emailBody = `
Hello ${fullName},

Your account has been created. Please use the following credentials to sign in:

Email: ${email}
Password: ${password}
${title ? `Title: ${title}` : ''}
${tenantName ? `Tenant: ${tenantName}` : ''}
Role: ${role}

Please sign in at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin

For security reasons, please change your password after your first login.

Best regards,
Your Team
	`.trim()

	// Check if SMTP credentials are configured
	const smtpEmail = process.env.SMTP_EMAIL?.trim()
	const smtpPassword = process.env.SMTP_PASSWORD?.trim()

	if (!smtpEmail || !smtpPassword) {
		console.error('SMTP_EMAIL or SMTP_PASSWORD is not set in environment variables')
		console.error(`SMTP_EMAIL: ${smtpEmail ? 'SET' : 'NOT SET'}`)
		console.error(`SMTP_PASSWORD: ${smtpPassword ? 'SET' : 'NOT SET'}`)
		console.log('=== EMAIL CREDENTIALS (Development Only - No SMTP Config) ===')
		console.log(`To: ${email}`)
		console.log(`Subject: Your Account Credentials`)
		console.log(`Body:\n${emailBody}`)
		console.log('==========================================')
		throw new Error('Email service not configured: SMTP_EMAIL or SMTP_PASSWORD is missing')
	}

	// Create nodemailer transporter
	const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
	const smtpPort = parseInt(process.env.SMTP_PORT || '587')
	const smtpSecure = process.env.SMTP_SECURE === 'true'

	console.log('SMTP Config:', {
		host: smtpHost,
		port: smtpPort,
		secure: smtpSecure,
		user: smtpEmail,
		passwordSet: !!smtpPassword
	})

	const transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpSecure, // true for 465, false for other ports
		auth: {
			user: smtpEmail,
			pass: smtpPassword,
		},
	})

	// Send email using nodemailer
	const mailOptions = {
		from: smtpEmail,
		to: email,
		subject: 'Your Account Credentials',
		text: emailBody,
		html: emailBody.replace(/\n/g, '<br>'),
	}

	try {
		const info = await transporter.sendMail(mailOptions)
		console.log('Email sent successfully:', info.messageId)
		return info
	} catch (error: any) {
		console.error('Nodemailer email error:', error)
		throw new Error(`Failed to send email: ${error.message}`)
	}
}

export async function POST(req: NextRequest) {
	const { email, full_name, tenant_id, role, title }: InviteFromSuperAdminRequest = await req.json()

	try {
		// Generate a random password
		const password = generateRandomPassword()

		// 1) Create user with dummy password
		const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true, // Auto-confirm email
			user_metadata: {
				full_name,
				role,
			},
		})

		if (createError) {
			return new Response(JSON.stringify({ error: createError.message }), { status: 400 })
		}

		if (!userData.user) {
			return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500 })
		}

		const userId = userData.user.id

		let tenantName: string | undefined
		if (tenant_id) {
			const { data: tenantData } = await supabaseAdmin
				.from('tenants')
				.select('name')
				.eq('id', tenant_id)
				.single()
			tenantName = tenantData?.name
		}

		// 3) Insert profile mapping role & tenant
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

		// 4) Send email with credentials
		try {
			await sendCredentialsEmail(
				email,
				full_name,
				password,
				role,
				title,
				tenant_id
			)
		} catch (emailError: any) {
			console.error('Error sending email:', emailError)
			// Log the error but don't fail the user creation
			// User is already created, so we return success but log the email error
			// You might want to store this in a queue for retry or notify admin
		}

		return new Response(JSON.stringify({ ok: true, userId }), { status: 200 })
	} catch (error: any) {
		console.error('Error in invite-from-super-admin:', error)
		return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { status: 500 })
	}
}
