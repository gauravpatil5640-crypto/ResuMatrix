/**
 * ═══════════════════════════════════════════════════
 * RESUME OPTIMIZER — APP.JS (VERIFIED PRODUCTION FIX)
 * ═══════════════════════════════════════════════════
 */

/* ─── CONFIGURATION ─────────────────────────────── */
const DIFY_API_URL = 'https://api.dify.ai/v1/workflows/run';
// ⚠️ SABSE ZARURI: Niche wale single quotes ke andar apni Dify se copy ki hui asli API key paste kijiye
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

/* ─── UTILITY FUNCTIONS ─────────────────────────── */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateName(name, max = 32) {
  if (name.length <= max) return name;
  const ext  = name.lastIndexOf('.');
  const base = ext > 0 ? name.slice(0, ext) : name;
  const extn = ext > 0 ? name.slice(ext) : '';
  return base.slice(0, max - 4 - extn.length) + '…' + extn;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function show(el) { el.hidden = false; }
function hide(el) { el.hidden = true; }

function animateIn(el, animation = 'animate__fadeInUp') {
  el.classList.remove('animate__animated', animation);
  void el.offsetWidth; 
  el.classList.add('animate__animated', animation);
}

/* ─── EVENT LISTENERS ───────────────────────────── */
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

jobDescInput.addEventListener('input', () => {
  charCount.textContent = jobDescInput.value.length.toLocaleString();
});

/* ─── PIPELINE AND ANIMATIONS ───────────────────── */
function setPipelineState(stepIndex, state) {
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
  setPipelineState(0, 'active');
  await delay(1400);
  setPipelineState(0, 'done');

  setPipelineState(1, 'active');
  await delay(1600);
  setPipelineState(1, 'done');

  setPipelineState(2, 'active');
}

function finishPipelineAnimation() {
  setPipelineState(2, 'done');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function validate() {
  const errors = [];
  if (!selectedFile) errors.push('Please upload your resume file.');
  const jd = jobDescInput.value.trim();
  if (!jd || jd.length < 50) errors.push('Please paste a job description (at least 50 characters).');
  return errors;
}

function showValidationError(messages) {
  const existing = document.getElementById('errorToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'errorToast';
  toast.className = 'animate__animated animate__fadeInDown';
  toast.style.cssText = `
    position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
    background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.4);
    color: #fca5a5; padding: 14px 22px; border-radius: 12px; font-size: 0.87rem;
    font-family: 'DM Sans', sans-serif; font-weight: 500; z-index: 9999;
    backdrop-filter: blur(12px); max-width: 420px; text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  `;
  toast.textContent = messages.join(' · ');
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.replace('animate__fadeInDown', 'animate__fadeOutUp');
    setTimeout(() => toast.remove(), 500);
  }, 3600);
}

/* ─── CORE OPTIMIZE ENGINE ──────────────────────── */
optimizeBtn.addEventListener('click', async () => {
  if (isProcessing) return;

  const errors = validate();
  if (errors.length) {
    showValidationError(errors);
    return;
  }

  isProcessing = true;
  optimizeBtn.disabled = true;

  show(loadingOverlay);
  startLoaderRotation();
  hide(resultsSection);
  resetPipeline();

  const pipelinePromise = runPipelineAnimation();

  try {
    const base64 = await fileToBase64(selectedFile);
    
    const payload = {
      inputs: {
        uploaded_resume: {
          transfer_method: 'local_file',
          upload_file_id: null,
          data: base64,
          filename: selectedFile.name,
          type: 'document'
        },
        job_description: jobDescInput.value.trim()
      },
      response_mode: 'blocking',
      user: 'resume-optimizer-web'
    };

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
    
    optimizedHTML = 
      data?.data?.outputs?.result ||
      data?.data?.outputs?.html ||
      data?.data?.outputs?.optimized_resume ||
      data?.outputs?.result ||
      data?.answer || 
      null;

    if (!optimizedHTML) {
      throw new Error('Could not find HTML output in Dify response structure.');
    }

    await pipelinePromise;
    finishPipelineAnimation();

    resumePreview.innerHTML = optimizedHTML;

    const score = estimateAtsScore(optimizedHTML, jobDescInput.value);
    setTimeout(() => animateScore(score), 400);

    show(resultsSection);
    animateIn(resultsSection, 'animate__fadeInUp');

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

/* ─── ATS SCORE SYSTEM ──────────────────────────── */
function animateScore(scorePercent) {
  const circumference = 2 * Math.PI * 40; 
  const offset = circumference - (scorePercent / 100) * circumference;
  scoreRingFill.style.strokeDashoffset = offset;
  scoreValue.textContent = `${scorePercent}%`;

  if (scorePercent >= 80) scoreRingFill.style.stroke = '#10b981'; 
  else if (scorePercent >= 60) scoreRingFill.style.stroke = '#f59e0b'; 
  else scoreRingFill.style.stroke = '#3b82f6'; 
}

function estimateAtsScore(html, jd) {
  const jdWords = [...new Set(
    jd.toLowerCase().match(/\b[a-z][a-z\-]{3,}\b/g) || []
  )].filter(w => !commonWords.has(w));

  if (jdWords.length === 0) return 72;
  const htmlLower = html.toLowerCase();
  const matched   = jdWords.filter(w => htmlLower.includes(w)).length;
  return Math.min(98, Math.max(55, Math.round((matched / jdWords.length) * 100)));
}

const commonWords = new Set([
  'the','and','for','with','that','have','this','from','they',
  'will','been','what','when','your','which','their','about'
]);

/* ─── EXPORT AND RESET ──────────────────────────── */
downloadPdfBtn.addEventListener('click', () => {
  if (!optimizedHTML) return;
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow pop-ups for this site to enable PDF download.');
    return;
  }
  const stylesheetHref = document.querySelector('link[href*="styles.css"]')?.href || window.location.origin + '/styles.css';
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Optimized Resume</title>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="${stylesheetHref}" />
      <style>body { background: #fff !important; color: #111 !important; margin: 0; padding: 0; } #resumePreview { max-height: none !important; overflow: visible !important; padding: 0 !important; }</style>
    </head>
    <body><div id="resumePreview" class="resume-preview-body">\${optimizedHTML}</div><script>document.fonts.ready.then(() => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 1000); }, 300); });<\/script></body>
    </html>
  `);
  printWindow.document.close();
});

resetBtn.addEventListener('click', () => {
  selectedFile  = null; optimizedHTML = ''; resumeFileInput.value = ''; jobDescInput.value = ''; charCount.textContent = '0';
  hide(fileSelectedBadge); resetPipeline(); scoreRingFill.style.strokeDashoffset = '251.2'; scoreValue.textContent = '—';
  hide(resultsSection); resumePreview.innerHTML = ''; window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); optimizeBtn.click(); }
});
