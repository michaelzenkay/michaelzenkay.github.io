/**
 * demo-client.js — MG Inference Demo
 * Handles exam selection, API calls, and risk visualization.
 */

const API_URL = "https://2tu79n9lw0.execute-api.us-east-1.amazonaws.com/predict";
const S3_BUCKET = "einsteinmg-review";

// Pre-staged CBIS-DDSM demo exams.
// The legacy cmmd-demo prefix stays in S3 so the API contract remains stable.
const DEMO_EXAMS = [
  {
    label: "CBIS-DDSM Patient 00092 - Malignant",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_1/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_1/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_1/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_1/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00160 - Malignant",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_2/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_2/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_2/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_2/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00418 - Malignant",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_3/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_3/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_3/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_3/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00419 - Malignant",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_4/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_4/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_4/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_4/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00432 - Malignant",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_5/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_5/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_5/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_5/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00008 - Benign",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_6/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_6/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_6/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_6/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00021 - Benign",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_7/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_7/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_7/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_7/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00030 - Benign",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_8/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_8/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_8/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_8/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00038 - Benign",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_9/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_9/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_9/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_9/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
  {
    label: "CBIS-DDSM Patient 00077 - Benign",
    images: [
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_10/lcc.dcm",  laterality: "LEFT",  view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_10/lmlo.dcm", laterality: "LEFT",  view: "MLO" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_10/rcc.dcm",  laterality: "RIGHT", view: "CC" },
      { s3_key: "cmmd-demo/cmmd_demo_exams/exam_10/rmlo.dcm", laterality: "RIGHT", view: "MLO" },
    ],
  },
];

// -- DOM refs (set after DOMContentLoaded) ------------------------------------
let examSelect, scoreBtn, statusEl, chartSection, errorEl;
let calcNoteEl;

document.addEventListener("DOMContentLoaded", () => {
  examSelect   = document.getElementById("exam-select");
  scoreBtn     = document.getElementById("score-btn");
  statusEl     = document.getElementById("status-msg");
  chartSection = document.getElementById("chart-section");
  errorEl      = document.getElementById("error-msg");
  calcNoteEl   = document.getElementById("calc-note");

  // Populate dropdown
  DEMO_EXAMS.forEach((exam, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = exam.label;
    examSelect.appendChild(opt);
  });

  scoreBtn.addEventListener("click", onScore);
});

async function onScore() {
  const idx = parseInt(examSelect.value, 10);
  const exam = DEMO_EXAMS[idx];

  setLoading(true);
  hideError();
  chartSection.style.display = "none";

  const payload = {
    s3_bucket: S3_BUCKET,
    images: exam.images,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    renderChart(data);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

function renderChart(data) {
  const years = [1, 2, 3, 4, 5];
  const bars = document.getElementById("risk-bars");
  bars.innerHTML = "";
  if (calcNoteEl) {
    calcNoteEl.textContent = `Calculated: ${formatCalculatedAt(new Date())}`;
  }

  years.forEach((yr) => {
    const key = `risk_${yr}yr`;
    const pct = data[key] !== undefined ? (data[key] * 100).toFixed(1) : null;

    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = `${yr}-Year`;

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = "bar-fill";

    const valueEl = document.createElement("span");
    valueEl.className = "bar-value";

    if (pct !== null) {
      const pctNum = parseFloat(pct);
      fill.style.width = `${Math.min(pctNum, 100)}%`;
      fill.style.backgroundColor = riskColor(pctNum);
      valueEl.textContent = `${pct}%`;
    } else {
      fill.style.width = "0%";
      valueEl.textContent = "-";
    }

    track.appendChild(fill);
    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(valueEl);
    bars.appendChild(row);
  });

  chartSection.style.display = "block";
}

function riskColor(pct) {
  // Green (<5%) -> Yellow (<15%) -> Red (>15%)
  if (pct < 5)  return "#27ae60";
  if (pct < 15) return "#f39c12";
  return "#e74c3c";
}

function setLoading(on) {
  scoreBtn.disabled = on;
  statusEl.textContent = on ? "Scoring exam..." : "";
  statusEl.style.display = on ? "block" : "none";
}

function showError(msg) {
  errorEl.textContent = `Error: ${msg}`;
  errorEl.style.display = "block";
}

function hideError() {
  errorEl.style.display = "none";
}

function formatCalculatedAt(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
