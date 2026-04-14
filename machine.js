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

  const statusColor = getStatusColor(machine.status);
  const statusLabel = getStatusLabel(machine.status);

  document.getElementById('chatMachineName').textContent = machine.name;
  document.getElementById('chatStatusText').textContent = statusLabel;

  const statusEl = document.getElementById('chatMachineStatus');
  statusEl.style.color = statusColor;
  const dot = statusEl.querySelector('.dot');
  dot.style.background = statusColor;
  if (machine.status !== 'operational') {
    dot.style.animation = 'none';
  }

  renderLog();
  renderVideos();
  renderChat();

  if (focusChat) {
    setTimeout(() => document.getElementById('chatInput').focus(), 300);
  }

  lucide.createIcons();
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
      if (msg.source) {
        if (typeof msg.source === 'string') {
          // backward compat: existing demo data has plain string sources
          sourceHtml = `<div class="chat-msg-source">📄 ${escapeHtml(msg.source)}</div>`;
        } else {
          // RAG path: { title, excerpt }
          sourceHtml = `<div class="chat-msg-citation">
            <div class="chat-msg-citation-title"><span>📄</span> ${escapeHtml(msg.source.title)}</div>
            ${msg.source.excerpt ? `<div class="chat-msg-citation-excerpt">"${escapeHtml(msg.source.excerpt)}"</div>` : ''}
          </div>`;
        }
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
      source: result.citations.length > 0
        ? { title: result.citations[0].title, excerpt: result.citations[0].excerpt }
        : null
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

  session.timestamps.forEach(ts => {
    const duration = currentVideo ? currentVideo.durationSecs : 1;
    const pct = (ts.time / duration) * 100;
    const dot = document.createElement('div');
    dot.className = 'chapter-dot';
    dot.style.left = `${pct}%`;
    dot.innerHTML = `<div class="chapter-tooltip">${formatTime(ts.time)} — ${ts.label}</div>`;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      videoEl.currentTime = ts.time;
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
  videoEl.currentTime += 10;
});

function seekToFraction(clientX) {
  const bar = document.getElementById('progressBarWrapper');
  const rect = bar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  if (videoEl.duration && !isNaN(videoEl.duration)) {
    videoEl.currentTime = pct * videoEl.duration;
  }
}

let isScrubbing = false;

document.getElementById('progressBarWrapper').addEventListener('mousedown', (e) => {
  isScrubbing = true;
  seekToFraction(e.clientX);
  e.preventDefault();
});
document.addEventListener('mousemove', (e) => {
  if (isScrubbing) seekToFraction(e.clientX);
});
document.addEventListener('mouseup', () => {
  isScrubbing = false;
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

function seekVideo(time) {
  if (videoEl.duration) {
    videoEl.currentTime = time;
    if (videoEl.paused) videoEl.play();
    updatePlayPauseIcon();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('videoOverlay').classList.contains('open')) closeVideoOverlay();
    else if (document.getElementById('sessionOverlay').classList.contains('open')) closeSessionOverlay();
  }
});

initPage();
