-- ============================================================
-- CRAFTLY â Supabase Datenbankschema
-- In Supabase: SQL Editor â New query â diesen Code einfÃ¼gen â Run
-- ============================================================

-- Profiles (erweitert den eingebauten auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  rolle text check (rolle in ('verwalter', 'handwerker', 'mieter')),
  telefon text,
  firma text,
  gewerk text,
  plz_bereich text,
  bewertung_avg numeric(3,2) default 0,
  auftraege_anzahl int default 0,
  created_at timestamptz default now()
);

-- Objekte (Immobilien)
create table public.objekte (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  adresse text,
  plz text,
  verwalter_id uuid references public.profiles(id),
  einheiten_anzahl int,
  created_at timestamptz default now()
);

-- Tickets (HerzstÃ¼ck)
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  titel text not null,
  beschreibung text,
  foto_url text,
  status text check (status in ('offen','auktion','in_bearbeitung','erledigt')) default 'offen',
  prioritaet text check (prioritaet in ('normal','hoch','dringend')) default 'normal',
  vergabemodus text check (vergabemodus in ('direkt','auktion')) default 'auktion',
  objekt_id uuid references public.objekte(id),(Ý½¡¹Õ¹ÑáÐ°(ÉÍÑ±±Ñ}Ù½¸ÕÕ¥ÉÉ¹ÌÁÕ±¥¹ÁÉ½¥±Ì¡¥¤°(éÝÕÝ¥Í¹É}¡ÜÕÕ¥ÉÉ¹ÌÁÕ±¥¹ÁÉ½¥±Ì¡¥¤°¢V·FöåöVæFRFÖW7F×G¢À¢¶÷7FVåöfæÂçVÖW&2Ã"À¢7&VFVEöBFÖW7F×G¢FVfVÇBæ÷r¢° ¢òÒÒ&W7BöbfÆR6â&RFFVBâæWB&F6ââ
