const FILES = ['lecture-04.pdf', 'mitosis.docx', 'organelles.pptx']

export function ModulePreview() {
  return (
    <section id="dashboard" className="landing-section">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-12 col-lg-5">
            <p className="landing-eyebrow mb-2">Your dashboard</p>
            <h2 className="h1 fw-bold mb-2">Every module in one list</h2>
            <p className="text-body-secondary mb-0">
              Each module keeps the question set Maowi wrote for it. Open one and
              pick a mode; every scored run is kept with the module.
            </p>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card landing-card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between gap-3">
                  <div>
                    <h3 className="h5 mb-1">Cell Biology</h3>
                    <p className="text-body-secondary small mb-3">3 files</p>
                    <div className="d-flex flex-wrap gap-2">
                      {FILES.map((file) => (
                        <span key={file} className="landing-chip">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="badge text-bg-secondary">24 questions</span>
                </div>
              </div>
            </div>
            <p className="text-body-secondary small mt-2 mb-0">
              An example module. Your own modules look the same.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
