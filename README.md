# RUET Connect

This is a Next.js web application built in Firebase Studio that serves as a community platform for students of RUET (Rajshahi University of Engineering & Technology).

## Description

RUET Connect is a community-based platform designed specifically for the students of RUET. Its main goal is to create a central hub where students can help each other by sharing resources and information in an organized and efficient way.

### Key Features

- **User Authentication**: The site has a complete user system. Students can create a secure account using their email, log in, and also reset their password if they forget it. There is also a pre-configured demo account for easy testing.
- **Item Posting**: Logged-in users can post items across four distinct categories:
  - **Lost**: To report personal items that have been lost on campus.
  - **Found**: To post details about items that have been found, helping to return them to their rightful owner.
  - **Lend**: To offer items for temporary borrowing, such as tools, books, or a cycle pump.
  - **Donate**: To give away items like old textbooks or other useful things to fellow students for free.
- **Image Uploads**: When posting an item, users can upload an image to provide a clear visual, which is especially useful for lost and found items. These images are securely stored using Firebase Storage.
- **Browse and Discover**: A comprehensive "Browse" page displays all the items posted on the platform. Users can easily switch between the four categories using tabs and use a search bar to quickly find specific items by title.
- **User Profiles**: Each user has a personal profile page that shows their name, student ID, and contact details. This page also conveniently lists all the items they have personally posted and any requests they have received from other students.
- **Request System**: To manage interactions, there is a simple "Claim / Request" system. When a student is interested in an item (like a donated textbook or a found wallet), they can send a request to the owner. The owner is then notified and can view and manage these requests from their profile page.

### Technologies Used

- **Framework**: **Next.js** (utilizing the App Router for modern, server-centric routing).
- **Language**: **TypeScript** for type safety and improved developer experience.
- **UI Library**: **React** for building the user interface components.
- **Styling**: **Tailwind CSS** for a utility-first styling approach.
- **UI Components**: **ShadCN UI** for a pre-built, accessible, and customizable component library.
- **Backend Services**: **Firebase** is used for:
  - **Authentication**: Handling user sign-up, login, and session management.
  - **Storage**: Storing user-uploaded images for item posts.
- **State Management**: **React Context API** is used for managing global application state (like the current user, items, and requests).
- **Form Management**: **React Hook Form** for building and managing forms, paired with **Zod** for robust schema validation.
- **AI Integration**: The project is set up with **Genkit** for potential future integration of generative AI features.

arreh pera nai
