import { Calculator, type ToolId } from '../components/calculator/Calculator';

const IDS: ToolId[] = ['describe', 'freq', 'position', 'regression', 'prob', 'dist', 'binomial', 'trials'];

export function CalculatorPage({ query }: { query: URLSearchParams }) {
  const t = query.get('tool') as ToolId | null;
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Statistics calculator</h1>
          <p>Every calculation in the course, with the steps shown and what the answer means. Paste data straight from a table — commas, spaces, or new lines all work.</p>
        </div>
      </div>
      <Calculator initial={t && IDS.includes(t) ? t : 'describe'} />
    </div>
  );
}
