export const GUEST_TITLES = ["Manager", "C-Level", "Investor"] as const;
export type GuestTitle = (typeof GUEST_TITLES)[number];

export type GuestCategory = "regular" | "vip";

export type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  attending_after_party: boolean;
  category: GuestCategory;
  ticket_hash: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
};

export type NewGuest = {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: GuestTitle;
  attending_after_party: boolean;
  category: GuestCategory;
};

export type CheckInStatus = "checked_in" | "already_checked_in" | "not_found";

export type CheckInResult = {
  status: CheckInStatus;
  guest_name: string | null;
  guest_email: string | null;
  at: string | null;
  guest_category: GuestCategory | null;
  after_party: boolean | null;
};
