import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		"Missing Supabase environment variables. Please check your .env.local file. You need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
	);
}

// Client-side Supabase client (for use in client components)
export const createClient = () => {
	return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Default export for backward compatibility (client-side only)
// This will be used by existing client components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

