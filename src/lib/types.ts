import type { DefaultSession } from 'next-auth';

export enum RelationshipTypeEnum {
  // Primary family relationships (can be requested)
  Father = 'Father',
  Mother = 'Mother',
  Son = 'Son',
  Daughter = 'Daughter',
  
  // Extended family relationships (for reference only, cannot be requested directly)
  Brother = 'Brother',
  Sister = 'Sister',
  Husband = 'Husband',
  Wife = 'Wife',
  Grandfather = 'Grandfather',
  Grandmother = 'Grandmother',
  Grandson = 'Grandson',
  Granddaughter = 'Granddaughter',
  Uncle = 'Uncle',
  Aunt = 'Aunt',
  Nephew = 'Nephew',
  Niece = 'Niece',
  Cousin = 'Cousin',
  First_cousin = 'First_cousin',
  Second_cousin = 'Second_cousin',
  Stepfather = 'Stepfather',
  Stepmother = 'Stepmother',
  Stepbrother = 'Stepbrother',
  Stepsister = 'Stepsister',
  Stepson = 'Stepson',
  Stepdaughter = 'Stepdaughter',
  Father_in_law = 'Father_in_law',
  Mother_in_law = 'Mother_in_law',
  Son_in_law = 'Son_in_law',
  Daughter_in_law = 'Daughter_in_law',
  Brother_in_law = 'Brother_in_law',
  Sister_in_law = 'Sister_in_law',
}

// Only these relationships can be requested
export const ALLOWED_REQUEST_RELATIONSHIPS = [
  RelationshipTypeEnum.Father,
  RelationshipTypeEnum.Mother,
  RelationshipTypeEnum.Son,
  RelationshipTypeEnum.Daughter,
] as const;

export enum RelationshipStatusEnum {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface User {
  userId: string;
  fullName: string;
  nickname?: string;
  email: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  profilePhotoUrl?: string;
  bio?: string;
  occupation?: string;
  education?: string;
  livingStatus?: string;
  privacy?: string;
  familyCode?: string;
}

export interface Relationship {
  id?: string;
  fromUserId: string;
  toUserId: string;
  relationshipType: RelationshipTypeEnum;
  status: RelationshipStatusEnum;
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
  fromUser?: User;
  toUser?: User;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: DefaultSession['user'] & {
      id: string;
    };
    accessToken?: string;
  }
}
