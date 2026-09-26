import type { RouteObject } from 'react-router-dom'

import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export const routes: RouteObject[] = [
  { path: '/', element: <div className="p-10 text-center text-white">Landing</div> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <div className="p-10 text-center text-white">Dashboard</div>,
      },
      {
        path: '/modules/:id/mcq',
        element: <div className="p-10 text-center text-white">MCQ</div>,
      },
      {
        path: '/modules/:id/identification',
        element: <div className="p-10 text-center text-white">Identification</div>,
      },
      {
        path: '/modules/:id/flashcard',
        element: <div className="p-10 text-center text-white">Flashcard</div>,
      },
    ],
  },
]
