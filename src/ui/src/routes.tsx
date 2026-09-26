import type { RouteObject } from 'react-router-dom'

export const routes: RouteObject[] = [
  { path: '/', element: <div className="p-10 text-center text-white">Landing</div> },
  { path: '/login', element: <div className="p-10 text-center text-white">Login</div> },
  {
    path: '/register',
    element: <div className="p-10 text-center text-white">Register</div>,
  },
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
]
