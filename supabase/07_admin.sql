-- =====================================================================
-- PawHomie — admin flag
-- Run once in Supabase → SQL Editor.
-- =====================================================================
alter table profiles add column if not exists is_admin boolean not null default false;

-- Make Bilal the admin. Change the email if his login is different.
update profiles set is_admin = true
where id = (select id from auth.users where email = 'bilal@pawhomie.com');

-- Check it worked (should list Bilal):
select p.id, p.full_name, p.is_admin, u.email
from profiles p join auth.users u on u.id = p.id
where p.is_admin = true;
