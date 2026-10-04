import { Fragment, memo, type ReactNode } from 'react';
import katex from 'katex';

const mathCache = new Map<string, string>();
function tex(src: string, display: boolean) {
  const key = `${display ? 'D' : 'I'}${src}`;
  let html = mathCache.get(key);
  if (!html) {
    html = katex.renderToString(src, { throwOnError: false, displayMode: display, output: 'html', strict: 'ignore' });
    mathCache.set(key, html);
  }
  return html;
}

// Inline math: $...$ where the opening $ is not followed by a digit/space (so "$65" stays money),
// the closing $ is not preceded by a space and not followed by a digit.
const INLINE = /(\$\$[\s\S]+?\$\$|\$(?=[^\s\d$])[^$\n]{1,160}?(?<=\S)\$(?!\d)|\*\*[^*]+\*\*|\*(?!\s)[^*\n]+?\*|`[^`]+`|\[\[[^\]]+\]\])/g;

export function inline(text: string, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  // A fresh regex per call: inline() recurses for bold/italic, and a shared global regex's lastIndex would be clobbered.
  const re = new RegExp(INLINE.source, 'g');
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${n++}`;
    if (tok.startsWith('$$')) out.push(<span key={k} className="math-display" dangerouslySetInnerHTML={{ __html: tex(tok.slice(2, -2), true) }} />);
    else if (tok.startsWith('$')) out.push(<span key={k} dangerouslySetInnerHTML={{ __html: tex(tok.slice(1, -1), false) }} />);
    else if (tok.startsWith('**')) out.push(<strong key={k}>{inline(tok.slice(2, -2), k)}</strong>);
    else if (tok.startsWith('*')) out.push(<em key={k}>{inline(tok.slice(1, -1), k)}</em>);
    else if (tok.startsWith('`')) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else out.push(<mark key={k}>{tok.slice(2, -2)}</mark>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderTable(lines: string[], key: string) {
  const rows = lines.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const [head, ...body] = rows;
  return (
    <div className="table-scroll" key={key} style={{ marginBottom: 12 }}>
      <table className="data-table">
        <thead>
          <tr>{head.map((h, i) => <th key={i}>{inline(h, `${key}h${i}`)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={j === 0 ? 'rh' : undefined}>{inline(c, `${key}${i}-${j}`)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Block renderer: paragraphs, bullet/numbered lists, > quotes, | tables |, and $$display math$$. */
export const Rich = memo(function Rich({ text, className, as = 'div' }: { text: string; className?: string; as?: 'div' | 'span' }) {
  if (as === 'span') return <span className={className}>{inline(text)}</span>;
  const blocks = text.split(/\n\s*\n/);
  const out: ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split('\n');
    const key = `b${bi}`;
    if (lines.every((l) => l.trim().startsWith('|'))) {
      out.push(renderTable(lines, key));
      return;
    }
    if (lines.every((l) => /^\s*[-•]\s/.test(l))) {
      out.push(<ul key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*[-•]\s/, ''), `${key}${i}`)}</li>)}</ul>);
      return;
    }
    if (lines.every((l) => /^\s*\d+\.\s/.test(l))) {
      out.push(<ol key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+\.\s/, ''), `${key}${i}`)}</li>)}</ol>);
      return;
    }
    if (lines.every((l) => l.startsWith('>'))) {
      out.push(<blockquote key={key}>{inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '), key)}</blockquote>);
      return;
    }
    // Mixed block: intro line(s) followed by a list
    const firstList = lines.findIndex((l) => /^\s*([-•]|\d+\.)\s/.test(l));
    if (firstList > 0 && lines.slice(firstList).every((l) => /^\s*([-•]|\d+\.)\s/.test(l))) {
      const ordered = /^\s*\d+\./.test(lines[firstList]);
      const items = lines.slice(firstList).map((l, i) => <li key={i}>{inline(l.replace(/^\s*([-•]|\d+\.)\s/, ''), `${key}l${i}`)}</li>);
      out.push(
        <Fragment key={key}>
          <p>{inline(lines.slice(0, firstList).join(' '), `${key}p`)}</p>
          {ordered ? <ol>{items}</ol> : <ul>{items}</ul>}
        </Fragment>,
      );
      return;
    }
    out.push(
      <p key={key}>
        {lines.map((l, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {inline(l, `${key}${i}`)}
          </Fragment>
        ))}
      </p>,
    );
  });
  return <div className={`rich ${className ?? ''}`}>{out}</div>;
});

export function TeX({ src, display = false }: { src: string; display?: boolean }) {
  return <span dangerouslySetInnerHTML={{ __html: tex(src, display) }} />;
}

/** Strip markup for plain-text uses (search, AI context, aria labels). */
export function plain(text: string) {
  return text.replace(/\$\$?([^$]+)\$\$?/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\\[a-z]+\{?/gi, '').replace(/[{}]/g, '');
}
