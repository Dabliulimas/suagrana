import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// GET /api/auth/me
export async function GET(request: NextRequest) {
  try {
    // Fazer proxy da requisição para o backend
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Repassar headers de autenticação se existirem
        ...(request.headers.get("authorization") && {
          authorization: request.headers.get("authorization")!,
        }),
        ...(request.headers.get("x-session-token") && {
          "x-session-token": request.headers.get("x-session-token")!,
        }),
        ...(request.headers.get("cookie") && {
          cookie: request.headers.get("cookie")!,
        }),
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erro no proxy de auth:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/auth (login, register, etc)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Determinar a rota específica baseada no body ou pathname
    let backendPath = "/api/auth";
    
    // Se o body contém email e password mas não name, é login
    if (body.email && body.password && !body.name) {
      backendPath = "/api/auth/login";
    }
    // Se contém name, email e password, é register
    else if (body.name && body.email && body.password) {
      backendPath = "/api/auth/register";
    }
    // Se contém refreshToken, é refresh
    else if (body.refreshToken) {
      backendPath = "/api/auth/refresh";
    }
    
    // Fazer proxy da requisição para o backend
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Repassar headers de autenticação se existirem
        ...(request.headers.get("authorization") && {
          authorization: request.headers.get("authorization")!,
        }),
        ...(request.headers.get("x-session-token") && {
          "x-session-token": request.headers.get("x-session-token")!,
        }),
        ...(request.headers.get("cookie") && {
          cookie: request.headers.get("cookie")!,
        }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erro no proxy de auth:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/auth (change password)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Fazer proxy da requisição para o backend
    const response = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Repassar headers de autenticação se existirem
        ...(request.headers.get("authorization") && {
          authorization: request.headers.get("authorization")!,
        }),
        ...(request.headers.get("x-session-token") && {
          "x-session-token": request.headers.get("x-session-token")!,
        }),
        ...(request.headers.get("cookie") && {
          cookie: request.headers.get("cookie")!,
        }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erro no proxy de auth:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token",
    },
  });
}