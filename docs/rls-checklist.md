# Supabase RLS Checklist

This document maps every Postgres table the JobTrackr frontend touches to the
Row-Level Security policies it should have. The frontend ships only the public
anon key, so every read/write *must* be gated by RLS — there is no server-side
trust boundary.

Run these checks in the Supabase dashboard → **Authentication → Policies**, or
via SQL:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'application',
    'profiles',
    'connections',
    'user_settings',
    'conversations',
    'conversation_participants',
    'messages'
  );
```

Every row above should have `rowsecurity = true`.

## Tables

### `application`
- [x] RLS enabled
- [x] **SELECT**: `user_id = auth.uid()` — owner only
- [x] **INSERT**: `user_id = auth.uid()` (with check)
- [x] **UPDATE**: `user_id = auth.uid()` (using + with check)
- [x] **DELETE**: `user_id = auth.uid()`
- Frontend access: `App.jsx`, `Applied.jsx`

### `profiles`
- [x] RLS enabled
- [x] **SELECT**: `true` — public profile lookups (Discover, Profile by username)
- [x] **UPDATE**: `id = auth.uid()` — only the owner can edit their profile
- [x] **INSERT**: handled by DB trigger on `auth.users` insert; policy can be `id = auth.uid()` (with check)
- [x] **DELETE**: usually disallowed; cascade from `auth.users` deletion
- Frontend access: `Profile.jsx`, `Discover.jsx`, `Connections.jsx`

### `connections`
- [x] RLS enabled
- [x] **SELECT**: `requester_id = auth.uid() OR receiver_id = auth.uid()` — only sees own
- [x] **INSERT**: `requester_id = auth.uid()`
- [x] **UPDATE**: `receiver_id = auth.uid()` (only receiver can accept/decline) OR `requester_id = auth.uid()` if cancellation is allowed
- [x] **DELETE**: either party can disconnect
- Frontend access: `Profile.jsx`, `Discover.jsx`, `Connections.jsx`

### `user_settings`
- [x] RLS enabled
- [x] **SELECT**: `user_id = auth.uid()`
- [x] **UPSERT (INSERT + UPDATE)**: `user_id = auth.uid()`
- Frontend access: `Analytics.jsx` (weekly goal)

### `conversations`
- [x] RLS enabled
- [x] **SELECT**: `public.is_conversation_participant(id, auth.uid())` (uses `SECURITY DEFINER` helper to avoid recursion)
- [x] **INSERT**: only via `get_or_create_conversation` RPC (`SECURITY DEFINER`); deny direct client inserts
- Frontend access: indirectly via `get_or_create_conversation` RPC

### `conversation_participants`
- [x] RLS enabled
- [x] **SELECT**: `user_id = auth.uid()` — only your own row (this avoids the recursion trap)
- [x] **INSERT**: `user_id = auth.uid()` — created by the RPC for both sides
- [x] **UPDATE**: `user_id = auth.uid()` — only your own row (used to set `last_read_at`)
- Frontend access: `ChatView.jsx` (mark-as-read updates)

### `messages`
- [x] RLS enabled
- [x] **SELECT**: `public.is_conversation_participant(conversation_id, auth.uid())`
- [x] **INSERT**: `sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid())`
- [x] **UPDATE / DELETE**: deny by default (messages are immutable)
- Frontend access: `ChatView.jsx`, `App.jsx` (realtime subscription)

## Storage buckets

### `resumes`
- [x] **Read** policy: signed URLs only (60s expiry); bucket is private
- [x] **Insert** policy: `bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text` — users can only upload to their own folder
- [x] **Delete** policy: same prefix check

### `chat-attachments`
- [x] **Read** policy: any authenticated user (signed URLs are TTL-bound; the URL is generated only after the participant check on `messages`)
- [x] **Insert** policy: `bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text`

## Realtime publication

- [x] `messages` is added to the `supabase_realtime` publication so postgres_changes events fire for new messages

```sql
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime';
```

## RPCs (`SECURITY DEFINER`)

All three are `SECURITY DEFINER` and `set search_path = public` so they bypass
RLS for membership checks without granting the caller broader access:

- [x] `is_conversation_participant(conv_id uuid, uid uuid) → boolean` — used inside RLS policies
- [x] `get_or_create_conversation(other_user_id uuid) → uuid` — finds the existing 1:1 thread regardless of who initiated, creates if missing
- [x] `get_unread_conversations() → setof (...)` — returns per-conversation unread state for the calling user

## What to re-verify periodically

- After adding any new table: confirm `rowsecurity = true` and that every CRUD verb has an explicit policy.
- After changing the schema: re-run the publication-membership query above.
- Before each deploy: spot-check by signing in as a fresh user and confirming you cannot read another user's `application` rows via the REST API.
