if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
	process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
	process.env.SUPABASE_SERVICE_ROLE_KEY = 'jest-placeholder-service-role-key'
}

import '@testing-library/jest-dom'
