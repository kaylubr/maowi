import type { DashboardSummary } from "../../api/dashboard";
import { Button } from "../ui/Button";

type DashboardHeroProps = {
  summary: DashboardSummary | null;
  onAdd: () => void;
};

export function DashboardHero({ summary, onAdd }: DashboardHeroProps) {
  const hasModules = summary !== null && summary.module_count > 0;

  return (
    <section
      data-bs-theme="dark"
      className="bg-dark text-white brand-card p-4 p-lg-5 mb-4"
    >
      <div className="row align-items-center g-4">
        <div className="col-12 col-lg-7">
          <h1 className="display-6 fw-bold mb-2">Welcome back</h1>
          <p className="text-white-50 mb-0">{heroLead(summary)}</p>
        </div>

        {hasModules && (
          <div className="col-12 col-lg-5 d-flex justify-content-lg-end">
            <Button onClick={onAdd}>Add module</Button>
          </div>
        )}
      </div>

      {hasModules && summary ? (
        <div className="row row-cols-2 row-cols-lg-4 g-3 mt-4">
          <StatCard label="Modules" value={summary.module_count} />
          <StatCard label="Questions" value={summary.question_count} />
          <StatCard label="Attempts" value={summary.attempt_count} />
          <StatCard
            label="Average score"
            value={formatScore(summary.average_score)}
          />
        </div>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="col">
      <div className="bg-white bg-opacity-10 brand-card h-100 p-3">
        <div className="brand-eyebrow brand-eyebrow-accent mb-1">{label}</div>
        <div className="fs-4 fw-bold">{value}</div>
      </div>
    </div>
  );
}

function heroLead(summary: DashboardSummary | null): string {
  if (summary === null || summary.module_count === 0) {
    return "Add your lecture files and Maowi turns them into questions you can study.";
  }

  const modules = pluralize(summary.module_count, "module");
  const questions = pluralize(summary.question_count, "question");

  return `You've built ${modules} holding ${questions}.`;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function formatScore(score: number | null): string {
  return score === null ? "—" : `${score}%`;
}
