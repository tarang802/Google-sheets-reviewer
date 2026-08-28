import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import SubmissionCard from "../components/SubmissionCard.jsx";
import ReviewModal from "../components/ReviewModal.jsx";
import { getTrack, getDecision, getUniqueTracks } from "../lib/fields.js";

export default function Dashboard({ reviewer, onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingRow, setSavingRow] = useState(null);

  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [trackFilter, setTrackFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getSubmissions();
      setSubmissions(res.submissions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecide(rowNumber, decision) {
    setSavingRow(rowNumber);
    try {
      await api.setDecision(rowNumber, decision);
      setSubmissions((prev) =>
        prev.map((r) => (r.rowNumber === rowNumber ? { ...r, Decision: decision } : r))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingRow(null);
    }
  }

  const tracks = useMemo(() => getUniqueTracks(submissions), [submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((r) => {
      if (statusFilter !== "ALL" && getDecision(r) !== statusFilter) return false;
      if (trackFilter !== "ALL" && getTrack(r) !== trackFilter) return false;
      if (search.trim()) {
        const haystack = JSON.stringify(r).toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [submissions, statusFilter, trackFilter, search]);

  const counts = useMemo(() => {
    const c = { ALL: submissions.length, PENDING: 0, ACCEPTED: 0, REJECTED: 0 };
    submissions.forEach((r) => {
      c[getDecision(r)] = (c[getDecision(r)] || 0) + 1;
    });
    return c;
  }, [submissions]);

  const selectedIndex = filtered.findIndex((r) => r.rowNumber === selectedRow);
  const selectedRecord = selectedIndex >= 0 ? filtered[selectedIndex] : null;

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo brand-logo--small" src="/mic_logo_pixel.png" alt="Microsoft Innovations Club" />
          <div>
            <div className="brand-title">Microsoft Innovations Club</div>
            <div className="brand-subtitle">Submission Review Portal</div>
          </div>
        </div>
        <div className="topbar-right">
          <span>Signed in as {reviewer}</span>
          <button
            className="link-btn"
            onClick={async () => {
              await api.logout();
              onLogout();
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="filters">
        <div className="status-tabs">
          {["PENDING", "ACCEPTED", "REJECTED", "ALL"].map((s) => (
            <button
              key={s}
              className={`tab ${statusFilter === s ? "tab--active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>

        <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
          <option value="ALL">All tracks</option>
          {tracks.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          className="search"
          placeholder="Search team, name, keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="link-btn" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="error banner">{error}</div>}
      {loading && <div className="loading">Loading submissions…</div>}

      {!loading && (
        <div className="grid">
          {filtered.length === 0 && <div className="empty">No submissions match.</div>}
          {filtered.map((record) => (
            <SubmissionCard key={record.rowNumber} record={record} onOpen={(r) => setSelectedRow(r.rowNumber)} />
          ))}
        </div>
      )}

      {selectedRecord && (
        <ReviewModal
          record={selectedRecord}
          onClose={() => setSelectedRow(null)}
          onDecide={handleDecide}
          saving={savingRow === selectedRecord.rowNumber}
          position={`${selectedIndex + 1} of ${filtered.length}`}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < filtered.length - 1}
          onPrev={() => setSelectedRow(filtered[selectedIndex - 1]?.rowNumber)}
          onNext={() => setSelectedRow(filtered[selectedIndex + 1]?.rowNumber)}
        />
      )}
    </div>
  );
}
