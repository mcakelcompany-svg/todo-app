-- Test/sahipsiz verileri temizle (önceki anonim dönemden kalanlar)
delete from public.todos;

-- Her görevi bir kullanıcıya bağla
alter table public.todos
  add column user_id uuid not null
  references auth.users (id) on delete cascade
  default auth.uid();

create index if not exists todos_user_id_idx on public.todos (user_id);

-- Eski herkese-açık (anon) politikaları kaldır
drop policy if exists "Herkes okuyabilir" on public.todos;
drop policy if exists "Herkes ekleyebilir" on public.todos;
drop policy if exists "Herkes guncelleyebilir" on public.todos;
drop policy if exists "Herkes silebilir" on public.todos;

-- Yeni politikalar: yalnızca giriş yapmış kullanıcı, yalnızca kendi kayıtları
create policy "Kullanici kendi gorevlerini okur"
  on public.todos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Kullanici kendi gorevini ekler"
  on public.todos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Kullanici kendi gorevini gunceller"
  on public.todos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Kullanici kendi gorevini siler"
  on public.todos for delete
  to authenticated
  using (auth.uid() = user_id);
