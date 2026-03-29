"use client";

import { useEffect, useState } from "react";

type DebugData = {
  dbOk: boolean;
  dbError: string;
  users: { id: string; email: string; role: string; createdAt: string }[];
  envStatus: Record<string, boolean>;
};

export default function DebugPage() {
  const [data, setData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [adminPass, setAdminPass] = useState("");
  const [createResult, setCreateResult] = useState("");
  const [creating, setCreating] = useState(false);

  const [testEmail, setTestEmail] = useState("");
  const [testPass, setTestPass] = useState("");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/debug")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createAdmin = async () => {
    setCreating(true);
    setCreateResult("");
    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_admin", email: adminEmail, password: adminPass, name: adminName }),
      });
      const d = await res.json();
      if (d.success) {
        setCreateResult(`✅ ${d.action === "created" ? "Admin created" : "User promoted to admin"}: ${d.user.email} (role: ${d.user.role})`);
        load();
      } else {
        setCreateResult(`❌ ${d.error}`);
      }
    } catch (e: any) {
      setCreateResult(`❌ ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const testLogin = async () => {
    setTesting(true);
    setTestResult("");
    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_login", email: testEmail, password: testPass }),
      });
      const d = await res.json();
      if (d.success) {
        setTestResult(`✅ Credentials valid! Role: ${d.role}. Now try logging in at /account`);
      } else {
        setTestResult(`❌ ${d.reason || d.error}`);
      }
    } catch (e: any) {
      setTestResult(`❌ ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ fontFamily: "monospace", padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>🔧 Auth Debug Page</h1>
      <p style={{ color: "#888", marginBottom: 24, fontSize: 13 }}>
        Delete this page after fixing. Route: <code>/src/app/debug/page.tsx</code>
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : !data ? (
        <p style={{ color: "red" }}>Failed to load debug data</p>
      ) : (
        <>
          {/* DB Status */}
          <section style={sectionStyle}>
            <h2 style={headingStyle}>1. Database Connection</h2>
            <p style={{ color: data.dbOk ? "green" : "red" }}>
              {data.dbOk ? "✅ Connected to Neon PostgreSQL" : `❌ DB Error: ${data.dbError}`}
            </p>
          </section>

          {/* Users */}
          <section style={sectionStyle}>
            <h2 style={headingStyle}>2. Users in Database ({data.users.length})</h2>
            {data.users.length === 0 ? (
              <p style={{ color: "orange" }}>⚠️ No users found. Create an admin below.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={{ ...tdStyle, color: u.role === "admin" ? "green" : "#333", fontWeight: u.role === "admin" ? "bold" : "normal" }}>
                        {u.role}
                      </td>
                      <td style={tdStyle}>{new Date(u.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Env Vars */}
          <section style={sectionStyle}>
            <h2 style={headingStyle}>3. Environment Variables</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 13 }}>
              {Object.entries(data.envStatus).map(([key, set]) => (
                <div key={key} style={{ color: set ? "green" : "red" }}>
                  {set ? "✅" : "❌"} {key}
                </div>
              ))}
            </div>
          </section>

          {/* Test Login */}
          <section style={sectionStyle}>
            <h2 style={headingStyle}>4. Test Login Credentials</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
              <input style={inputStyle} placeholder="Email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
              <input style={inputStyle} placeholder="Password" type="password" value={testPass} onChange={(e) => setTestPass(e.target.value)} />
              <button style={btnStyle} onClick={testLogin} disabled={testing}>
                {testing ? "Testing…" : "Test Credentials"}
              </button>
              {testResult && <p style={{ color: testResult.startsWith("✅") ? "green" : "red", margin: 0 }}>{testResult}</p>}
            </div>
          </section>

          {/* Create Admin */}
          <section style={sectionStyle}>
            <h2 style={headingStyle}>5. Create / Promote Admin User</h2>
            <p style={{ fontSize: 12, color: "#888", marginTop: 0 }}>
              If user already exists, this will promote them to admin and reset their password.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
              <input style={inputStyle} placeholder="Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
              <input style={inputStyle} placeholder="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              <input style={inputStyle} placeholder="Password (min 8 chars)" type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
              <button style={{ ...btnStyle, background: "#2563eb" }} onClick={createAdmin} disabled={creating}>
                {creating ? "Creating…" : "Create / Promote Admin"}
              </button>
              {createResult && <p style={{ color: createResult.startsWith("✅") ? "green" : "red", margin: 0 }}>{createResult}</p>}
            </div>
          </section>

          <button onClick={load} style={{ ...btnStyle, background: "#555", marginTop: 8 }}>
            🔄 Refresh
          </button>
        </>
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#fafafa",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: "16px 20px",
  marginBottom: 16,
};
const headingStyle: React.CSSProperties = { fontSize: 15, fontWeight: "bold", marginTop: 0, marginBottom: 12 };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #ddd" };
const tdStyle: React.CSSProperties = { padding: "6px 10px", borderBottom: "1px solid #f0f0f0" };
const inputStyle: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc",
  fontFamily: "monospace", fontSize: 13, outline: "none",
};
const btnStyle: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 6, border: "none", background: "#16a34a",
  color: "white", fontFamily: "monospace", fontSize: 13, cursor: "pointer",
};
