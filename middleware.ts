import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Função middleware principal
function middlewareHandler(request: NextRequest) {
  // Middleware simples que apenas permite todas as requisições
  return NextResponse.next()
}

// Exportação nomeada para Next.js
export const middleware = middlewareHandler

// Exportação default para compatibilidade com Netlify Edge Functions
export default middlewareHandler

// Configuração do matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
