/**
 * ═══════════════════════════════════════════════════
 * RESUME OPTIMIZER — APP.JS
 * Core connectivity, pipeline animation, PDF export
 * ═══════════════════════════════════════════════════
 *
 * HOW TO CONFIGURE YOUR DIFY ENDPOINT:
 * 1. Replace DIFY_API_URL with your Dify workflow endpoint URL.
 * 2. Replace DIFY_API_KEY with your actual Dify API key.
 * 3. Adjust the payload structure under buildPayload() to match
 * the input variable names defined in your Dify workflow.
 *
 * The app expects Dify to return a JSON object whose
 * 'data.outputs.result' field contains an HTML string.
 * Adjust parseResult() if your output key differs.
 * ═══════════════════════════════════════════════════
 */

/* ─── CONFIGURATION ─────────────────────────────── */
const DIFY_API_URL = 'https://api.dify.ai/v1/workflows/run';
const DIFY_API_KEY = 'app-JVFbSppqUU1pAzwmKYL3SDRC';   

/* ─── DOM REFERENCES ────────────────────────────── */
const optimizeBtn        = document.getElementById('optimizeBtn');
const downloadPdfBtn     = document.getElementById('downloadPdfBtn');
const resetBtn           = document.getElementById('resetBtn');
const resumeFileInput    = document.getElementById('resumeFile');
const jobDescInput       = document.getElementById('jobDescription');
const resumePreview      = document.getElementById('resumePreview');
const resultsSection     = document.getElementById('resultsSection');
const loadingOverlay     = document.getElementById('loadingOverlay');
const loaderLabel        = document.getElementById('loaderLabel');
const fileSelectedBadge  = document.getElementById('fileSelectedBadge');
const fileSelectedName   = document.getElementById('fileSelectedName');
const charCount          = document.getElementById('charCount');
const dropZone           = document.getElementById('dropZone');
const scoreRingFill      = document.getElementById('scoreRingFill');
const scoreValue         = document.getElementById('scoreValue');

const pipelineSteps = [
  document.getElementById('step1'),
  document.getElementById('step2'),
  document.getElementById('step3'),
];

/* ─── STATE ─────────────────────────────────────── */
let selectedFile    = null;
let isProcessing    = false;
let optimizedHTML   = '';
let loaderInterval  = null;

/* ─── LOADING COPY ROTATION ─────────────────────── */
const loaderMessages = [
  'Parsing your resume…',
  'Extracting skills & experience…',
  'Running ATS keyword matrix…',
  'Scoring against job description…',
  'Compiling executive HTML output…',
  'Almost there — finalizing…',
];

/* ─── UTILITY: File size formatter ─────────────── */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── UTILITY: Truncate filename ────────────────── */
function truncateName(name, max = 32) {
  if (name.length <= max) return name;
  const ext  = name.lastIndexOf('.');
  const base = ext > 0 ? name.slice(0, ext) : name;
  const extn = ext > 0 ? name.slice(ext) : '';
  return base.slice(0, max - 4 - extn.length) + '…' + extn;
}

/* ─── UTILITY: Convert file to base64 ───────────── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/* ─── UTILITY: Show / hide elements ─────────────── */
function show(el) { el.hidden = false; }
function hide(el) { el.hidden = true; }

/* ─── UTILITY: Animate class helper ─────────────── */
function animateIn(el, animation = 'animate__fadeInUp') {
  el.classList.remove('animate__animated', animation);
  void el.offsetWidth; // reflow trick to restart animation
  el.classList.add('animate__animated', animation);
}

/* ═══════════════════════════════════════════════════
    FILE INPUT HANDLING
    ═══════════════════════════════════════════════════ */
resumeFileInput.addEventListener('change', () => {
  const file = resumeFileInput.files[0];
  if (file) handleFileSelected(file);
});

function handleFileSelected(file) {
  selectedFile = file;
  const label = `${truncateName(file.name)} · ${formatBytes(file.size)}`;
  fileSelectedName.textContent = label;
  show(fileSelectedBadge);
  animateIn(fileSelectedBadge, 'animate__fadeIn');
}

/* ─── Drag & Drop ─── */
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) {
    resumeFileInput.files = e.dataTransfer.files;
    handleFileSelected(file);
  }
});

/* ═══════════════════════════════════════════════════
    CHARACTER COUNTER
    ═══════════════════════════════════════════════════ */
jobDescInput.addEventListener('input', () => {
  charCount.textContent = jobDescInput.value.length.toLocaleString();
});

/* ═══════════════════════════════════════════════════
    PIPELINE STEP ANIMATIONS
    ═══════════════════════════════════════════════════ */
function setPipelineState(stepIndex, state) {
  // state: 'idle' | 'active' | 'done'
  const step = pipelineSteps[stepIndex];
  if (!step) return;
  step.classList.remove('active', 'done');
  if (state === 'active') step.classList.add('active');
  if (state === 'done')   step.classList.add('done');
}

function resetPipeline() {
  pipelineSteps.forEach(s => s.classList.remove('active', 'done'));
}

async function runPipelineAnimation() {
  // Step 1
  setPipelineState(0, 'active');
  await delay(1400);
  setPipelineState(0, 'done');

  // Step 2
  setPipelineState(1, 'active');
  await delay(1600);
  setPipelineState(1, 'done');

  // Step 3
  setPipelineState(2, 'active');
  // stays active until done by caller
}

function finishPipelineAnimation() {
  setPipelineState(2, 'done');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ═══════════════════════════════════════════════════
    LOADER LABEL ROTATION
    ═══════════════════════════════════════════════════ */
function startLoaderRotation() {
  let idx = 0;
  loaderLabel.textContent = loaderMessages[idx];
  loaderInterval = setInterval(() => {
    idx = (idx + 1) % loaderMessages.length;
    loaderLabel.style.opacity = '0';
    setTimeout(() => {
      loaderLabel.textContent = loaderMessages[idx];
      loaderLabel.style.opacity = '1';
    }, 220);
  }, 1800);
}

function stopLoaderRotation() {
  clearInterval(loaderInterval);
  loaderInterval = null;
}

/* ═══════════════════════════════════════════════════
    INPUT VALIDATION
    ═══════════════════════════════════════════════════ */
function validate() {
  const errors = [];

  if (!selectedFile) {
    errors.push('Please upload your resume file.');
  }

  const jd = jobDescInput.value.trim();
  if (!jd || jd.length < 50) {
    errors.push('Please paste a job description (at least 50 characters).');
  }

  return errors;
}

function showValidationError(messages) {
  // Remove any existing error toast
  const existing = document.getElementById('errorToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'errorToast';
  toast.className = 'animate__animated animate__fadeInDown';
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.4);
    color: #fca5a5;
    padding: 14px 22px;
    border-radius: 12px;
    font-size: 0.87rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    z-index: 9999;
    backdrop-filter: blur(12px);
    max-width: 420px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  `;
  toast.textContent = messages.join(' · ');
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.replace('animate__fadeInDown', 'animate__fadeOutUp');
    setTimeout(() => toast.remove(), 500);
  }, 3600);
}

/* ═══════════════════════════════════════════════════
    BUILD DIFY API PAYLOAD
    Adjust input keys to match your Dify workflow vars
    ═══════════════════════════════════════════════════ */
async function buildPayload(base64File, fileName, jobDescription) {
  return {
    inputs: {
      uploaded_resume: {
        transfer_method: 'direct_transfer',
        upload_file_id: null, 
        data: base64File,
        filename: fileName,
        type: 'document',
      },
      job_description: jobDescription,
    },
    response_mode: 'blocking',
    user: 'resume-optimizer-web',
  };
}
/* ═══════════════════════════════════════════════════
    PARSE DIFY RESPONSE
    Adjust this function if your Dify output key differs
    ═══════════════════════════════════════════════════ */
function parseResult(data) {
  // Try standard Dify workflow output path
  const output =
    data?.data?.outputs?.result ||
    data?.data?.outputs?.html   ||
    data?.data?.outputs?.optimized_resume ||
    data?.outputs?.result       ||
    null;

  if (!output) {
    throw new Error(
      'Could not find HTML output in Dify response. ' +
      'Check your workflow output key and parseResult() in app.js.'
    );
  }
  return output;
}

/* ═══════════════════════════════════════════════════
    SCORE ANIMATION
    Animates the ATS ring based on estimated match %
    ═══════════════════════════════════════════════════ */
function animateScore(scorePercent) {
  const circumference = 2 * Math.PI * 40; // r=40
  const offset = circumference - (scorePercent / 100) * circumference;
  scoreRingFill.style.strokeDashoffset = offset;
  scoreValue.textContent = `${scorePercent}%`;

  // Color based on score
  if (scorePercent >= 80) {
    scoreRingFill.style.stroke = '#10b981'; // green
  } else if (scorePercent >= 60) {
    scoreRingFill.style.stroke = '#f59e0b'; // amber
  } else {
    scoreRingFill.style.stroke = '#3b82f6'; // blue
  }
}

/* ─── Estimate ATS score from HTML length & keywords ── */
function estimateAtsScore(html, jd) {
  // Rough heuristic: count how many JD words appear in the HTML
  const jdWords = [...new Set(
    jd.toLowerCase().match(/\b[a-z][a-z\-]{3,}\b/g) || []
  )].filter(w => !commonWords.has(w));

  if (jdWords.length === 0) return 72;

  const htmlLower = html.toLowerCase();
  const matched   = jdWords.filter(w => htmlLower.includes(w)).length;
  const raw       = Math.round((matched / jdWords.length) * 100);

  // Clamp to a realistic range
  return Math.min(98, Math.max(55, raw));
}

const commonWords = new Set([
  'the','and','for','with','that','have','this','from','they',
  'will','been','what','when','your','which','their','about',
  'would','there','could','other','into','more','also','some',
]);

/* ═══════════════════════════════════════════════════
    MAIN: OPTIMIZE BUTTON HANDLER
    ═══════════════════════════════════════════════════ */
optimizeBtn.addEventListener('click', async () => {
  if (isProcessing) return;

  /* Validate */
  const errors = validate();
  if (errors.length) {
    showValidationError(errors);
    return;
  }

  isProcessing = true;
  optimizeBtn.disabled = true;

  /* UI: show loader */
  show(loadingOverlay);
  startLoaderRotation();

  /* UI: hide previous results */
  hide(resultsSection);
  resetPipeline();

  /* Run pipeline animation (parallel to API call) */
  const pipelinePromise = runPipelineAnimation();

  try {
    /* Convert file to base64 */
    const base64 = await fileToBase64(selectedFile);

    /* Build payload */
    const payload = await buildPayload(
      base64,
      selectedFile.name,
      jobDescInput.value.trim()
    );

    /* Call Dify API */
    const response = await fetch(DIFY_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${DIFY_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => 'No body');
      throw new Error(`Dify API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    optimizedHTML = parseResult(data);

    /* Finish pipeline */
    await pipelinePromise;
    finishPipelineAnimation();

    /* Inject HTML into preview */
    resumePreview.innerHTML = optimizedHTML;

    /* Estimate & animate ATS score */
    const score = estimateAtsScore(optimizedHTML, jobDescInput.value);
    setTimeout(() => animateScore(score), 400);

    /* Show results */
    show(resultsSection);
    animateIn(resultsSection, 'animate__fadeInUp');

    /* Scroll into view */
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

  } catch (err) {
    console.error('[ResumeOptimizer] Error:', err);
    resetPipeline();
    showValidationError([
      `Something went wrong: ${err.message || 'Unknown error.'}`,
      'Check your API key, endpoint, and network, then try again.',
    ]);
  } finally {
    isProcessing = false;
    optimizeBtn.disabled = false;
    stopLoaderRotation();
    hide(loadingOverlay);
  }
});

/* ═══════════════════════════════════════════════════
    DOWNLOAD PDF — PRINT WINDOW METHOD
    Uses the @media print CSS to render a clean document
    ═══════════════════════════════════════════════════ */
downloadPdfBtn.addEventListener('click', () => {
  if (!optimizedHTML) return;

  /*
   * Strategy: open a fresh window containing ONLY the resume HTML,
   * link in the same styles.css (which has the @media print block),
   * then trigger window.print() so the browser save-as-PDF dialog
   * delivers a pixel-perfect, white-background document.
   */
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    alert('Please allow pop-ups for this site to enable PDF download.');
    return;
  }

  // Resolve the stylesheet path relative to the current page
  const stylesheetHref = (
    document.querySelector('link[href*="styles.css"]')?.href ||
    window.location.origin + '/styles.css'
  );

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Optimized Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${stylesheetHref}" />
  <style>
    /* Force white background; hide everything except resume content */
    body {
      background: #fff !important;
      color: #111 !important;
      margin: 0;
      padding: 0;
    }
    #resumePreview {
      max-height: none !important;
      overflow: visible !important;
      padding: 0 !important;
    }
  </style>
</head>
<body>
  <div id="resumePreview" class="resume-preview-body">
    ${optimizedHTML}
  </div>
  <script>
    // Auto-print once fonts are loaded
    document.fonts.ready.then(() => {
      setTimeout(() => {
        window.print();
        // Give the dialog time to open before closing the window
        setTimeout(() => window.close(), 1000);
      }, 300);
    });
  <\/script>
</body>
</html>
  `);

  printWindow.document.close();
});

/* ═══════════════════════════════════════════════════
    RESET BUTTON
    ═══════════════════════════════════════════════════ */
resetBtn.addEventListener('click', () => {
  // Clear state
  selectedFile  = null;
  optimizedHTML = '';

  // Reset form
  resumeFileInput.value = '';
  jobDescInput.value    = '';
  charCount.textContent = '0';
  hide(fileSelectedBadge);

  // Reset pipeline
  resetPipeline();

  // Reset score ring
  scoreRingFill.style.strokeDashoffset = '251.2';
  scoreRingFill.style.stroke = '#3b82f6';
  scoreValue.textContent = '—';

  // Hide results
  hide(resultsSection);
  resumePreview.innerHTML = '';

  // Scroll back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ═══════════════════════════════════════════════════
    KEYBOARD SHORTCUT: Ctrl/Cmd + Enter → Optimize
    ═══════════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    optimizeBtn.click();
  }
});

/* ═══════════════════════════════════════════════════
    INIT: Subtle entrance for the optimize button
    ═══════════════════════════════════════════════════ */
(function init() {
  // Prefill hint for demo / dev
  if (window.location.search.includes('demo')) {
    jobDescInput.value = [
      'We are looking for a Senior Software Engineer with 5+ years of experience',
      'in React, Node.js, and AWS. You will architect scalable microservices,',
      'collaborate with cross-functional teams, and drive engineering excellence.',
      'Strong communication skills, TypeScript expertise, and CI/CD experience required.',
    ].join(' ');
    charCount.textContent = jobDescInput.value.length.toLocaleString();
  }
})();
