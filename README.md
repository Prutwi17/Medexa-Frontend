# Medexa Frontend

Multi-vendor medicine home delivery marketplace web application built with React, TypeScript, Vite, and Tailwind CSS.

## Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with Medexa clinical design tokens
- **Routing**: React Router
- **Server State & HTTP**: TanStack Query + Axios
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React

## Route Groups

- **Public**: `/`, `/medicines`, `/medicines/:slug`, `/pharmacies`, `/auth/login`, `/auth/register`
- **Customer**: `/customer/*`
- **Pharmacy**: `/pharmacy/*`
- **Rider**: `/rider/*`
- **Admin**: `/admin/*`

## Setup

1. Copy `.env.example` to `.env` and configure `VITE_API_BASE_URL`.
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
