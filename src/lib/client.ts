import { JournalAPI } from './api';
import { useAuth } from './auth';

export function useJournalApi() {
  const { getAuthToken } = useAuth();
  return new JournalAPI(getAuthToken);
}
