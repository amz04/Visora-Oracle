const params = new URLSearchParams(window.location.search);
const machineId = parseInt(params.get('id')) || 1;
const focusChat = params.get('focus') === 'chat';
const machine = getMachineById(machineId);

if (!machine) {
  document.querySelector('.breadcrumb-current').textContent = 'Not Found';
}

// ── Init page ──
function initPage() {
  document.title = `Visora — ${machine.name}`;
  document.getElementById('breadcrumbMachine').textContent = machine.name;
  document.getElementById('chatMachineName').textContent = machine.name;

  applyStatusUI(getEffectiveStatus(machineId));
  setupStatusDropdown();

  renderLog();
  renderWorkOrders();
  renderVideos();
  renderChat();

  if (focusChat) {
    setTimeout(() => document.getElementById('chatInput').focus(), 300);
  }

  lucide.createIcons();
}

function applyStatusUI(status) {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  document.getElementById('chatStatusText').textContent = statusLabel;
  const statusEl = document.getElementById('chatMachineStatus');
  statusEl.style.color = statusColor;
  const dot = statusEl.querySelector('.dot');
  dot.style.background = statusColor;
  dot.style.animation = status === 'operational' ? '' : 'none';
}

// ── Status dropdown ──
const STATUS_OPTIONS = [
  { value: 'operational',    label: 'Operational',       color: '#22C55E' },
  { value: 'maintenance',    label: 'Under Maintenance',  color: '#F59E0B' },
  { value: 'out-of-service', label: 'Out of Service',     color: '#EF4444' },
];

function setupStatusDropdown() {
  const trigger = document.getElementById('chatMachineStatus');
  trigger.classList.add('status-trigger');

  const chevron = document.createElement('i');
  chevron.setAttribute('data-lucide', 'chevron-down');
  chevron.setAttribute('style', 'width:11px;height:11px;');
  chevron.className = 'status-trigger-chevron';
  trigger.appendChild(chevron);

  const dropdown = document.createElement('div');
  dropdown.className = 'status-dropdown';
  dropdown.innerHTML = STATUS_OPTIONS.map(o => `
    <button class="status-option" data-value="${o.value}">
      <span class="status-option-dot" style="background:${o.color};"></span>
      ${o.label}
    </button>
  `).join('');

  trigger.appendChild(dropdown);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  dropdown.querySelectorAll('.status-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newStatus = btn.dataset.value;
      setMachineStatus(machineId, newStatus);
      applyStatusUI(newStatus);
      dropdown.classList.remove('open');
    });
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));
}

// ── Left Panel Collapse ──
let panelCollapsed = false;
const collapseBtn = document.getElementById('collapseBtn');
const panelLeft = document.getElementById('panelLeft');
const collapseIcon = document.getElementById('collapseIcon');

collapseBtn.addEventListener('click', () => {
  panelCollapsed = !panelCollapsed;
  panelLeft.classList.toggle('collapsed', panelCollapsed);
  collapseIcon.setAttribute('data-lucide', panelCollapsed ? 'chevron-right' : 'chevron-left');
  lucide.createIcons();
});

// ── Maintenance Log ──
function renderLog() {
  const container = document.getElementById('logScroll');
  if (!machine.sessions || machine.sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="clipboard-x" style="width:36px;height:36px;"></i></div>
        <p>No maintenance sessions recorded yet</p>
      </div>`;
    return;
  }

  const byMonth = {};
  machine.sessions.forEach(s => {
    if (!byMonth[s.month]) byMonth[s.month] = [];
    byMonth[s.month].push(s);
  });

  let html = '';
  Object.entries(byMonth).forEach(([month, sessions]) => {
    html += `<div class="log-month-label">${month}</div>`;
    sessions.forEach(s => {
      html += `
        <div class="session-card" data-session-id="${s.id}" onclick="openSessionOverlay('${s.id}')">
          <div class="session-dot ${s.severity}"></div>
          <div class="session-card-info">
            <div class="session-card-title">${s.title}</div>
            <div class="session-card-meta">${s.dateShort} · ${s.technician}</div>
          </div>
        </div>`;
    });
  });

  container.innerHTML = html;
}

// ── Inspection Log Modal ──
let _woFromModal = false;

function renderWorkOrders() {
  document.getElementById('viewInspectionLogBtn').addEventListener('click', openInspectionLogModal);
}

function openInspectionLogModal() {
  const year = (machine.lastServiced || '').split(', ')[1] || '—';
  const machineIdLabel = `MID-${String(machine.id).padStart(4, '0')}`;

  document.getElementById('inspEquipmentGrid').innerHTML = `
    <div class="insp-equip-field">
      <div class="insp-equip-label">Equipment</div>
      <div class="insp-equip-value">${machine.name}</div>
    </div>
    <div class="insp-equip-field">
      <div class="insp-equip-label">Machine ID</div>
      <div class="insp-equip-value mono">${machineIdLabel}</div>
    </div>
    <div class="insp-equip-field">
      <div class="insp-equip-label">Location</div>
      <div class="insp-equip-value">${machine.location || '—'}</div>
    </div>
    <div class="insp-equip-field">
      <div class="insp-equip-label">Department</div>
      <div class="insp-equip-value">${machine.department}</div>
    </div>
    <div class="insp-equip-field">
      <div class="insp-equip-label">Year</div>
      <div class="insp-equip-value mono">${year}</div>
    </div>
  `;

  const orders = machine.workOrders || [];
  if (orders.length === 0) {
    document.getElementById('inspTableWrap').innerHTML = `
      <div class="insp-empty">
        <i data-lucide="clipboard-x" style="width:28px;height:28px;"></i>
        No work orders available
      </div>`;
  } else {
    let html = `
      <div class="insp-wo-header">
        <span class="insp-col-label">WO #</span>
        <span class="insp-col-label">Date</span>
        <span class="insp-col-label">Type</span>
        <span class="insp-col-label">Technician</span>
        <span class="insp-col-label">Time Taken</span>
        <span class="insp-col-label">Status</span>
      </div>`;
    orders.forEach(wo => {
      const timeTaken = wo.actualDowntime || wo.estimatedDowntime || '—';
      const statusClass = wo.status.toLowerCase();
      html += `
        <div class="insp-wo-row" onclick="openWorkOrderOverlay('${wo.id}', true)">
          <span class="insp-wo-num">${wo.id.replace('WO-2025-', '#')}</span>
          <span class="insp-wo-cell">${wo.dateShort}</span>
          <span class="insp-wo-cell">${wo.type}</span>
          <span class="insp-wo-cell">${wo.technician}</span>
          <span class="insp-wo-cell">${timeTaken}</span>
          <span class="wo-badge ${statusClass}">${wo.status}</span>
        </div>`;
    });
    document.getElementById('inspTableWrap').innerHTML = html;
  }

  document.getElementById('inspectionLogModal').classList.add('open');
  lucide.createIcons();
}

function closeInspectionLogModal() {
  document.getElementById('inspectionLogModal').classList.remove('open');
}

document.getElementById('inspModalClose').addEventListener('click', closeInspectionLogModal);
document.getElementById('inspectionLogModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('inspectionLogModal')) closeInspectionLogModal();
});

// ── Work Order Detail Overlay ──
function openWorkOrderOverlay(woId, fromModal = false) {
  _woFromModal = fromModal;
  if (fromModal) closeInspectionLogModal();
  const wo = (machine.workOrders || []).find(w => w.id === woId);
  if (!wo) return;

  const statusClass = wo.status.toLowerCase();
  const partsHtml = wo.parts.length > 0
    ? wo.parts.map(p => `<span class="pill-tag">${p}</span>`).join('')
    : '<span style="color:var(--text-muted);font-size:13px;">None</span>';

  document.getElementById('woOverlayBody').innerHTML = `
    <div style="position:relative;">
      <div class="wo-form-number">${wo.id}</div>
      <div class="wo-overlay-title">${wo.type} Work Order</div>
      <div class="session-overlay-subtitle">${wo.date} · ${wo.department}</div>
      <div class="wo-status-stamp ${statusClass}">${wo.status}</div>
    </div>

    <div class="session-overlay-divider"></div>

    <div class="wo-form-grid">
      <div class="wo-form-field">
        <div class="wo-form-label">Machine</div>
        <div class="wo-form-value">${wo.machine}</div>
      </div>
      <div class="wo-form-field">
        <div class="wo-form-label">Priority</div>
        <div class="wo-form-value">${wo.priority}</div>
      </div>
      <div class="wo-form-field">
        <div class="wo-form-label">Type</div>
        <div class="wo-form-value">${wo.type}</div>
      </div>
      <div class="wo-form-field">
        <div class="wo-form-label">Assigned Technician</div>
        <div class="wo-form-value">${wo.technician}</div>
      </div>
      <div class="wo-form-field">
        <div class="wo-form-label">Estimated Downtime</div>
        <div class="wo-form-value">${wo.estimatedDowntime}</div>
      </div>
      <div class="wo-form-field">
        <div class="wo-form-label">Actual Downtime</div>
        <div class="wo-form-value">${wo.actualDowntime}</div>
      </div>
      <div class="wo-form-field full">
        <div class="wo-form-label">Description</div>
        <div class="wo-form-value">${wo.description}</div>
      </div>
      <div class="wo-form-field full">
        <div class="wo-form-label">Corrective Action Taken</div>
        <div class="wo-form-value">${wo.correctiveAction}</div>
      </div>
      <div class="wo-form-field full">
        <div class="wo-form-label">Parts Used</div>
        <div class="pill-tags">${partsHtml}</div>
      </div>
    </div>

    <div class="wo-sig-section">
      <div style="flex:1;">
        <div class="wo-sig-line">${wo.technician}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);">Technician Signature</div>
      </div>
      <div style="flex:1;">
        <div class="wo-sig-line">${wo.status === 'Closed' ? wo.date : '—'}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);">Date Completed</div>
      </div>
    </div>
  `;

  document.getElementById('workOrderOverlay').classList.add('open');
  lucide.createIcons();
}

function closeWorkOrderOverlay() {
  document.getElementById('workOrderOverlay').classList.remove('open');
  if (_woFromModal) {
    _woFromModal = false;
    openInspectionLogModal();
  }
}

document.getElementById('woOverlayBack').addEventListener('click', closeWorkOrderOverlay);
document.getElementById('woOverlayClose').addEventListener('click', closeWorkOrderOverlay);
document.getElementById('workOrderOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('workOrderOverlay')) closeWorkOrderOverlay();
});

// ── Videos Panel ──
function renderVideos() {
  const container = document.getElementById('videoScroll');
  if (!machine.videos || machine.videos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i data-lucide="video-off" style="width:36px;height:36px;"></i></div>
        <p>No recordings available for this machine yet</p>
      </div>`;
    return;
  }

  const byMonth = {};
  machine.videos.forEach(v => {
    if (!byMonth[v.month]) byMonth[v.month] = [];
    byMonth[v.month].push(v);
  });

  let html = '';
  Object.entries(byMonth).forEach(([month, videos]) => {
    html += `<div class="video-month-label">${month}</div>`;
    videos.forEach(v => {
      const thumbHtml = `<img src="${v.thumb}" alt="${v.title}" onerror="this.parentElement.innerHTML='<div class=video-thumb-placeholder><i data-lucide=film style=width:32px;height:32px;opacity:0.3></i></div>'">`;
      html += `
        <div class="video-card" onclick="openVideoOverlay('${v.id}')">
          <div class="video-thumb">
            ${thumbHtml}
            <div class="video-thumb-overlay"></div>
            <div class="play-icon">
              <i data-lucide="play" style="width:16px;height:16px;margin-left:2px;"></i>
            </div>
            <div class="video-badge">
              <span class="badge badge-${v.severity}">${getSeverityLabel(v.severity)}</span>
            </div>
            <div class="video-duration">${v.duration}</div>
          </div>
          <div class="video-card-body">
            <div class="video-card-title">${v.title}</div>
            <div class="video-card-meta">${v.technician} · ${v.dateShort} · ${v.duration}</div>
          </div>
        </div>`;
    });
  });

  container.innerHTML = html;
  lucide.createIcons();
}

// ── Chat ──
let chatMessages = [];
let isTyping = false;

function renderChat() {
  const chatArea = document.getElementById('chatArea');

  if (machine.chat && machine.chat.length > 0) {
    chatMessages = [...machine.chat];
    renderChatMessages();
  } else {
    renderChatEmpty();
  }
}

function renderChatEmpty() {
  const chatArea = document.getElementById('chatArea');
  chatArea.innerHTML = `
    <div class="chat-empty">
      <div style="width:48px;height:48px;border-radius:12px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;color:var(--accent);">
        <i data-lucide="bot" style="width:24px;height:24px;"></i>
      </div>
      <div class="chat-empty-title">Ask about ${machine.name}</div>
      <div class="chat-empty-sub">Get instant answers about maintenance procedures, common issues, and repair history.</div>
      <div class="chat-suggestions">
        <div class="chat-suggestion-chip" onclick="sendSuggestion(this)">💡 What are the most common issues with this machine?</div>
        <div class="chat-suggestion-chip" onclick="sendSuggestion(this)">🔧 Walk me through a routine inspection</div>
        <div class="chat-suggestion-chip" onclick="sendSuggestion(this)">🛠 What tools do I need for maintenance?</div>
        <div class="chat-suggestion-chip" onclick="sendSuggestion(this)">📹 Show me past repairs on this machine</div>
      </div>
    </div>`;
  lucide.createIcons();
}

function renderChatMessages() {
  const chatArea = document.getElementById('chatArea');
  let html = '';
  chatMessages.forEach(msg => {
    if (msg.role === 'user') {
      html += `
        <div class="chat-msg user">
          <div class="chat-msg-bubble">${escapeHtml(msg.text)}</div>
        </div>`;
    } else {
      let sourceHtml = '';
      if (msg.citations && msg.citations.length > 0) {
        const items = msg.citations.map(c => {
          const full = c.excerpt || '';
          const short = full.replace(/\s+/g, ' ').trim();
          const preview = short.length > 65 ? short.slice(0, 65).trimEnd() + '…' : short;
          const clickable = c.source_url ? `onclick="openPdfOverlay('${c.source_url}', ${c.page}, '${escapeHtml(c.title).replace(/'/g, "\\'")}')" style="cursor:pointer"` : '';
          return `
          <div class="chat-msg-ref-item" ${clickable}>
            <div class="chat-msg-ref-header">
              <span class="chat-msg-ref-title">📄 ${escapeHtml(c.title)}</span>
              <span class="chat-msg-ref-page">p. ${c.page}</span>
            </div>
            <p class="chat-msg-ref-excerpt">${escapeHtml(preview)}<span class="chat-msg-ref-hint"> · click to open</span></p>
          </div>`;
        }).join('');
        sourceHtml = `
          <div class="chat-msg-refs">
            <button class="chat-msg-refs-toggle" onclick="this.parentElement.classList.toggle('open')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="refs-chevron"><polyline points="6 9 12 15 18 9"></polyline></svg>
              References (${msg.citations.length})
            </button>
            <div class="chat-msg-refs-list">${items}</div>
          </div>`;
      } else if (msg.source) {
        // backward compat: demo data has plain string sources
        sourceHtml = `<div class="chat-msg-source">📄 ${escapeHtml(msg.source)}</div>`;
      }
      html += `
        <div class="chat-msg ai">
          <div class="chat-msg-bubble">${escapeHtml(msg.text)}</div>
          ${sourceHtml}
        </div>`;
    }
  });
  chatArea.innerHTML = html;
  chatArea.scrollTop = chatArea.scrollHeight;
}

function sendSuggestion(el) {
  const text = el.textContent.replace(/^[^\w]+/, '').trim();
  document.getElementById('chatInput').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || isTyping) return;
  input.value = '';

  if (chatMessages.length === 0) {
    document.getElementById('chatArea').innerHTML = '';
  }

  chatMessages.push({ role: 'user', text });
  renderChatMessages();

  isTyping = true;
  const chatArea = document.getElementById('chatArea');
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg ai';
  typingEl.id = 'typingIndicator';
  typingEl.innerHTML = `<div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  chatArea.appendChild(typingEl);
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    const result = await queryRAG(machineId, text);
    document.getElementById('typingIndicator')?.remove();
    isTyping = false;
    chatMessages.push({
      role: 'ai',
      text: result.answer,
      citations: result.citations,
    });
    renderChatMessages();
    chatArea.scrollTop = chatArea.scrollHeight;
  } catch (err) {
    document.getElementById('typingIndicator')?.remove();
    isTyping = false;
    chatMessages.push({ role: 'ai', text: 'Something went wrong. Please try again.', source: null });
    renderChatMessages();
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

// ── Session Detail Overlay ──
function openSessionOverlay(sessionId) {
  const session = machine.sessions.find(s => s.id === sessionId);
  if (!session) return;

  document.querySelectorAll('.session-card').forEach(el => el.classList.remove('active'));
  const activeCard = document.querySelector(`.session-card[data-session-id="${sessionId}"]`);
  if (activeCard) activeCard.classList.add('active');

  const video = session.videoId ? machine.videos.find(v => v.id === session.videoId) : null;

  const stepsHtml = session.steps.map(s => `<li>${s}</li>`).join('');
  const toolsHtml = session.tools.map(t => `<span class="pill-tag">${t}</span>`).join('');
  const partsHtml = session.parts.length > 0
    ? session.parts.map(p => `<span class="pill-tag">${p}</span>`).join('')
    : '<span style="color:var(--text-muted);font-size:13px;">None</span>';

  const outcomeClass = session.outcomeStatus === 'resolved' ? 'resolved' : '';
  const outcomeIcon = session.outcomeStatus === 'resolved' ? '✅ ' : '🔄 ';

  const recordingHtml = video ? `
    <div class="session-overlay-divider"></div>
    <div class="section-label">ATTACHED RECORDING</div>
    <div class="attached-recording" onclick="openVideoFromSession('${video.id}')">
      <div class="attached-recording-thumb">
        <img src="${video.thumb}" alt="${video.title}" onerror="this.style.display='none'">
      </div>
      <div class="attached-recording-info">
        <div class="attached-recording-title">${video.title}</div>
        <div class="attached-recording-meta">${video.technician} · ${video.duration}</div>
      </div>
      <div class="attached-recording-play">
        <i data-lucide="play" style="width:14px;height:14px;margin-left:2px;"></i>
      </div>
    </div>` : '';

  document.getElementById('sessionOverlayBody').innerHTML = `
    <span class="badge badge-${session.severity}">${getSeverityLabel(session.severity)}</span>
    <div class="session-overlay-title">${session.title}</div>
    <div class="session-overlay-subtitle">${session.date} · ${session.technician}</div>
    <div class="session-overlay-divider"></div>

    <div class="section-label">TRIGGER</div>
    <div class="section-value">${session.trigger}</div>

    <div class="section-label">OUTCOME</div>
    <div class="section-value ${outcomeClass}">${outcomeIcon}${session.outcome}</div>

    <div class="section-label">DOWNTIME</div>
    <div class="section-value">${session.downtime}</div>

    <div class="section-label">SUMMARY</div>
    <div class="section-value">${session.summary}</div>

    <div class="section-label">STEPS</div>
    <ol class="steps-list">${stepsHtml}</ol>

    <div class="section-label">TOOLS USED</div>
    <div class="pill-tags">${toolsHtml || '<span style="color:var(--text-muted);font-size:13px;">None</span>'}</div>

    <div class="section-label">PARTS REPLACED</div>
    <div class="pill-tags">${partsHtml}</div>

    ${recordingHtml}
  `;

  document.getElementById('sessionOverlay').classList.add('open');
  lucide.createIcons();
}

function closeSessionOverlay() {
  document.getElementById('sessionOverlay').classList.remove('open');
  document.querySelectorAll('.session-card').forEach(el => el.classList.remove('active'));
}

document.getElementById('sessionOverlayBack').addEventListener('click', closeSessionOverlay);
document.getElementById('sessionOverlayClose').addEventListener('click', closeSessionOverlay);
document.getElementById('sessionOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('sessionOverlay')) closeSessionOverlay();
});

function openVideoFromSession(videoId) {
  closeSessionOverlay();
  setTimeout(() => openVideoOverlay(videoId), 200);
}

// ── Video Preview Overlay ──
let currentVideo = null;
let videoEl = document.getElementById('videoEl');

function openVideoOverlay(videoId) {
  const video = machine.videos.find(v => v.id === videoId);
  if (!video) return;
  currentVideo = video;

  videoEl.src = video.file;
  videoEl.load();
  updatePlayPauseIcon();

  document.getElementById('videoMeta').textContent = `Recorded by ${video.technician} · ${video.date} · ${machine.name}`;

  const session = machine.sessions.find(s => s.id === video.sessionId);

  renderVideoTabs(video, session);
  renderRelatedSessions(video.id);
  renderChapterDots(session);

  document.getElementById('videoOverlay').classList.add('open');
  lucide.createIcons();
}

function closeVideoOverlay() {
  videoEl.pause();
  videoEl.src = '';
  document.getElementById('videoOverlay').classList.remove('open');
  currentVideo = null;
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('timeDisplay').textContent = '0:00 / 0:00';
}

document.getElementById('videoOverlayClose').addEventListener('click', closeVideoOverlay);
document.getElementById('videoOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('videoOverlay')) closeVideoOverlay();
});

function renderChapterDots(session) {
  const dotsContainer = document.getElementById('chapterDots');
  dotsContainer.innerHTML = '';
  if (!session || !session.timestamps) return;

  session.timestamps.forEach((ts, index) => {
    const pct = getTimestampPercent(index, session.timestamps.length);
    const dot = document.createElement('div');
    dot.className = 'chapter-dot';
    dot.style.left = `${Math.min(pct, 98)}%`;
    dot.innerHTML = `<div class="chapter-tooltip">${formatTime(ts.time)} — ${ts.label}</div>`;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      seekVideoFraction(pct / 100);
    });
    dotsContainer.appendChild(dot);
  });
}

function renderVideoTabs(video, session) {
  const severityLabel = getSeverityLabel(video.severity);
  const outcomeText = session ? (session.outcomeStatus === 'resolved' ? '✅ Resolved' : '🔄 Ongoing') : '✅ Resolved';
  const outcomeClass = session && session.outcomeStatus === 'resolved' ? 'badge-resolved' : 'badge-ongoing';
  const downtime = session ? session.downtime : '—';
  const summary = session ? session.summary : 'Expert repair session recorded for training purposes.';

  document.getElementById('tab-overview').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <span class="badge badge-${video.severity}">${severityLabel}</span>
      <span class="badge ${outcomeClass}">${outcomeText}</span>
    </div>
    <p style="font-size:14px;color:var(--text-secondary);line-height:1.7;margin-bottom:20px;">${summary}</p>
    <div class="section-label">DOWNTIME</div>
    <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">${downtime}</div>
    <div class="section-label">MACHINE</div>
    <div style="font-size:14px;color:var(--text-secondary);">${machine.name}</div>
  `;

  if (session && session.timestamps) {
    const stepsHtml = session.timestamps.map((ts, i) => {
      const stepDesc = session.steps[i] || ts.label;
      const pct = getTimestampPercent(i, session.timestamps.length);
      return `
        <div class="timestamp-step">
          <span class="timestamp-link" onclick="seekVideo(${ts.time})">${formatTime(ts.time)} →</span>
          <span class="timestamp-step-desc">${stepDesc}</span>
        </div>`;
    }).join('');
    document.getElementById('tab-steps').innerHTML = stepsHtml;
  } else {
    document.getElementById('tab-steps').innerHTML = `<p style="color:var(--text-muted);font-size:13px;">No step timestamps available.</p>`;
  }

  const toolsHtml = session && session.tools.length > 0
    ? `<div class="section-label">TOOLS USED</div><div class="pill-tags">${session.tools.map(t => `<span class="pill-tag">${t}</span>`).join('')}</div>`
    : '';
  const partsHtml = session && session.parts.length > 0
    ? `<div class="section-label">PARTS REPLACED</div><div class="pill-tags">${session.parts.map(p => `<span class="pill-tag">${p}</span>`).join('')}</div>`
    : '';
  const manualRef = session
    ? `<div class="section-label" style="margin-top:16px;">MANUAL REFERENCE</div>
       <div class="manual-ref">
         <i data-lucide="file-text" style="width:15px;height:15px;color:var(--accent);"></i>
         <span>Section 4.2 — Hydraulic System Maintenance</span>
       </div>`
    : '';

  document.getElementById('tab-resources').innerHTML = `${toolsHtml}${partsHtml}${manualRef}`;
}

function renderRelatedSessions(currentVideoId) {
  const related = machine.sessions.filter(s => s.id !== (currentVideo ? currentVideo.sessionId : null)).slice(0, 2);
  const container = document.getElementById('relatedSessions');

  if (related.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = `<div class="related-sessions-title">RELATED SESSIONS</div>`;
  related.forEach(s => {
    html += `
      <div class="related-session-card" onclick="openRelatedSession('${s.id}')">
        <div class="session-dot ${s.severity}" style="flex-shrink:0;margin-top:0;"></div>
        <div class="related-session-info">
          <div class="related-session-title">${s.title}</div>
          <div class="related-session-meta">${s.dateShort} · ${s.technician}</div>
        </div>
        <i data-lucide="chevron-right" style="width:14px;height:14px;color:var(--text-muted);"></i>
      </div>`;
  });
  container.innerHTML = html;
}

function openRelatedSession(sessionId) {
  closeVideoOverlay();
  setTimeout(() => openSessionOverlay(sessionId), 200);
}

// Tab switching
document.querySelectorAll('.video-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.video-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    lucide.createIcons();
  });
});

// ── Custom Video Player Controls ──
videoEl.addEventListener('timeupdate', () => {
  if (!videoEl.duration) return;
  const pct = (videoEl.currentTime / videoEl.duration) * 100;
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('timeDisplay').textContent = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
});

videoEl.addEventListener('loadedmetadata', () => {
  document.getElementById('timeDisplay').textContent = `0:00 / ${formatTime(videoEl.duration)}`;
  if (currentVideo) renderChapterDots(machine.sessions.find(s => s.id === currentVideo.sessionId));
});

videoEl.addEventListener('ended', () => {
  updatePlayPauseIcon();
});

document.getElementById('playPauseBtn').addEventListener('click', () => {
  if (videoEl.paused) videoEl.play();
  else videoEl.pause();
  updatePlayPauseIcon();
});

videoEl.addEventListener('play', updatePlayPauseIcon);
videoEl.addEventListener('pause', updatePlayPauseIcon);

function updatePlayPauseIcon() {
  const icon = document.getElementById('playPauseIcon');
  icon.setAttribute('data-lucide', videoEl.paused ? 'play' : 'pause');
  lucide.createIcons();
}

document.getElementById('skipBackBtn').addEventListener('click', () => {
  videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
});
document.getElementById('skipFwdBtn').addEventListener('click', () => {
  const duration = Number.isFinite(videoEl.duration) ? videoEl.duration : 0;
  videoEl.currentTime = duration > 0
    ? Math.min(duration, videoEl.currentTime + 10)
    : videoEl.currentTime + 10;
});

function seekToClientX(clientX) {
  const bar = document.getElementById('progressBarWrapper');
  const rect = bar.getBoundingClientRect();
  const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  seekVideoFraction(fraction);
}

let isScrubbing = false;
const progressBar = document.getElementById('progressBarWrapper');

progressBar.addEventListener('pointerdown', (e) => {
  isScrubbing = true;
  seekToClientX(e.clientX);
  progressBar.setPointerCapture?.(e.pointerId);
  e.preventDefault();
});
document.addEventListener('pointermove', (e) => {
  if (isScrubbing) seekToClientX(e.clientX);
});
document.addEventListener('pointerup', () => {
  isScrubbing = false;
});
progressBar.addEventListener('click', (e) => {
  seekToClientX(e.clientX);
});

document.getElementById('volumeSlider').addEventListener('input', (e) => {
  videoEl.volume = e.target.value;
  updateVolumeIcon();
});

document.getElementById('muteBtn').addEventListener('click', () => {
  videoEl.muted = !videoEl.muted;
  updateVolumeIcon();
});

function updateVolumeIcon() {
  const icon = document.getElementById('volumeIcon');
  if (videoEl.muted || videoEl.volume === 0) {
    icon.setAttribute('data-lucide', 'volume-x');
  } else if (videoEl.volume < 0.5) {
    icon.setAttribute('data-lucide', 'volume-1');
  } else {
    icon.setAttribute('data-lucide', 'volume-2');
  }
  lucide.createIcons();
}

document.getElementById('speedSelect').addEventListener('change', (e) => {
  videoEl.playbackRate = parseFloat(e.target.value);
});

document.getElementById('fullscreenBtn').addEventListener('click', () => {
  const wrapper = document.querySelector('.video-player-wrapper');
  if (document.fullscreenElement) document.exitFullscreen();
  else wrapper.requestFullscreen();
});

function getTimestampPercent(index, total) {
  if (!total || total <= 0) return 0;
  return Math.round(((index + 1) / total) * 100);
}

function seekVideoFraction(fraction) {
  if (videoEl.duration && Number.isFinite(videoEl.duration)) {
    const clamped = Math.max(0, Math.min(1, fraction));
    videoEl.currentTime = clamped * videoEl.duration;
    if (videoEl.paused) videoEl.play();
    updatePlayPauseIcon();
  }
}

function seekVideo(time) {
  const session = currentVideo
    ? machine.sessions.find((item) => item.id === currentVideo.sessionId)
    : null;
  const timestampIndex = session?.timestamps?.findIndex((ts) => ts.time === time) ?? -1;

  if (timestampIndex >= 0) {
    seekVideoFraction(getTimestampPercent(timestampIndex, session.timestamps.length) / 100);
    return;
  }

  if (videoEl.duration && Number.isFinite(videoEl.duration)) {
    videoEl.currentTime = Math.max(0, Math.min(videoEl.duration, time));
    if (videoEl.paused) videoEl.play();
    updatePlayPauseIcon();
  }
}

// ── PDF Viewer Overlay ──
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let _pdfDoc = null;
let _pdfUrl = '';
let _pdfPage = 1;
let _pdfTotal = 0;
let _pdfRendering = false;

async function openPdfOverlay(sourceUrl, page, title) {
  if (!sourceUrl) return;
  document.getElementById('pdfOverlayTitle').textContent = title;
  document.getElementById('pdfOverlay').classList.add('open');
  lucide.createIcons();
  _pdfPage = page;

  if (_pdfUrl !== sourceUrl) {
    _pdfUrl = sourceUrl;
    _pdfDoc = null;
    setPdfLoading(true);
    try {
      _pdfDoc = await pdfjsLib.getDocument(sourceUrl).promise;
      _pdfTotal = _pdfDoc.numPages;
    } catch (e) {
      setPdfLoading(false);
      return;
    }
  }
  await renderPdfPage(_pdfPage);
}

async function renderPdfPage(pageNum) {
  if (!_pdfDoc || _pdfRendering) return;
  _pdfRendering = true;
  setPdfLoading(true);

  const page = await _pdfDoc.getPage(pageNum);
  const wrap = document.getElementById('pdfViewerWrap');
  const scale = (wrap.clientWidth - 40) / page.getViewport({ scale: 1 }).width;
  const viewport = page.getViewport({ scale });

  const canvas = document.getElementById('pdfCanvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

  _pdfPage = pageNum;
  _pdfRendering = false;
  document.getElementById('pdfNavLabel').textContent = `p. ${pageNum} / ${_pdfTotal}`;
  document.getElementById('pdfOverlayPage').textContent = `p. ${pageNum}`;
  document.getElementById('pdfPrevBtn').disabled = pageNum <= 1;
  document.getElementById('pdfNextBtn').disabled = pageNum >= _pdfTotal;
  setPdfLoading(false);
}

function setPdfLoading(show) {
  document.getElementById('pdfLoading').style.display = show ? 'flex' : 'none';
  document.getElementById('pdfCanvas').style.display = show ? 'none' : 'block';
}

function closePdfOverlay() {
  document.getElementById('pdfOverlay').classList.remove('open');
}

document.getElementById('pdfPrevBtn').addEventListener('click', () => {
  if (_pdfPage > 1) renderPdfPage(_pdfPage - 1);
});
document.getElementById('pdfNextBtn').addEventListener('click', () => {
  if (_pdfPage < _pdfTotal) renderPdfPage(_pdfPage + 1);
});

document.getElementById('pdfOverlayClose').addEventListener('click', closePdfOverlay);
document.getElementById('pdfOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('pdfOverlay')) closePdfOverlay();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('addInspEntryModal').classList.contains('open')) closeAddInspEntryModal();
    else if (document.getElementById('uploadVideoModal').classList.contains('open')) closeUploadVideoModal();
    else if (document.getElementById('addMaintenanceModal').classList.contains('open')) closeAddMaintenanceModal();
    else if (document.getElementById('pdfOverlay').classList.contains('open')) closePdfOverlay();
    else if (document.getElementById('videoOverlay').classList.contains('open')) closeVideoOverlay();
    else if (document.getElementById('sessionOverlay').classList.contains('open')) closeSessionOverlay();
    else if (document.getElementById('workOrderOverlay').classList.contains('open')) closeWorkOrderOverlay();
    else if (document.getElementById('inspectionLogModal').classList.contains('open')) closeInspectionLogModal();
  }
});

// ── Upload Recording Modal ──
function openUploadVideoModal() {
  document.getElementById('uvMachine').value = machine.name;
  document.getElementById('uploadVideoModal').classList.add('open');
  lucide.createIcons();
}
function closeUploadVideoModal() {
  document.getElementById('uploadVideoModal').classList.remove('open');
  document.getElementById('uploadVideoForm').reset();
}
document.getElementById('uploadVideoBtn').addEventListener('click', openUploadVideoModal);
document.getElementById('uploadVideoModalClose').addEventListener('click', closeUploadVideoModal);
document.getElementById('uploadVideoCancelBtn').addEventListener('click', closeUploadVideoModal);
document.getElementById('uploadVideoModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('uploadVideoModal')) closeUploadVideoModal();
});
document.getElementById('uploadVideoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title       = document.getElementById('uvTitle').value.trim();
  const technician  = document.getElementById('uvTechnician').value.trim() || 'Unknown';
  const severity    = document.getElementById('uvSeverity').value;
  const duration    = document.getElementById('uvDuration').value.trim() || '0:00';
  const description = document.getElementById('uvDescription').value.trim();
  if (!title) return;

  const now       = new Date();
  const month     = now.toLocaleString('en-US', { month: 'long' }).toUpperCase() + ' ' + now.getFullYear();
  const dateShort = now.toLocaleString('en-US', { month: 'short' }) + ' ' + now.getDate();
  const date      = now.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (!machine.videos) machine.videos = [];
  machine.videos.unshift({
    id: 'v-new-' + Date.now(),
    title, technician, date, dateShort, duration, severity,
    file: '', thumb: '', sessionId: null, month,
    summary: description || 'Recording uploaded by senior technician.',
    resources: [],
  });
  renderVideos();
  closeUploadVideoModal();
});

// ── Add Maintenance Entry Modal ──
function openAddMaintenanceModal() {
  document.getElementById('amDate').valueAsDate = new Date();
  document.getElementById('addMaintenanceModal').classList.add('open');
  lucide.createIcons();
}
function closeAddMaintenanceModal() {
  document.getElementById('addMaintenanceModal').classList.remove('open');
  document.getElementById('addMaintenanceForm').reset();
}
document.getElementById('addMaintenanceBtn').addEventListener('click', openAddMaintenanceModal);
document.getElementById('addMaintenanceModalClose').addEventListener('click', closeAddMaintenanceModal);
document.getElementById('addMaintenanceCancelBtn').addEventListener('click', closeAddMaintenanceModal);
document.getElementById('addMaintenanceModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('addMaintenanceModal')) closeAddMaintenanceModal();
});
document.getElementById('addMaintenanceForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const dateVal     = document.getElementById('amDate').value;
  const title       = document.getElementById('amTitle').value.trim();
  const technician  = document.getElementById('amTechnician').value.trim();
  const severity    = document.getElementById('amSeverity').value;
  const type        = document.getElementById('amType').value;
  const description = document.getElementById('amDescription').value.trim();
  if (!title || !technician) return;

  const dateObj   = dateVal ? new Date(dateVal + 'T00:00:00') : new Date();
  const month     = dateObj.toLocaleString('en-US', { month: 'long' }).toUpperCase() + ' ' + dateObj.getFullYear();
  const dateShort = dateObj.toLocaleString('en-US', { month: 'short' }) + ' ' + dateObj.getDate();
  const date      = dateObj.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (!machine.sessions) machine.sessions = [];
  machine.sessions.unshift({
    id: 's-new-' + Date.now(),
    title, date, dateShort, technician, severity,
    trigger: type, outcome: 'Logged', outcomeStatus: 'resolved',
    downtime: '—', summary: description || 'Maintenance entry added manually.',
    steps: [], timestamps: [], tools: [], parts: [],
    videoId: null, month,
  });
  renderLog();
  closeAddMaintenanceModal();
});

// ── Add Inspection Entry Modal ──
function openAddInspEntryModal() {
  document.getElementById('aieDate').valueAsDate = new Date();
  document.getElementById('addInspEntryModal').classList.add('open');
  lucide.createIcons();
}
function closeAddInspEntryModal() {
  document.getElementById('addInspEntryModal').classList.remove('open');
  document.getElementById('addInspEntryForm').reset();
}
document.getElementById('addInspEntryBtn').addEventListener('click', openAddInspEntryModal);
document.getElementById('addInspEntryModalClose').addEventListener('click', closeAddInspEntryModal);
document.getElementById('addInspEntryCancelBtn').addEventListener('click', closeAddInspEntryModal);
document.getElementById('addInspEntryModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('addInspEntryModal')) closeAddInspEntryModal();
});
document.getElementById('addInspEntryForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const woNum      = document.getElementById('aieWONum').value.trim();
  const dateVal    = document.getElementById('aieDate').value;
  const type       = document.getElementById('aieType').value;
  const status     = document.getElementById('aieStatus').value;
  const technician = document.getElementById('aieTechnician').value.trim();
  const timeTaken  = document.getElementById('aieTimeTaken').value.trim() || '—';
  if (!woNum || !technician) return;

  const dateObj   = dateVal ? new Date(dateVal + 'T00:00:00') : new Date();
  const dateShort = dateObj.toLocaleString('en-US', { month: 'short' }) + ' ' + dateObj.getDate();
  const statusClass = status.toLowerCase().replace(/\s+/g, '-');

  const tableWrap = document.getElementById('inspTableWrap');
  const header    = tableWrap.querySelector('.insp-wo-header');
  const newRow    = `
    <div class="insp-wo-row" style="cursor:default;">
      <span class="insp-wo-num">${woNum}</span>
      <span class="insp-wo-cell">${dateShort}</span>
      <span class="insp-wo-cell">${type}</span>
      <span class="insp-wo-cell">${technician}</span>
      <span class="insp-wo-cell">${timeTaken}</span>
      <span class="wo-badge ${statusClass}">${status}</span>
    </div>`;

  if (header) {
    header.insertAdjacentHTML('afterend', newRow);
  } else {
    tableWrap.innerHTML = `
      <div class="insp-wo-header">
        <span class="insp-col-label">WO #</span>
        <span class="insp-col-label">Date</span>
        <span class="insp-col-label">Type</span>
        <span class="insp-col-label">Technician</span>
        <span class="insp-col-label">Time Taken</span>
        <span class="insp-col-label">Status</span>
      </div>` + newRow;
  }
  closeAddInspEntryModal();
});

initPage();
