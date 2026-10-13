begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-4000-8000-000000000001', 'rls-one@example.test', '{}'),
  ('10000000-0000-4000-8000-000000000002', 'rls-two@example.test', '{}');
insert into public.alert_preferences (user_id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.users), 1, 'Users only read their own profile');
select is((select count(*)::integer from public.alert_preferences), 1, 'Users only read their own email preferences');
select throws_ok($$update public.users set subscription_tier = 'pro'$$, '42501', null, 'Users cannot grant themselves paid access');
select throws_ok($$select * from public.feed_snapshots$$, '42501', null, 'Raw snapshots are not accessible through the public database API');
select * from finish();
rollback;