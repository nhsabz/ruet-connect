
export type Category = 'Lost' | 'Found' | 'Lend' | 'Donate';

export interface Item {
  id: string;
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
  'data-ai-hint'?: string;
  userId: string; // Corresponds to User['id']
  createdAt: Date;
}

export interface NewItem {
  title: string;
  description: string;
  category: Category;
  image?: File;
}

export interface User {
  id: string; // Student ID
  name?: string;
  email: string;
  contactNumber?: string;
}

export interface ClaimRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  requesterId: string;
  ownerId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
}
