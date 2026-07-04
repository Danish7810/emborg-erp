"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Employee = { id: string; full_name: string; email: string; phone: string; department: string; position: string; salary: number; currency: string; join_date: string; status: string; };

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "HR", "Operations", "Customer Support", "Other"];
const STATUS_COLORS: Record<string, string> = { active: "#10B981", inactive: "#EF4444", on_leave: "#F59E0B" };

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"employees" | "payroll" | "leave">("employees");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [empStatus, setEmpStatus] = useState("active");

  const [payEmployee, setPayEmployee] = useState("");
  const [payPeriod, setPayPeriod] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const [leaveEmployee, setLeaveEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("Annual");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveNotes, setLeaveNotes] = useState("");

  async function fetchData() {
    const supabase = createClient();
    const [{ data: emps }, { data: pay }, { data: lv }] = await Promise.all([
      supabase.from("employees").select("*").order("full_name"),
      supabase.from("payroll").select("*, employees(full_name)").order("created_at", { ascending: false }),
      supabase.from("leave_requests").select("*, employees(full_name)").order("created_at", { ascending: false }),
    ]);
    setEmployees(emps || []);
    setPayrolls(pay || []);
    setLeaves(lv || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function getCompanyId() {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_my_company_id");
    return data;
  }

  async function handleSaveEmployee(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const company_id = await getCompanyId();
    if (!company_id) { setError("Could not get company ID"); setSaving(false); return; }
    const { error: err } = await supabase.from("employees").insert({ full_name: fullName, email, phone, department, position, salary: parseFloat(salary) || 0, join_date: joinDate || new Date().toISOString().split("T")[0], status: empStatus, company_id });
    if (err) { setError(err.message); setSaving(false); return; }
    setFullName(""); setEmail(""); setPhone(""); setDepartment("Engineering"); setPosition(""); setSalary(""); setJoinDate(""); setEmpStatus("active");
    setShowForm(false); setSaving(false); fetchData();
  }

  async function handleSavePayroll(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const company_id = await getCompanyId();
    if (!company_id) { setError("Could not get company ID"); setSaving(false); return; }
    const { error: err } = await supabase.from("payroll").insert({ employee_id: payEmployee, period: payPeriod, amount: parseFloat(payAmount) || 0, notes: payNotes, status: "pending", company_id });
    if (err) { setError(err.message); setSaving(false); return; }
    setPayEmployee(""); setPayPeriod(""); setPayAmount(""); setPayNotes("");
    setShowForm(false); setSaving(false); fetchData();
  }

  async function handleSaveLeave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const company_id = await getCompanyId();
    if (!company_id) { setError("Could not get company ID"); setSaving(false); return; }
    const { error: err } = await supabase.from("leave_requests").insert({ employee_id: leaveEmployee, leave_type: leaveType, start_date: leaveStart, end_date: leaveEnd, notes: leaveNotes, status: "pending", company_id });
    if (err) { setError(err.message); setSaving(false); return; }
    setLeaveEmployee(""); setLeaveType("Annual"); setLeaveStart(""); setLeaveEnd(""); setLeaveNotes("");
    setShowForm(false); setSaving(false); fetchData();
  }

  async function handlePayrollStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("payroll").update({ status, paid_date: status === "paid" ? new Date().toISOString().split("T")[0] : null }).eq("id", id);
    fetchData();
  }

  async function handleLeaveStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("leave_requests").update({ status }).eq("id", id);

    // Fire-and-forget: email the employee that their leave was approved/rejected.
    // Not awaited on purpose — don't block the UI refresh on email delivery.
    fetch("/api/notify-leave-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveRequestId: id }),
    }).catch(() => { /* non-critical — silently ignore notification failures */ });

    fetchData();
  }

  async function handleDelete(table: string, id: string) {
    if (!confirm("Delete this record?")) return;
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", id);
    fetchData();
  }

  const totalPayroll = payrolls.filter((p) => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayroll = payrolls.filter((p) => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>HR and Payroll</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Employees, payroll, and leave management.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); }} className="btn-primary" style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
          {showForm ? "Cancel" : tab === "employees" ? "+ Add Employee" : tab === "payroll" ? "+ Run Payroll" : "+ Request Leave"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Active Employees", value: String(activeEmployees), color: "#10B981" },
          { label: "Pending Leaves", value: String(pendingLeaves), color: "#F59E0B" },
          { label: "Payroll Paid", value: "$" + totalPayroll.toLocaleString(), color: "#3B82F6" },
          { label: "Payroll Pending", value: "$" + pendingPayroll.toLocaleString(), color: "#EF4444" },
        ].map((card, i) => (
          <div key={i} style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>{card.label}</p>
            <p className="tight" style={{ fontSize: "26px", fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "var(--bg-alt)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
        {(["employees", "payroll", "leave"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); }} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", backgroundColor: tab === t ? "var(--bg)" : "transparent", color: tab === t ? "var(--ink)" : "var(--muted)", fontWeight: tab === t ? 600 : 400, fontSize: "13px", cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {showForm && tab === "employees" && (
        <form onSubmit={handleSaveEmployee} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Position / Job title" value={position} onChange={(e) => setPosition(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input placeholder="Monthly salary ($)" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Join date" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={empStatus} onChange={(e) => setEmpStatus(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
          {error && <p style={{ gridColumn: "1 / -1", fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Add Employee"}
          </button>
        </form>
      )}

      {showForm && tab === "payroll" && (
        <form onSubmit={handleSavePayroll} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <select value={payEmployee} onChange={(e) => setPayEmployee(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            <option value="">Select employee</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
          </select>
          <input placeholder="Period (e.g. June 2026)" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Amount ($)" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          {error && <p style={{ gridColumn: "1 / -1", fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Run Payroll"}
          </button>
        </form>
      )}

      {showForm && tab === "leave" && (
        <form onSubmit={handleSaveLeave} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <select value={leaveEmployee} onChange={(e) => setLeaveEmployee(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            <option value="">Select employee</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
          </select>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            <option value="Annual">Annual Leave</option>
            <option value="Sick">Sick Leave</option>
            <option value="Personal">Personal Leave</option>
            <option value="Other">Other</option>
          </select>
          <input placeholder="Start date" type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="End date" type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Notes" value={leaveNotes} onChange={(e) => setLeaveNotes(e.target.value)} style={{ gridColumn: "1 / -1", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          {error && <p style={{ gridColumn: "1 / -1", fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Submit Leave Request"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : tab === "employees" ? (
        employees.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No employees yet. Add your first team member above.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--line)" }}>
                  {["Name", "Position", "Department", "Salary", "Status", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp.id} style={{ borderBottom: i < employees.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}>{emp.full_name}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{emp.position || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{emp.department || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 600 }}>${(emp.salary || 0).toLocaleString()}/mo</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, backgroundColor: STATUS_COLORS[emp.status] + "20", color: STATUS_COLORS[emp.status] }}>
                        {emp.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => handleDelete("employees", emp.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === "payroll" ? (
        payrolls.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No payroll records yet. Run payroll above.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--line)" }}>
                  {["Employee", "Period", "Amount", "Status", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrolls.map((pay, i) => (
                  <tr key={pay.id} style={{ borderBottom: i < payrolls.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}>{pay.employees?.full_name || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{pay.period}</td>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 600 }}>${(pay.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => handlePayrollStatus(pay.id, pay.status === "paid" ? "pending" : "paid")} style={{ padding: "4px 12px", borderRadius: "12px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", backgroundColor: pay.status === "paid" ? "#10B98120" : "#F59E0B20", color: pay.status === "paid" ? "#10B981" : "#F59E0B" }}>
                        {pay.status === "paid" ? "Paid" : "Mark as Paid"}
                      </button>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => handleDelete("payroll", pay.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        leaves.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No leave requests yet.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--line)" }}>
                  {["Employee", "Type", "From", "To", "Status", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.map((lv, i) => (
                  <tr key={lv.id} style={{ borderBottom: i < leaves.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}>{lv.employees?.full_name || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{lv.leave_type}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "13px" }}>{lv.start_date}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "13px" }}>{lv.end_date}</td>
                    <td style={{ padding: "14px 16px", display: "flex", gap: "6px" }}>
                      {lv.status === "pending" ? (
                        <>
                          <button onClick={() => handleLeaveStatus(lv.id, "approved")} style={{ padding: "4px 10px", borderRadius: "10px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", backgroundColor: "#10B98120", color: "#10B981" }}>Approve</button>
                          <button onClick={() => handleLeaveStatus(lv.id, "rejected")} style={{ padding: "4px 10px", borderRadius: "10px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", backgroundColor: "#EF444420", color: "#EF4444" }}>Reject</button>
                        </>
                      ) : (
                        <span style={{ padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, backgroundColor: lv.status === "approved" ? "#10B98120" : "#EF444420", color: lv.status === "approved" ? "#10B981" : "#EF4444" }}>{lv.status}</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => handleDelete("leave_requests", lv.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
