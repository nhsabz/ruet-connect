
export type Category = 'Lost' | 'Found' | 'Lend' | 'Donate';
export type Role = 'student' | 'teacher';

export interface Item {
  id: string;
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
  'data-ai-hint'?: string;
  userId: string; // Corresponds to User['id'], which is Firebase Auth UID
  ownerName?: string;
  ownerContact?: string;
  createdAt: Date;
}

export interface NewItem {
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
}

export interface User {
  id: string; // Firebase Auth UID
  studentId: string;
  name?: string;
  email: string;
  contactNumber?: string;
  role: Role;
}

export interface ClaimRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  requesterId: string; // Firebase Auth UID
  ownerId: string; // Firebase Auth UID
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
}

    