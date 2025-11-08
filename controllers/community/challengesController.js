const Challenge = require("../../models/community/challenge");
const ChallengeProgress = require("../../models/community/challengeProgress");
const User = require("../../models/userModel");
const { Types } = require("mongoose");

// helper: compute member count via aggregation (if not using denormalized field)
async function memberCountAgg(challengeId) {
  const r = await ChallengeProgress.aggregate([
    { $match: { challengeId: new Types.ObjectId(challengeId) } },
    { $count: "n" }
  ]);
  return r.length ? r[0].n : 0;
}

// helper: get my rank within a challenge (MongoDB ≥5 w/ $setWindowFields; fallback provided)
async function myRank(challengeId, userId) {
  try {
    const rows = await ChallengeProgress.aggregate([
      { $match: { challengeId: new Types.ObjectId(challengeId) } },
      { $set: { points: "$pointsEarned", tieBreak: "$updatedAt" } },
      {
        $setWindowFields: {
          sortBy: { points: -1, tieBreak: 1 },
          output: { rank: { $rank: {} } }
        }
      },
      { $match: { userId: new Types.ObjectId(userId) } },
      { $project: { _id: 0, rank: 1 } }
    ]);
    return rows.length ? rows[0].rank : null;
  } catch {
    // Fallback if $setWindowFields not available: count how many are ahead
    const ahead = await ChallengeProgress.countDocuments({
      challengeId,
      $or: [
        { pointsEarned: { $gt: (await ChallengeProgress.findOne({ challengeId, userId }).lean())?.pointsEarned ?? 0 } },
        // tie-breaker: same points but earlier updatedAt
      ]
    });
    return ahead + 1;
  }
}

// GET /api/guardian/challenges/:id/summary
exports.summary = async (req, res) => {
  const meId = req.user?._id || req.userId;
  const { id } = req.params;

  const ch = await Challenge.findById(id).lean();
  if (!ch) return res.status(404).json({ error: "Challenge not found" });

  const prog = await ChallengeProgress.findOne({ challengeId: id, userId: meId }).lean();
  const mCount = (typeof ch.memberCount === "number") ? ch.memberCount : await memberCountAgg(id);
  const rank = prog ? await myRank(id, meId) : null;

  res.json({
    challenge: {
      _id: ch._id, title: ch.title, task: ch.task,
      targetCount: ch.targetCount, rewardStars: ch.rewardStars,
      startAt: ch.startAt, endAt: ch.endAt, isActive: ch.isActive
    },
    memberCount: mCount,
    myProgress: prog ? { count: prog.count, completed: prog.completed, pointsEarned: prog.pointsEarned } : null,
    myRank: rank
  });
};

// GET /api/guardian/challenges/:id/leaderboard?limit=20&skip=0
exports.leaderboardForChallenge = async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const skip = Math.max(parseInt(req.query.skip || "0", 10), 0);

  // Window ranks (MongoDB ≥5)
  const rows = await ChallengeProgress.aggregate([
    { $match: { challengeId: new Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $set: { points: "$pointsEarned", tieBreak: "$updatedAt" } },
    {
      $setWindowFields: {
        sortBy: { points: -1, tieBreak: 1 },
        output: { rank: { $rank: {} } }
      }
    },
    { $sort: { points: -1, tieBreak: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        rank: 1,
        pointsEarned: "$pointsEarned",
        user: { _id: "$user._id", fullName: "$user.fullName", avatar: "$user.avatar" }
      }
    }
  ]);

  res.json(rows);
};
