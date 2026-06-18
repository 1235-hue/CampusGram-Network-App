import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, users, posts, postMedia, follows, stories } from "./index";

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  const data = [
    { username: "ava", name: "Ava Chen", email: "ava@example.com", image: "https://i.pravatar.cc/150?img=1", bio: "📚 CS senior · coffee enthusiast" },
    { username: "leo", name: "Leo Park", email: "leo@example.com", image: "https://i.pravatar.cc/150?img=12", bio: "🎶 Music + math" },
    { username: "maya", name: "Maya Singh", email: "maya@example.com", image: "https://i.pravatar.cc/150?img=20", bio: "Future architect 🏛️" },
  ];
  const inserted = await db.insert(users).values(data.map((d) => ({ ...d, passwordHash: hash }))).returning();
  // Follow graph
  await db.insert(follows).values([
    { followerId: inserted[0].id, followingId: inserted[1].id },
    { followerId: inserted[0].id, followingId: inserted[2].id },
    { followerId: inserted[1].id, followingId: inserted[0].id },
  ]);
  // Posts
  const samples = [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
  ];
  for (let i = 0; i < samples.length; i++) {
    const [p] = await db.insert(posts).values({
      authorId: inserted[i % inserted.length].id,
      caption: ["Late-night library vibes ✨", "Sunset on the quad 🌅", "Study group win 🎓", "Espresso break ☕"][i],
      kind: "image",
    }).returning();
    await db.insert(postMedia).values({ postId: p.id, url: samples[i], kind: "image", position: 0 });
  }
  // Stories
  await db.insert(stories).values([
    { authorId: inserted[0].id, mediaUrl: samples[0], mediaKind: "image", expiresAt: new Date(Date.now() + 24*3600*1000) },
    { authorId: inserted[1].id, mediaUrl: samples[1], mediaKind: "image", expiresAt: new Date(Date.now() + 24*3600*1000) },
  ]);
  console.log("Seeded. Login: ava@example.com / password123");
}
main().catch((e) => { console.error(e); process.exit(1); });
