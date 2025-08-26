
import type { User, Item, ClaimRequest } from './types';

// This file is now primarily for reference or seeding a brand new database.
// The main application logic now fetches data directly from Firestore.

export const mockUsers: User[] = [
  { id: 'auth_uid_1', studentId: '2103141', name: 'Sabbir Huda', email: '2103141@student.ruet.ac.bd', contactNumber: '01234567890', role: 'student' },
  { id: 'auth_uid_2', studentId: '2001001', name: 'Jane Doe', email: '2001001@student.ruet.ac.bd', contactNumber: '01987654321', role: 'student' },
  { id: 'auth_uid_3', studentId: '2207050', name: 'John Smith', email: '2207050@student.ruet.ac.bd', contactNumber: '01555555555', role: 'student' },
];


export const mockItems: Item[] = [
  {
    id: 'item_1',
    title: 'Lost Scientific Calculator',
    description: 'Casio FX-991EX ClassWiz, lost near the EEE building. Has a small sticker on the back.',
    category: 'Lost',
    imageUrl: 'https://placehold.co/600x400.png',
    'data-ai-hint': 'calculator electronics',
    userId: 'auth_uid_1',
    createdAt: new Date('2024-07-20T10:00:00Z'),
  },
];

export const mockRequests: ClaimRequest[] = [
    {
        id: 'req_1',
        itemId: 'item_1',
        itemTitle: 'Lost Scientific Calculator',
        requesterId: 'auth_uid_2',
        ownerId: 'auth_uid_1',
        status: 'Pending',
        createdAt: new Date('2024-07-21T18:00:00Z'),
    },
];

    