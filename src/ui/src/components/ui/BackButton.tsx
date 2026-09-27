import { Link } from 'react-router-dom'

export function BackButton() {
  return (
    <Link
      to="/"
      className="btn btn-link text-decoration-none d-inline-flex align-items-center gap-1 px-0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      Back
    </Link>
  )
}
