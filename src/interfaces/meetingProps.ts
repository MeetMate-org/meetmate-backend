//meetingProps.ts
export interface MeetingProps {
  title: string;
  description: string;
  startTime: Date;
  duration: number;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  organizer: string;
  organizerName: string;
  times: {
    value: string;
    votes: number;
  }[];
}