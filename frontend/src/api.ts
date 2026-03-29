const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CheckinPayload {
  user_id: number;
  mood: number;
  sleep: number;
  stress: number;
  text_entry?: string;
  language?: string;
}

export interface CheckinResponse {
  success: boolean;
  checkin_id: number;
  message: string;
}

export const submitCheckin = async (data: CheckinPayload): Promise<CheckinResponse> => {
  const res = await fetch(`${BASE_URL}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Check-in failed: ${res.status}`);
  return res.json();
};

export const getHistory = (userId: number) =>
  fetch(`${BASE_URL}/history/${userId}`).then(r => r.json());

export const runAssessment = (userId: number) =>
  fetch(`${BASE_URL}/assess/${userId}`, { method: 'POST' }).then(r => r.json());

export const getAlerts = (userId: number) =>
  fetch(`${BASE_URL}/alerts/${userId}`).then(r => r.json());

export const getCounselorDashboard = () =>
  fetch(`${BASE_URL}/counselor/dashboard`).then(r => r.json());

export const getCounselorFlags = () =>
  fetch(`${BASE_URL}/counselor/flags`).then(r => r.json());

export const resolveCounselorFlag = (flagId: number) =>
  fetch(`${BASE_URL}/counselor/flags/${flagId}/resolve`, { method: 'POST' }).then(r => r.json());

export const getUsfResources = () =>
  fetch(`${BASE_URL}/usf/counseling-hours`).then(r => r.json());
