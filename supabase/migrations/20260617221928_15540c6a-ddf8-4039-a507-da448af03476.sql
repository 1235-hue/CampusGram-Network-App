
CREATE TYPE public.notification_type AS ENUM ('like','comment','follow','rsvp','course_update');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_recipient_created_idx ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX notifications_recipient_unread_idx ON public.notifications(recipient_id) WHERE read = false;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = recipient_id);

-- Triggers (SECURITY DEFINER so they can insert past RLS)
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author UUID;
BEGIN
  SELECT author_id INTO author FROM public.posts WHERE id = NEW.post_id;
  IF author IS NOT NULL AND author <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id)
    VALUES (author, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author UUID;
BEGIN
  SELECT author_id INTO author FROM public.posts WHERE id = NEW.post_id;
  IF author IS NOT NULL AND author <> NEW.author_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id)
    VALUES (author, NEW.author_id, 'comment', NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_comment();

CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.follower_id <> NEW.following_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_follow
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

CREATE OR REPLACE FUNCTION public.notify_rsvp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE host UUID;
BEGIN
  SELECT created_by INTO host FROM public.events WHERE id = NEW.event_id;
  IF host IS NOT NULL AND host <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, event_id)
    VALUES (host, NEW.user_id, 'rsvp', NEW.event_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_rsvp
AFTER INSERT ON public.event_rsvps
FOR EACH ROW EXECUTE FUNCTION public.notify_rsvp();

CREATE OR REPLACE FUNCTION public.notify_course_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type, course_id, message)
  SELECT cm.user_id, auth.uid(), 'course_update', NEW.id, 'Course "' || NEW.code || '" was updated'
  FROM public.course_members cm
  WHERE cm.course_id = NEW.id AND cm.user_id <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_course_update
AFTER UPDATE ON public.courses
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title OR OLD.description IS DISTINCT FROM NEW.description OR OLD.code IS DISTINCT FROM NEW.code)
EXECUTE FUNCTION public.notify_course_update();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
