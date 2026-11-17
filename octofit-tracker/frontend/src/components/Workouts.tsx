import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../hooks/useApiResource.js';

type WorkoutSuggestion = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`;
  const { data, error, loading } = useApiResource<{ suggestions: WorkoutSuggestion[] }>(path);
  return <CapabilityCard title="Workout suggestions" description={`Recommendations for ${demoUserEmail}.`}>
    {loading && <p role="status">Loading workout suggestions...</p>}
    {error && <p role="alert">Unable to load workout suggestions: {error}</p>}
    {data && data.suggestions.length === 0 && <p>No workout suggestions are available.</p>}
    {data && data.suggestions.length > 0 && <ul className="list-group">
      {data.suggestions.map((suggestion, index) => <li className="list-group-item" key={suggestion._id ?? `${suggestion.title}-${index}`}>
        <strong>{suggestion.title}</strong>
        {suggestion.focus && <span> — {suggestion.focus}</span>}
        {suggestion.minutes !== undefined && <span>, {suggestion.minutes} minutes</span>}
        {suggestion.difficulty && <span>, {suggestion.difficulty}</span>}
        {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
      </li>)}
    </ul>}
  </CapabilityCard>;
}
