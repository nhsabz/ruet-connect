import type { User, Item, ClaimRequest } from './types';

export const mockUsers: User[] = [
  { id: '2103141' },
  { id: '2001001' },
  { id: '2207050' },
];

export const mockItems: Item[] = [
  {
    id: '1',
    title: 'Lost Scientific Calculator',
    description: 'Casio FX-991EX ClassWiz, lost near the EEE building. Has a small sticker on the back.',
    category: 'Lost',
    imageUrl: 'https://placehold.co/600x400.png',
    'data-ai-hint': 'calculator electronics',
    userId: '2103141',
    createdAt: new Date('2024-07-20T10:00:00Z'),
  },
  {
    id: '2',
    title: 'Found Keys',
    description: 'A set of keys on a blue lanyard found in the central library, 2nd floor.',
    category: 'Found',
    imageUrl: 'https://placehold.co/600x400.png',
    'data-ai-hint': 'keys metal',
    userId: '2001001',
    createdAt: new Date('2024-07-21T14:30:00Z'),
  },
  {
    id: '3',
    title: 'Cycle Pump for Lend',
    description: 'Standard cycle pump available for lending. I live in Shahidul Islam Hall.',
    category: 'Lend',
    imageUrl: 'https://placehold.co/600x400.png',
    'data-ai-hint': 'bicycle pump',
    userId: '2207050',
    createdAt: new Date('2024-07-19T09:00:00Z'),
  },
  {
    id: '4',
    title: 'Donate Physics Textbook',
    description: 'Donating "Fundamentals of Physics" by Halliday, Resnick, and Walker. 10th edition.',
    category: 'Donate',
    imageUrl: 'https://placehold.co/600x400.png',
    'data-ai-hint': 'book textbook',
    userId: '2103141',
    createdAt: new Date('2024-07-22T11:00:00Z'),
  },
  {
    id: '5',
    title: 'Found ID Card',
    description: 'Found a student ID card near the cafeteria. Name: A. B. Student, ID: 2207050.',
    category: 'Found',
    imageUrl: 'https://placehold.co/600x400.png',
    'data-ai-hint': 'id card',
    userId: '2001001',
    createdAt: new Date('2024-07-22T16:20:00Z'),
  },
];

export const mockRequests: ClaimRequest[] = [
    {
        id: 'req1',
        itemId: '3',
        itemTitle: 'Cycle Pump for Lend',
        requesterId: '2103141',
        ownerId: '2207050',
        status: 'Pending',
        createdAt: new Date('2024-07-21T18:00:00Z'),
    },
    {
        id: 'req2',
        itemId: '4',
        itemTitle: 'Donate Physics Textbook',
        requesterId: '2001001',
        ownerId: '2103141',
        status: 'Approved',
        createdAt: new Date('2024-07-22T12:00:00Z'),
    }
];
