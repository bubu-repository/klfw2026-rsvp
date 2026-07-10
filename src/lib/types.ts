export type Guest = {
  id: string;
  name: string;
  email: string;
  ticket_hash: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
};

export type CheckInStatus = "checked_in" | "already_checked_in" | "not_found";

export type CheckInResult = {
  status: CheckInStatus;
  guest_name: string | null;
  guest_email: string | null;
  at: string | null;
};
