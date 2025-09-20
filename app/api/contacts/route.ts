import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// GET /api/contacts
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Construir URL do backend
    const backendUrl = `${BACKEND_URL}/api/contacts?${searchParams.toString()}`;
    
    // Fazer proxy da requisição para o backend
    const response = await fetch(backendUrl, {
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
    console.error("Erro no proxy de contacts:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/contacts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Fazer proxy da requisição para o backend
    const response = await fetch(`${BACKEND_URL}/api/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Repassar headers de autenticação se existirem
        ...(request.headers.get("authorization") && {
          authorization: request.headers.get("authorization")!,
        }),
        ...(request.headers.get("x-session-token") && {
          "x-session-token": request.headers.get("x-session-token")!,
        }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erro no proxy de contacts:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Fazer proxy da requisição para o backend
    const response = await fetch(`${BACKEND_URL}/api/contacts`, {
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
    console.error("Erro no proxy de contacts:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Construir URL do backend
    const backendUrl = `${BACKEND_URL}/api/contacts?${searchParams.toString()}`;
    
    // Fazer proxy da requisição para o backend
    const response = await fetch(backendUrl, {
      method: "DELETE",
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
    console.error("Erro no proxy de contacts:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}