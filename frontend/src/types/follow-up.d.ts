import { FollowUpType } from '../constants/enums';
declare global {
  interface FollowUp {
    id: number;
    candidateId: number;
    type: FollowUpType;
    content: string;
    contactedAt: string;
    createdById: number;
    createdBy?: User;
    createdAt: string;
    updatedAt: string;
  }
}
export {};
