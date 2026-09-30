import type { RouteObject } from 'react-router-dom'

import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ContactPage } from './pages/ContactPage'
import { DashboardPage } from './pages/DashboardPage'
import { FlashcardPage } from './pages/FlashcardPage'
import { IdentificationPage } from './pages/IdentificationPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { McqPage } from './pages/McqPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { TermsPage } from './pages/TermsPage'

export const routes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/contact', element: <ContactPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/modules/:id/mcq',
        element: <McqPage />,
      },
      {
        path: '/modules/:id/identification',
        element: <IdentificationPage />,
      },
      {
        path: '/modules/:id/flashcard',
        element: <FlashcardPage />,
      },
    ],
  },
]
