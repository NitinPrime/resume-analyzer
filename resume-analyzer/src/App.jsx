import { useState, useRef } from "react";
import "./App.css";

export default function App() {
  const [pdfBase64, setPdfBase64] = useState(null);
  const [filename, setFilename] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  const ready = pdfBase64 && jd.trim().length > 20;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setPdfBase64(ev.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const scoreClass = (n) => (n >= 75 ? "good" : n >= 50 ? "mid" : "low");

  const analyze = async () => {
    setError("");
    setResults(null);
    setLoading(true);
    const steps = ["Reading your resume...","Scanning for keywords...","Scoring ATS compatibility...","Generating feedback..."];
    let i = 0;
    setLoadingMsg(steps[0]);
    const interval = setInterval(() => { i = (i + 1) % steps.length; setLoadingMsg(steps[i]); }, 2000);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: `You are an expert ATS resume analyzer. Return ONLY valid JSON (no markdown, no backticks):
{"ats_score":<0-100>,"keyword_match":<0-100>,"overall":<0-100>,"summary":"<2-3 sentences>","keywords_present":[],"keywords_missing":[],"section_feedback":{"experience":"...","skills":"...","education":"...","summary":"..."},"top_improvements":["...","...","...","...","..."]}`,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
              { type: "text", text: `Job Description:\n\n${jd.trim()}\n\nAnalyze and return JSON only.` }
            ]
          }]
        })
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.error?.message || "API error");
      const raw = data.content.map(b => b.type === "text" ? b.text : "").join("").replace(/```json|```/g,"").trim();
      setResults(JSON.parse(raw));
    } catch (err) {
      clearInterval(interval);
      setError("Something went wrong: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="root">
      <header className="header">
        <h1>Resume Analyzer</h1>
        <span className="tag">AI-powered</span>
      </header>

      <div className="grid">
        <div className="card">
          <p className="card-label">Resume PDF</p>
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} style={{display:"none"}} />
            <div className="upload-icon">📄</div>
            <p className="upload-text">{filename || "Click to browse PDF"}</p>
          </div>
        </div>
        <div className="card">
          <p className="card-label">Job description</p>
          <textarea className="textarea" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the full job description here..." />
        </div>
      </div>

      <button className="analyze-btn" disabled={!ready || loading} onClick={analyze}>
        {loading ? loadingMsg : "Analyze resume"}
      </button>

      {error && <div className="error">{error}</div>}

      {results && (
        <div className="results">
          <div className="score-row">
            {[{label:"ATS Score",value:results.ats_score,suffix:"/100"},{label:"Keyword Match",value:results.keyword_match,suffix:"%"},{label:"Overall Fit",value:results.overall,suffix:"/100"}].map(({label,value,suffix}) => (
              <div className="score-card" key={label}>
                <p className="score-label">{label}</p>
                <p className={`score-num ${scoreClass(value)}`}>{value}<span className="score-suffix">{suffix}</span></p>
              </div>
            ))}
          </div>
          {results.summary && <div className="section"><p className="section-title">Summary</p><p className="prose">{results.summary}</p></div>}
          {results.keywords_present?.length > 0 && <div className="section"><p className="section-title">Keywords found</p><div className="chips">{results.keywords_present.map(k=><span className="chip present" key={k}>{k}</span>)}</div></div>}
          {results.keywords_missing?.length > 0 && <div className="section"><p className="section-title">Missing keywords</p><div className="chips">{results.keywords_missing.map(k=><span className="chip missing" key={k}>{k}</span>)}</div></div>}
          {results.section_feedback && <div className="section"><p className="section-title">Section feedback</p>{Object.entries(results.section_feedback).map(([sec,fb])=><div key={sec} style={{marginBottom:"14px"}}><p className="sec-name">{sec}</p><p className="prose">{fb}</p></div>)}</div>}
          {results.top_improvements?.length > 0 && <div className="section"><p className="section-title">Top improvements</p>{results.top_improvements.map((t,i)=><div className="improvement" key={i}><span className="imp-num">{i+1}.</span><p className="prose">{t}</p></div>)}</div>}
        </div>
      )}
    </div>
  );
}
