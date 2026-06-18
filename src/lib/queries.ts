import { supabase } from "@/integrations/supabase/client";

export const POST_SELECT =
  "id, content, image_url, created_at, author_id, course_id, author:profiles!posts_author_id_fkey(username, full_name, avatar_url), course:courses(code, title), likes:post_likes(user_id), comments(count)";

export async function fetchFeed() {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
