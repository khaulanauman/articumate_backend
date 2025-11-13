const Challenge = require("../../models/community/challenge");
const ChallengeProgress = require("../../models/community/challengeProgress");
const User = require("../../models/userModel"); // <- keep this if your model file is userModel.js
const { Types } = require("mongoose");

// ========== helpers ==========
async function memberCountAgg(challengeId) {
  const r = await ChallengeProgress.aggregate([
    { $match: { challengeId: new Types.ObjectId(challengeId) } },
    { $count: "n" },
  ]);
  return r.length ? r[0].n : 0;
}

async function myRank(challengeId, userId) {
  try {
    const rows = await ChallengeProgress.aggregate([
      { $match: { challengeId: new Types.ObjectId(challengeId) } },
      { $set: { points: "$pointsEarned", tieBreak: "$updatedAt" } },

      // stable display order (points DESC, tiebreak ASC)
      { $sort: { points: -1, tieBreak: 1 } },

      // BUT: rank only by a single field (points)
      {
        $setWindowFields: {
          sortBy: { points: -1 },           // <-- single key only
          output: { rank: { $rank: {} } },
        },
      },

      { $match: { userId: new Types.ObjectId(userId) } },
      { $project: { _id: 0, rank: 1 } },
    ]);
    return rows.length ? rows[0].rank : null;
  } catch {
    // your fallback is fine
    const mine = await ChallengeProgress.findOne({ challengeId, userId }).lean();
    if (!mine) return null;
    const ahead = await ChallengeProgress.countDocuments({
      challengeId,
      $or: [
        { pointsEarned: { $gt: mine.pointsEarned ?? 0 } },
        { pointsEarned: mine.pointsEarned ?? 0, updatedAt: { $lt: mine.updatedAt } },
      ],
    });
    return ahead + 1;
  }
}


// ========== handlers ==========

// GET /api/challenges
const listActive = async (_req, res) => {
  const now = new Date();
  const list = await Challenge.find({
    isActive: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
  })
    .sort({ startAt: 1 })
    .lean();
  res.json(list);
};

// POST /api/challenges/:id/join
const join = async (req, res) => {
  const meId = req.user?._id || req.userId;
  const { id } = req.params;

  const challenge = await Challenge.findById(id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const prog = await ChallengeProgress.findOneAndUpdate(
    { challengeId: id, userId: meId },
    { $setOnInsert: { count: 0, completed: false, pointsEarned: 0 } },
    { upsert: true, new: true }
  );

  // (optional) if you keep a denormalized memberCount in Challenge
  if (prog.createdAt.getTime() === prog.updatedAt.getTime()) {
    await Challenge.findByIdAndUpdate(id, { $inc: { memberCount: 1 } });
  }

  res.json({ joined: true, progress: prog });
};

// POST /api/challenges/:id/record
const recordAttempt = async (req, res) => {
  const meId = req.user?._id || req.userId;
  const { id } = req.params;

  const challenge = await Challenge.findById(id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  let prog = await ChallengeProgress.findOne({ challengeId: id, userId: meId });
  if (!prog) prog = await ChallengeProgress.create({ challengeId: id, userId: meId, count: 0 });

  if (!prog.completed) {
    prog.count += 1;
    if (prog.count >= challenge.targetCount) {
      prog.completed = true;
      prog.pointsEarned += challenge.rewardStars;
      await User.findByIdAndUpdate(meId, {
        $inc: { stars: challenge.rewardStars, points: challenge.rewardStars },
      });
    }
    await prog.save();
  }

  res.json({
    count: prog.count,
    completed: prog.completed,
    pointsEarned: prog.pointsEarned,
  });
};

// GET /api/challenges/leaderboard/top
const leaderboard = async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const top = await User.find({})
    .sort({ points: -1 })
    .limit(limit)
    .select("_id fullName avatar points")
    .lean();
  res.json(top);
};

// GET /api/challenges/:id/summary
const summary = async (req, res) => {
  const meId = req.user?._id || req.userId;
  const { id } = req.params;

  const ch = await Challenge.findById(id).lean();
  if (!ch) return res.status(404).json({ error: "Challenge not found" });

  const prog = await ChallengeProgress.findOne({ challengeId: id, userId: meId }).lean();
  const mCount = typeof ch.memberCount === "number" ? ch.memberCount : await memberCountAgg(id);
  const rank = prog ? await myRank(id, meId) : null;

  res.json({
    challenge: {
      _id: ch._id,
      title: ch.title,
      task: ch.task,
      targetCount: ch.targetCount,
      rewardStars: ch.rewardStars,
      startAt: ch.startAt,
      endAt: ch.endAt,
      isActive: ch.isActive,
    },
    memberCount: mCount,
    myProgress: prog
      ? { count: prog.count, completed: prog.completed, pointsEarned: prog.pointsEarned }
      : null,
    myRank: rank,
  });
};

// GET /api/challenges/:id/leaderboard
const leaderboardForChallenge = async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const skip  = Math.max(parseInt(req.query.skip  || "0", 10), 0);

  const rows = await ChallengeProgress.aggregate([
    { $match: { challengeId: new Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $set: { points: "$pointsEarned", tieBreak: "$updatedAt" } },

    // visual order
    { $sort: { points: -1, tieBreak: 1 } },

    // rank by single key (points)
    {
      $setWindowFields: {
        sortBy: { points: -1 },       // <-- single key only
        output: { rank: { $rank: {} } },
      },
    },

    // now paginate
    { $skip: skip },
    { $limit: limit },

    {
      $project: {
        _id: 0,
        rank: 1,
        pointsEarned: 1,
        user: { _id: "$user._id", fullName: "$user.fullName", avatar: "$user.avatar" },
      },
    },
  ]);

  res.json(rows);
};

module.exports = {
  listActive,
  join,
  recordAttempt,
  leaderboard,
  summary,
  leaderboardForChallenge,
};
