# RUET Connect

Live Site: [https://ruet-connect.vercel.app/](https://ruet-connect.vercel.app/)

RUET Connect is a modern Next.js web application designed as a community platform for students of RUET (Rajshahi University of Engineering & Technology).

## Overview

RUET Connect provides a central hub for students to share resources, report lost and found items, lend or donate goods, and connect with each other in a secure and organized way.

## Features

- **User Authentication**: Secure sign-up, login, and password reset for RUET students using their university email.
- **Item Posting**: Post items in four categories:
  - **Lost**: Report lost items on campus.
  - **Found**: Help return found items to their owners.
  - **Lend**: Offer items for temporary borrowing (e.g., tools, books).
  - **Donate**: Give away items (e.g., textbooks) to fellow students for free.
- **Image Uploads**: Upload images for item posts. Images are securely stored using **Cloudinary** (not Firebase Storage).
- **Browse and Search**: Easily browse all posted items, filter by category, and search by title.
- **User Profiles**: View your profile with name, student ID, contact info, and a list of your posted items and received requests.
- **Request System**: Send and manage requests to claim, borrow, or receive items. Owners are notified and can manage requests from their profile.

## Technologies Used

- **Next.js** (App Router)
- **TypeScript**
- **React**
- **Tailwind CSS**
- **ShadCN UI** (component library)
- **Firebase** (Authentication, Firestore database)
- **Cloudinary** (Image storage)
- **React Context API** (state management)
- **React Hook Form** & **Zod** (form and validation)
- **Genkit** (AI integration setup)

## Storage

All images uploaded by users are stored securely using **Cloudinary**. This ensures fast, reliable, and scalable image hosting for all item posts.
