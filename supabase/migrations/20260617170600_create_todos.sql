-- todos tablosu
create table if not exists public.todos (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) > 0 and char_length(text) <= 500),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security'yi etkinleştir
alter table public.todos enable row level security;

-- Bu basit demo uygulamasında kimlik doğrulama yok; herkese (anon) tam erişim ver.
create policy "Herkes okuyabilir"
  on public.todos for select
  to anon
  using (true);

create policy "Herkes ekleyebilir"
  on public.todos for insert
  to anon
  with check (true);

create policy "Herkes guncelleyebilir"
  on public.todos for update
  to anon
  using (true)
  with check (true);

create policy "Herkes silebilir"
  on public.todos for delete
  to anon
  using (true);
