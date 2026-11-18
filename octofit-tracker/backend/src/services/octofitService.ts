import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

class ServiceError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && Types.ObjectId.isValid(value);
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ServiceError(`${field} is required`, 400);
  }
  return value.trim();
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw new ServiceError('Activity body must be an object', 400);
  if (!isObjectId(input.userId) || !isObjectId(input.teamId)) {
    throw new ServiceError('Valid userId and teamId are required', 400);
  }
  const type = requiredText(input.type, 'type');
  if (typeof input.minutes !== 'number' || !Number.isFinite(input.minutes) || input.minutes < 1) {
    throw new ServiceError('minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: input.userId }),
    Team.exists({ _id: input.teamId }),
  ]);
  if (!user || !team) throw new ServiceError('The referenced user or team does not exist', 404);

  return Activity.create({
    user: input.userId,
    team: input.teamId,
    type,
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw new ServiceError('Team body must be an object', 400);
  const name = requiredText(input.name, 'name');
  const mascot = requiredText(input.mascot, 'mascot');
  const rawMembers = input.members ?? [];
  if (!Array.isArray(rawMembers)) throw new ServiceError('members must be an array of user IDs', 400);

  const memberIds: string[] = [];
  for (const memberId of rawMembers) {
    if (!isObjectId(memberId)) throw new ServiceError('members must contain valid user IDs', 400);
    memberIds.push(memberId);
  }

  if (memberIds.length > 0) {
    const members = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
    if (members.length !== memberIds.length) throw new ServiceError('A referenced team member does not exist', 404);
  }

  const team = await Team.create({ name, mascot, members: memberIds });
  if (memberIds.length > 0) {
    await Team.updateMany(
      { _id: { $ne: team._id }, members: { $in: memberIds } },
      { $pull: { members: { $in: memberIds } } },
    );
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw new ServiceError('No user found for that email address', 404);

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean();
  const focusCandidates = [...new Set([user.fitnessGoal, recentActivity?.type]
    .filter((focus): focus is string => typeof focus === 'string' && focus.trim().length > 0)
    .map((focus) => focus.trim().toLowerCase()))];
  const workouts = await Workout.find({ focus: { $in: focusCandidates } }).lean();
  workouts.sort((left, right) => focusCandidates.indexOf(left.focus.toLowerCase()) - focusCandidates.indexOf(right.focus.toLowerCase()));
  return workouts.map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === user.fitnessGoal.trim().toLowerCase()
      ? `Recommended because it matches your ${user.fitnessGoal} goal.`
      : `Recommended based on your recent ${recentActivity?.type} activity.`,
  }));
}

export { User };
