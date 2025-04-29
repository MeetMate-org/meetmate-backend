//meetingProps.ts
export interface MeetingProps {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  organizer: string;
  times: {
    value: string;
    votes: number;
  }[];
}