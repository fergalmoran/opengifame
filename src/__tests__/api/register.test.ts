import {describe, expect, mock, test} from 'bun:test';

mock.module('next/server', () => ({
  NextRequest: Request,
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

const {POST} = await import('@/app/api/auth/register/route');

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  }) as any;
}

const validBody = {email: 'alice@example.com', password: 'secret123', username: 'alice'};

describe('POST /api/auth/register', () => {
  test('400 when email is missing', async () => {
    const res = await POST(makeRequest({password: 'secret123', username: 'alice'}));
    expect(res.status).toBe(400);
  });

  test('400 when password is missing', async () => {
    const res = await POST(makeRequest({email: 'alice@example.com', username: 'alice'}));
    expect(res.status).toBe(400);
  });

  test('400 when username is missing', async () => {
    const res = await POST(makeRequest({email: 'alice@example.com', password: 'secret123'}));
    expect(res.status).toBe(400);
  });

  test('400 when username contains spaces', async () => {
    const res = await POST(makeRequest({...validBody, username: 'alice bob'}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/space/i);
  });

  test('400 when username exceeds 32 characters', async () => {
    const res = await POST(makeRequest({...validBody, username: 'a'.repeat(33)}));
    expect(res.status).toBe(400);
  });

  test('400 when password is shorter than 6 characters', async () => {
    const res = await POST(makeRequest({...validBody, password: '123'}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/6 char/i);
  });

  test('400 when email format is invalid', async () => {
    const res = await POST(makeRequest({...validBody, email: 'not-an-email'}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  test('201 on valid registration', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBeTruthy();
  });
});
