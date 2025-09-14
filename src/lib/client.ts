import { JournalAPI } from './api';
import { useAuth } from './auth';

// If you call APIs in React components, prefer using this hook:
export function useJournalApi() {
  const { getAuthToken } = useAuth();
  return new JournalAPI(getAuthToken);
}
