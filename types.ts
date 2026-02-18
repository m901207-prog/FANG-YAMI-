
export interface Participant {
  id: string;
  name: string;
  isDuplicate?: boolean;
}

export interface GroupResult {
  groupName: string;
  members: string[];
  description: string;
}

export interface LuckyDrawRecord {
  id: string;
  prizeName: string;
  winners: string[];
  timestamp: string;
}

export enum AppTab {
  NAME_MANAGEMENT = 'NAME_MANAGEMENT',
  LUCKY_DRAW = 'LUCKY_DRAW',
  GROUPING = 'GROUPING'
}
