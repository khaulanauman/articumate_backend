const mongoose = require("mongoose");
const Challenge = require("./models/community/challenge");

async function run() {
  const MONGO_URL ="mongodb+srv://khaulanauman_db_user:zi0Ta98LQhRmI5kd@articumatedb.e7ezvcg.mongodb.net/database?retryWrites=true&w=majority&appName=articumateDB" ;

  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");

  const now = new Date();

  const challenges = [
    {
      title: "Rabbit",
      task: "Record /r/ sound 3 times",
      targetCount: 3,
      rewardStars: 5,
      icon: "mic",
      startAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      isActive: true,
    },
    {
      title: "Lion",
      task: "Hold vowel sound for 5 seconds",
      targetCount: 3,
      rewardStars: 8,
      icon: "volume_up",
      startAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endAt: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      isActive: true,
    },
    {
      title: "Dolphin",
      task: "Say tongue twister 2 times",
      targetCount: 2,
      rewardStars: 6,
      icon: "record_voice_over",
      startAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endAt: new Date(now.getTime() + 10 * 24 * 3600 * 1000),
      isActive: true,
    }
  ];

  await Challenge.deleteMany({});
  console.log("🧹 Removed old challenges");

  await Challenge.insertMany(challenges);
  console.log("✨ Seeded challenges successfully");

  await mongoose.disconnect();
  console.log("🔌 Disconnected");
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
