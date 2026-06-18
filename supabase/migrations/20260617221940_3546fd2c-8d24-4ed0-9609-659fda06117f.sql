
REVOKE EXECUTE ON FUNCTION public.notify_post_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_follow() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_rsvp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_course_update() FROM PUBLIC, anon, authenticated;
