import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const { data, error, loading } = useApiResource('/api/leaderboard', getJson<{ leaderboard: LeaderboardEntry[] }>);
  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {loading && <p role="status">Loading leaderboard...</p>}
    {error && <p role="alert">Unable to load leaderboard: {error}</p>}
    {data && data.leaderboard.length === 0 && <p>No leaderboard scores yet.</p>}
    {data && data.leaderboard.length > 0 && <ol className="list-group list-group-numbered">
      {data.leaderboard.map((entry) => <li className="list-group-item" key={entry.teamName}>
        <strong>{entry.teamName}</strong> — {entry.totalPoints} points (rank {entry.rank})
      </li>)}
    </ol>}
  </CapabilityCard>;
}
