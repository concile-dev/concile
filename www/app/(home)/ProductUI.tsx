import './product-ui.css';

// The "screenshots" in the grid. These are real markup rather than images, so
// they stay sharp at any size and can be cropped by the layout without going
// soft.
//
// Every panel here is a surface the product actually has. They are drawn after
// apps/dashboard: the live data browser, the JSON document editor, the function
// runner, the logs table. Nothing on this page shows a screen Concile does not
// ship.

function Caret() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Chrome({ crumb }: { crumb: string }) {
  return (
    <div className="pui-chrome">
      <span className="pui-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="pui-crumb">
        <b>concile</b> / {crumb}
      </span>
    </div>
  );
}

// A JSON block with the dashboard's own colouring. Lines are described rather
// than parsed, because these are fixed samples and a parser would be dead code.
type JsonLine = [indent: number, key: string | null, value: string, kind?: 'str' | 'num' | 'punct'];

function Json({ lines }: { lines: JsonLine[] }) {
  return (
    <pre className="pui-code">
      {lines.map(([indent, key, value, kind = 'str'], i) => (
        <span key={i} style={indent ? { paddingLeft: `${indent * 0.9}rem` } : undefined}>
          {key ? (
            <>
              <em>&quot;{key}&quot;</em>
              <span className="pui-punct">: </span>
            </>
          ) : null}
          <i className={`pui-${kind}`}>{value}</i>
        </span>
      ))}
    </pre>
  );
}

/** The data browser, with a row arriving live over the admin subscription. */
export function DataPanel() {
  const rows = [
    ['msg_8f21c4', 'ada', 'shipped the differ', 'published', '4ms'],
    ['msg_8f21c3', 'grace', 'rebased onto main', 'published', '3ms'],
    ['msg_8f21c2', 'linus', 'reviewing the patch', 'draft', '5ms'],
    ['msg_8f21c1', 'barbara', 'deploy is green', 'published', '3ms'],
    ['msg_8f21c0', 'alan', 'added an index', 'published', '4ms'],
  ];
  const tables: [string, string][] = [
    ['messages', '1,284'],
    ['users', '312'],
    ['sessions', '48'],
    ['files', '184'],
  ];
  return (
    <div className="pui">
      <Chrome crumb="dashboard / data / messages" />
      <div className="pui-split">
        <nav className="pui-side">
          <span className="pui-brand">Concile</span>
          <h4>Tables</h4>
          {tables.map(([name, count], i) => (
            <a className={i === 0 ? 'is-on' : undefined} href="#0" key={name}>
              <span>{name}</span>
              <b>{count}</b>
            </a>
          ))}
          <h4>Tools</h4>
          <a href="#0">
            <span>Functions</span>
          </a>
          <a href="#0">
            <span>Logs</span>
          </a>
        </nav>
        <div className="pui-main">
          <div className="pui-bar">
            <span className="pui-select">
              body <Caret />
            </span>
            <span className="pui-select">
              eq <Caret />
            </span>
            <span className="pui-search">value</span>
            <span className="pui-chip is-live">live</span>
          </div>
          <table className="pui-table">
            <thead>
              <tr>
                <th>_id</th>
                <th>author</th>
                <th className="pui-col-wide">body</th>
                <th className="pui-col-opt">status</th>
                <th className="pui-col-opt">ms</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r[0]} className={i === 0 ? 'is-new' : i === 2 ? 'is-sel' : undefined}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td className="pui-col-wide">{r[2]}</td>
                  <td className="pui-col-opt">
                    <span className="pui-badge">{r[3]}</span>
                  </td>
                  <td className="pui-col-opt">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pui-foot">
            <span className="pui-btn is-ghost">Prev</span>
            <span className="pui-btn is-ghost">Next</span>
            <span className="pui-note">Page 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A document open in the dashboard editor. Saving writes a real mutation. */
export function EditPanel() {
  return (
    <div className="pui">
      <Chrome crumb="dashboard / data / messages" />
      <div className="pui-head">
        <p className="pui-title">Edit document</p>
        <div className="pui-meta">
          <span className="pui-id">msg_8f21c4</span>
          <span>
            Subscribers <b>1,284</b>
          </span>
        </div>
      </div>
      <div className="pui-body">
        <div className="pui-field">
          <span className="pui-label">Fields (JSON)</span>
          <Json
            lines={[
              [0, null, '{', 'punct'],
              [1, 'author', '"usr_3a91"'],
              [1, 'body', '"shipped the differ"'],
              [1, 'status', '"published"'],
              [1, 'reactions', '12', 'num'],
              [0, null, '}', 'punct'],
            ]}
          />
        </div>
        <div className="pui-actions">
          <span className="pui-note">Saving writes a real mutation to your database.</span>
          <span className="pui-btn is-ghost">Cancel</span>
          <span className="pui-btn is-primary">Save</span>
        </div>
      </div>
    </div>
  );
}

/** The function runner: pick a function, pass JSON, see what came back. */
export function RunPanel() {
  return (
    <div className="pui">
      <Chrome crumb="dashboard / functions" />
      <div className="pui-head">
        <p className="pui-title">Function runner</p>
        <div className="pui-meta">
          <span>
            Deployment <b>local</b>
          </span>
        </div>
      </div>
      <div className="pui-body">
        <div className="pui-row">
          <span className="pui-select is-grow">
            messages:send (mutation) <Caret />
          </span>
          <span className="pui-btn is-primary">Run</span>
        </div>
        <div className="pui-field">
          <span className="pui-label">Arguments (JSON)</span>
          <Json
            lines={[
              [0, null, '{', 'punct'],
              [1, 'author', '"usr_3a91"'],
              [1, 'body', '"shipped the differ"'],
              [0, null, '}', 'punct'],
            ]}
          />
        </div>
        <div className="pui-field">
          <span className="pui-label">Result</span>
          <Json
            lines={[
              [0, null, '{', 'punct'],
              [1, '_id', '"msg_8f21c4"'],
              [1, '_creationTime', '1758304868412', 'num'],
              [0, null, '}', 'punct'],
            ]}
          />
        </div>
      </div>
    </div>
  );
}

/** Function execution logs, refreshed live. */
export function LogPanel() {
  const lines: [string, string, string, string][] = [
    ['1284', 'messages:send', 'mutation', '4'],
    ['1283', 'messages:list', 'query', '1'],
    ['1282', 'messages:send', 'mutation', '3'],
    ['1281', 'digest:flush', 'action', '38'],
    ['1280', 'messages:list', 'query', '1'],
    ['1279', 'auth:refresh', 'mutation', '2'],
  ];
  return (
    <div className="pui">
      <Chrome crumb="dashboard / logs" />
      <div className="pui-head">
        <p className="pui-title">
          Logs <span className="pui-note">(live, 2s)</span>
        </p>
      </div>
      <table className="pui-table">
        <thead>
          <tr>
            <th className="pui-col-opt">id</th>
            <th>function</th>
            <th className="pui-col-opt">kind</th>
            <th>status</th>
            <th>ms</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(([id, path, kind, ms]) => (
            <tr key={id}>
              <td className="pui-col-opt">{id}</td>
              <td>
                <code>{path}</code>
              </td>
              <td className="pui-col-opt">
                <span className="pui-badge">{kind}</span>
              </td>
              <td>
                <span className="pui-badge is-ok">ok</span>
              </td>
              <td>{ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
