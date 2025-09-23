import NextAuth from 'next-auth';
import { getAuthOptions } from '@/lib/auth';

// Defer NextAuth initialization into the request handlers so any
// runtime initialization errors surface during request handling
// instead of at module load time which can cause hard-to-debug
// webpack/runtime errors in dev.
async function handle(req: Request): Promise<Response> {
	try {
		const authOptions = await getAuthOptions()
		const handler = NextAuth(authOptions)
		// NextAuth's App Router handler accepts a Request and returns a Response or Promise<Response>
		return (await handler(req)) as Response
	} catch (_err) {
		console.error('NextAuth initialization error:', _err)
		return new Response('NextAuth initialization error', { status: 500 })
	}
}

export async function GET(req: Request): Promise<Response> {
	return handle(req)
}

export async function POST(req: Request): Promise<Response> {
	return handle(req)
}