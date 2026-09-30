const SKELETON_ROWS = 4

export function ModuleGridSkeleton() {
  return (
    <div className="row row-cols-1 row-cols-md-2 g-4" aria-hidden="true">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div className="col" key={index}>
          <div className="card h-100 brand-card">
            <div className="card-body d-flex flex-column">
              <p className="placeholder-glow mb-2">
                <span className="placeholder col-7" />
              </p>
              <p className="placeholder-glow mb-4">
                <span className="placeholder col-5" />
              </p>
              <div className="d-flex gap-2 mt-auto">
                <span className="placeholder-glow flex-grow-1">
                  <span className="placeholder col-12" />
                </span>
                <span className="placeholder-glow col-3">
                  <span className="placeholder col-12" />
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
