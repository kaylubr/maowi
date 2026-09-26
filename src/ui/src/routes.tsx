import type { RouteObject } from 'react-router-dom'

import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { FlashcardPage } from './pages/FlashcardPage'
import { IdentificationPage } from './pages/IdentificationPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { McqPage } from './pages/McqPage'
import { RegisterPage } from './pages/RegisterPage'

export const routes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
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
