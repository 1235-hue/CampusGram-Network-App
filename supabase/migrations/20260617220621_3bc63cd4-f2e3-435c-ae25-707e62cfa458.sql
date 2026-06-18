
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  major TEXT,
  year_of_study INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_auth" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select_auth" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "courses_insert_auth" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "courses_update_creator" ON public.courses FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "courses_delete_creator" ON public.courses FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TYPE public.course_role AS ENUM ('student', 'ta', 'lecturer');
CREATE TABLE public.course_members (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.course_role NOT NULL DEFAULT 'student',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.course_members TO authenticated;
GRANT ALL ON public.course_members TO service_role;
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm_select_auth" ON public.course_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_join_self" ON public.course_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cm_leave_self" ON public.course_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_auth" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_course ON public.posts(course_id);

CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_auth" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert_own" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_auth" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX idx_comments_post ON public.comments(post_id);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  cover_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_auth" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert_own" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update_own" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "events_delete_own" ON public.events FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE INDEX idx_events_starts ON public.events(starts_at);

CREATE TYPE public.rsvp_status AS ENUM ('going', 'interested', 'declined');
CREATE TABLE public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvp_select_auth" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "rsvp_insert_own" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rsvp_update_own" ON public.event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rsvp_delete_own" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);
