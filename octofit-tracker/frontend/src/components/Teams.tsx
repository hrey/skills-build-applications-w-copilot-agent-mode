import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type Team = { _id?: string; name: string; mascot?: string; members: unknown[] };

export default function Teams() {
  const { data, error, loading } = useApiResource('/api/teams', getJson<{ teams: Team[] }>);
  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {loading && <p role="status">Loading teams...</p>}
    {error && <p role="alert">Unable to load teams: {error}</p>}
    {data && data.teams.length === 0 && <p>No teams yet.</p>}
    {data && data.teams.length > 0 && <ul className="list-group">
      {data.teams.map((team, index) => <li className="list-group-item" key={team._id ?? team.name ?? index}>
        <strong>{team.name}</strong>{team.mascot ? ` — ${team.mascot}` : ''} ({team.members.length} members)
      </li>)}
    </ul>}
  </CapabilityCard>;
}
