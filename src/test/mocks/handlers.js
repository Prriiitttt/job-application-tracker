import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://test.supabase.co';

export const handlers = [
  // Supabase auth
  http.get(`${SUPABASE_URL}/auth/v1/user`, () =>
    HttpResponse.json({ id: 'test-user', email: 'test@example.com' })
  ),
  http.post(`${SUPABASE_URL}/auth/v1/token`, () =>
    HttpResponse.json({
      access_token: 'test',
      refresh_token: 'test',
      user: { id: 'test-user' },
    })
  ),

  // Supabase REST — catch-all empty arrays per verb
  http.get(`${SUPABASE_URL}/rest/v1/*`, () => HttpResponse.json([])),
  http.post(`${SUPABASE_URL}/rest/v1/*`, () => HttpResponse.json([], { status: 201 })),
  http.patch(`${SUPABASE_URL}/rest/v1/*`, () => HttpResponse.json([])),
  http.delete(`${SUPABASE_URL}/rest/v1/*`, () => HttpResponse.json([])),

  // Supabase RPCs
  http.post(`${SUPABASE_URL}/rest/v1/rpc/*`, () => HttpResponse.json([])),

  // Supabase storage signed URLs
  http.post(`${SUPABASE_URL}/storage/v1/object/sign/*`, () =>
    HttpResponse.json({ signedURL: '/test-signed-url' })
  ),

  // Giphy
  http.get('https://api.giphy.com/v1/gifs/*', () =>
    HttpResponse.json({ data: [] })
  ),

  // Anthropic Claude API
  http.post('https://api.anthropic.com/v1/messages', () =>
    HttpResponse.json({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'mocked' }],
    })
  ),
];
