import { useEffect } from "react";
import {
  getTeamName,
  getLeaderName,
  getTrack,
  getDecision,
  getShortFields,
  getLongFields,
} from "../lib/fields.js";

export default function ReviewModal({
  record,
  onClose,
  onDecide,
  saving,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  position,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext) onNext();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!record) return null;

  const decision = getDecision(record);
  const shortFields = getShortFields(record);
  const longFields = getLongFields(record);
  const reviewedBy = record["Reviewed By"];
  const reviewedAt = record["Reviewed At"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{getTeamName(record)}</h2>
            <div className="card-meta">
              {getLeaderName(record) && <span>{getLeaderName(record)}</span>}
              {getTrack(record) && <span className="tag">{getTrack(record)}</span>}
            </div>
          </div>
          <div className="modal-header-right">
            {position && <span className="modal-position">{position}</span>}
            <span className={`status-badge status-badge--${decision.toLowerCase()}`}>{decision}</span>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {shortFields.length > 0 && (
            <div className="info-grid">
              {shortFields.map(([label, value]) => (
                <div className="info-item" key={label}>
                  <div className="field-label">{label}</div>
                  <div className="field-value">{value || "—"}</div>
                </div>
              ))}
            </div>
          )}

          {longFields.map(([label, value]) => (
            <div className="detail-block" key={label}>
              <div className="field-label">{label}</div>
              <div className="detail-text">{value || "—"}</div>
            </div>
          ))}

          {decision !== "PENDING" && reviewedBy && (
            <div className="reviewed-note">
              Marked {decision.toLowerCase()} by {reviewedBy}
              {reviewedAt && ` on ${new Date(reviewedAt).toLocaleString()}`}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn--accept"
            disabled={saving || decision === "ACCEPTED"}
            onClick={() => onDecide(record.rowNumber, "ACCEPTED")}
          >
            Accept
          </button>
          <button
            className="btn btn--reject"
            disabled={saving || decision === "REJECTED"}
            onClick={() => onDecide(record.rowNumber, "REJECTED")}
          >
            Reject
          </button>
          {decision !== "PENDING" && (
            <button
              className="btn btn--reset"
              disabled={saving}
              onClick={() => onDecide(record.rowNumber, "PENDING")}
            >
              Reset
            </button>
          )}
          <div className="modal-nav">
            <button className="btn btn--nav" disabled={!hasPrev} onClick={onPrev}>
              ← Prev
            </button>
            <button className="btn btn--nav" disabled={!hasNext} onClick={onNext}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
