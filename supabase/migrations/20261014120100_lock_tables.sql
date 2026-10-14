-- Belt and braces on top of RLS: the browser roles get no direct table access at all.
revoke all on public.players, public.devices, public.weekly from anon, authenticated;
