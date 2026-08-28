import { getTeamName, getLeaderName, getTrack, getDecision, getPreviewText } from "../lib/fields.js";

export default function SubmissionCard({ record, onOpen }) {
  const decision = getDecision(record);

  return (
    <button className={`card card--${decision.toLowerCase()}`} onClick={() => onOpen(record)}>
      <div className="card-header">
        <div>
          <h3>{getTeamName(record)}</h3>
          <div className="card-meta">
            {getLeaderName(record) && <span>{getLeaderName(record)}</span>}
            {getTrack(record) && <span className="tag">{getTrack(record)}</span>}
          </div>
        </div>
        <span className={`status-badge status-badge--${decision.toLowerCase()}`}>{decision}</span>
      </div>

      {getPreviewText(record) && <p className="card-preview">{getPreviewText(record)}</p>}

      <span className="review-cta">Review idea →</span>
    </button>
  );
}
