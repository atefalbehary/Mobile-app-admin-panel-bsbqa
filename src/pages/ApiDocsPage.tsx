const base = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

const ApiDocsPage = () => (
  <div className="p-6 max-w-3xl space-y-4 text-muted-foreground">
    <h1 className="text-xl font-bold text-foreground">Mobile admin API (Node.js)</h1>
    <p>
      Documentation for the separate REST API in the <code className="text-foreground">server/</code> folder. The
      panel reads/writes your MySQL database through this service.
    </p>
    <p>
      Base URL:{" "}
      <code className="text-foreground break-all">{base}</code>
    </p>
    <ul className="list-disc pl-6 text-sm space-y-2">
      <li>
        <code className="text-foreground">POST /api/auth/login</code> — body: <code>{"{ email, password }"}</code>{" "}
        (Laravel admin user: role <code className="text-foreground">1</code> or RBAC <code className="text-foreground">role_id</code> set)
      </li>
      <li>
        Other routes use header <code className="text-foreground">Authorization: Bearer &lt;token&gt;</code>
      </li>
    </ul>
  </div>
);

export default ApiDocsPage;
