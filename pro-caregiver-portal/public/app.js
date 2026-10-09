// LL ProCare - Professional Caregiver & Nurse Network Application Logic

const API_BASE = 'http://localhost:5000/api';

// Pre-seeded Professional Caregivers
const PROFILES = [
  {
    id: '67a800000000000000000001',
    name: 'Sister Lakshmi Narayanan, RN',
    hospital: 'Apollo Hospitals, Greams Road',
    department: 'Geriatric Care & Critical Nursing',
    role: 'Registered Geriatric Nurse',
    phone: '+91 98400 77889',
    email: 'sister.lakshmi@lifelink.com',
    experienceYears: 9,
    fee: 450,
    serviceArea: 'Central & South Chennai',
    radiusKm: 10,
    rating: 4.9,
    reviewsCount: 38,
    credentials: 'Tamil Nadu Nursing Council Certified (TNC-RN-994821). Specialist in elderly post-op & daily medication management.'
  },
  {
    id: '67a800000000000000000002',
    name: 'Anand Mohan',
    hospital: 'Fortis Malar Hospital, Adyar',
    department: 'Home Care & Physical Rehabilitation',
    role: 'Certified Mobility & Medication Aide',
    phone: '+91 98400 88990',
    email: 'anand.m@lifelink.com',
    experienceYears: 4,
    fee: 350,
    serviceArea: 'Mylapore & Adyar Zone',
    radiusKm: 8,
    rating: 4.8,
    reviewsCount: 19,
    credentials: 'Red Cross Certified Home Care Aide. Physical mobility support and elderly medication assistance specialist.'
  }
];

let currentProfileIndex = 0;
let currentProfile = PROFILES[0];
let onDuty = true;
let previousAcceptedCount = 0;
let radarPollInterval = null;
let socket = null;

// DOM Elements
const radarTabBtn = document.querySelector('[data-tab="radar"]');
const dispatchesTabBtn = document.querySelector('[data-tab="dispatches"]');
const profileTabBtn = document.querySelector('[data-tab="profile"]');
const messagesTabBtn = document.querySelector('[data-tab="messages"]');
const reviewsTabBtn = document.querySelector('[data-tab="reviews"]');

const radarTab = document.getElementById('radarTab');
const dispatchesTab = document.getElementById('dispatchesTab');
const profileTab = document.getElementById('profileTab');
const messagesTab = document.getElementById('messagesTab');
const reviewsTab = document.getElementById('reviewsTab');

const proChatFeed = document.getElementById('proChatFeed');
const proChatForm = document.getElementById('proChatForm');
const proChatInput = document.getElementById('proChatInput');
const refreshMessagesBtn = document.getElementById('refreshMessagesBtn');
const messageBadgeCount = document.getElementById('messageBadgeCount');

const radarList = document.getElementById('radarList');
const dispatchesList = document.getElementById('dispatchesList');
const radarCount = document.getElementById('radarCount');
const dispatchCount = document.getElementById('dispatchCount');

const flashBanner = document.getElementById('flashBanner');
const offerModal = document.getElementById('offerModal');
const offerForm = document.getElementById('offerForm');
const modalPatientInfo = document.getElementById('modalPatientInfo');
const modalRequestId = document.getElementById('modalRequestId');
const modalOfferedFee = document.getElementById('modalOfferedFee');
const modalEta = document.getElementById('modalEta');
const modalNote = document.getElementById('modalNote');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelOfferBtn = document.getElementById('cancelOfferBtn');

const dutyToggle = document.getElementById('dutyToggle');
const dutyText = document.getElementById('dutyText');
const switchCaregiverBtn = document.getElementById('switchCaregiverBtn');
const refreshRadarBtn = document.getElementById('refreshRadarBtn');

// Nav & Stats Elements
const navAvatar = document.getElementById('navAvatar');
const navName = document.getElementById('navName');
const navHospital = document.getElementById('navHospital');
const statServiceArea = document.getElementById('statServiceArea');
const statHospitalName = document.getElementById('statHospitalName');
const statRating = document.getElementById('statRating');
const statDefaultFee = document.getElementById('statDefaultFee');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadProfileToUI(currentProfile);
  initDutyToggle();
  initModal();
  initForm();
  initProChat();
  initSocket();

  // Initial fetch and polling
  fetchRadarRequests();
  radarPollInterval = setInterval(fetchRadarRequests, 3500);
});

// Tab Navigation
function initTabs() {
  const tabs = [
    { btn: radarTabBtn, pane: radarTab },
    { btn: dispatchesTabBtn, pane: dispatchesTab },
    { btn: profileTabBtn, pane: profileTab },
    { btn: messagesTabBtn, pane: messagesTab },
    { btn: reviewsTabBtn, pane: reviewsTab }
  ];

  tabs.forEach(({ btn, pane }) => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => {
        t.btn.classList.remove('active');
        t.pane.classList.remove('active');
      });
      btn.classList.add('active');
      pane.classList.add('active');

      if (pane === messagesTab) {
        fetchProMessages();
      }
      if (pane === reviewsTab) {
        renderReviews();
      }
    });
  });
}

// Switch between Pre-seeded Nurse Lakshmi & Anand Mohan
switchCaregiverBtn.addEventListener('click', () => {
  currentProfileIndex = (currentProfileIndex + 1) % PROFILES.length;
  currentProfile = PROFILES[currentProfileIndex];
  loadProfileToUI(currentProfile);
  showFlash(`Switched active profile to ${currentProfile.name} (${currentProfile.hospital})`, 'success');
  fetchRadarRequests();
});

// Load Profile Data to UI
function loadProfileToUI(prof) {
  navAvatar.textContent = prof.name.split(' ').map(n => n[0]).slice(0, 2).join('');
  navName.textContent = prof.name;
  navHospital.textContent = `🏥 ${prof.hospital}`;

  statServiceArea.textContent = prof.serviceArea;
  statHospitalName.textContent = prof.hospital;
  statRating.textContent = `${prof.rating} / 5.0 (${prof.reviewsCount} reviews)`;
  statDefaultFee.textContent = `₹${prof.fee} / visit`;

  // Form fields
  document.getElementById('profFullName').value = prof.name;
  document.getElementById('profHospital').value = prof.hospital;
  document.getElementById('profDepartment').value = prof.department;
  document.getElementById('profRole').value = prof.role;
  document.getElementById('profPhone').value = prof.phone;
  document.getElementById('profEmail').value = prof.email;
  document.getElementById('profExp').value = prof.experienceYears;
  document.getElementById('profFee').value = prof.fee;
  document.getElementById('profServiceArea').value = prof.serviceArea;
  document.getElementById('profRadius').value = prof.radiusKm;
  document.getElementById('profCredentials').value = prof.credentials;
}

// Duty Toggle
function initDutyToggle() {
  dutyToggle.addEventListener('click', () => {
    onDuty = !onDuty;
    if (onDuty) {
      dutyToggle.className = 'duty-btn on-duty';
      dutyText.textContent = '🟢 On Duty (Ready for Calls)';
      showFlash('You are now ON DUTY. Radar active for emergency dispatches.', 'success');
      fetchRadarRequests();
    } else {
      dutyToggle.className = 'duty-btn off-duty';
      dutyText.textContent = '⚪ Off Duty (Paused)';
      showFlash('You are now OFF DUTY. You will not receive new alerts.', 'alert');
    }
  });
}

// Flash Message Utility
function showFlash(message, type = 'success') {
  flashBanner.className = `flash-banner ${type}`;
  flashBanner.innerHTML = `
    <span>${message}</span>
    <button onclick="document.getElementById('flashBanner').style.display='none'" style="background:none;border:none;cursor:pointer;font-weight:bold;margin-left:1rem;">✕</button>
  `;
  flashBanner.style.display = 'flex';
  setTimeout(() => {
    if (flashBanner.style.display !== 'none') {
      flashBanner.style.display = 'none';
    }
  }, 5000);
}

// Modal Handlers
function initModal() {
  closeModalBtn.addEventListener('click', () => offerModal.style.display = 'none');
  cancelOfferBtn.addEventListener('click', () => offerModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === offerModal) offerModal.style.display = 'none';
  });

  offerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const requestId = modalRequestId.value;
    const fee = Number(modalOfferedFee.value);
    const eta = modalEta.value;
    const note = modalNote.value.trim();

    await submitOffer(requestId, fee, eta, note);
  });
}

// Open Offer Modal
function openOfferModal(req) {
  modalRequestId.value = req._id;
  modalOfferedFee.value = currentProfile.fee;
  modalNote.value = `On duty nearby ${currentProfile.hospital}. Carrying medication organizer aid and patient vitals kit.`;

  const patientName = req.patientId?.preferredName || 'Senior Patient';
  const age = req.patientId?.age ? `${req.patientId.age} yrs` : 'Senior';
  const area = req.approximateArea || 'T. Nagar, Chennai';

  modalPatientInfo.innerHTML = `
    <div style="font-weight:700;color:#0F172A;font-size:1.05rem;">👵 ${patientName} (${age})</div>
    <div style="color:#64748B;font-size:0.85rem;margin-top:2px;">📍 General Area: <strong>${area}</strong></div>
    <div style="color:#B91C1C;font-size:0.85rem;margin-top:4px;">🚨 Need: <em>${req.reason}</em></div>
  `;

  offerModal.style.display = 'flex';
}

// Fetch Radar Requests & Dispatches
async function fetchRadarRequests() {
  if (!onDuty) return;

  try {
    const res = await fetch(`${API_BASE}/professional-caregivers/nearby-requests?caregiverId=${currentProfile.id}`);
    const json = await res.json();

    if (json.success && json.data) {
      const available = json.data.availableRequests || [];
      const dispatches = json.data.myDispatches || [];

      radarCount.textContent = available.length;
      dispatchCount.textContent = dispatches.length;

      // Check if new dispatch was just accepted
      if (dispatches.length > previousAcceptedCount && previousAcceptedCount !== 0) {
        triggerAcceptChime();
        showFlash('🎉 DISPATCH AUTHORIZED! Family monitor accepted your offer. Address and contact number unlocked!', 'success');
      }
      previousAcceptedCount = dispatches.length;

      renderRadar(available);
      renderDispatches(dispatches);
    }
  } catch (err) {
    console.warn('[ProCare] Sync error:', err.message);
  }
}

refreshRadarBtn.addEventListener('click', () => {
  fetchRadarRequests();
  showFlash('Radar feed refreshed.', 'success');
});

// Render Live Patient Radar Feed
function renderRadar(requests) {
  if (requests.length === 0) {
    radarList.innerHTML = `
      <div class="empty-state">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">📡</div>
        <h3>Radar Clear — No Active Senior Calls</h3>
        <p style="margin-top:0.25rem;">When an elderly patient requests physical medication assistance from the patient app, the call appears here instantly.</p>
      </div>
    `;
    return;
  }

  radarList.innerHTML = requests.map(req => {
    const patientName = req.patientId?.preferredName || req.patientId?.fullName || 'Senior Patient';
    const age = req.patientId?.age ? `${req.patientId.age} yrs` : 'Senior Citizen';
    const area = req.approximateArea || 'T. Nagar, Chennai';
    const isUrgent = req.priority === 'HIGH';

    // Check if this nurse already placed an offer
    const myOffer = (req.offers || []).find(o => o.caregiverId === currentProfile.id || o.caregiverName === currentProfile.name);

    return `
      <div class="request-card ${isUrgent ? 'urgent' : ''}">
        <div class="request-top">
          <div class="patient-identity">
            <div class="patient-badge-avatar">👵</div>
            <div>
              <div class="patient-name">${patientName}</div>
              <div class="patient-demographics">${age} • Language: ${req.patientId?.primaryLanguage || 'Tamil & English'}</div>
            </div>
          </div>

          <div class="request-meta-tags">
            ${isUrgent ? '<span class="tag urgent-tag">🚨 Urgent Disability Call</span>' : ''}
            <span class="tag location-tag">📍 ${area} (~2.2 km)</span>
            <span class="tag status-tag">${req.status.replace(/_/g, ' ')}</span>
          </div>
        </div>

        <div class="reason-box">
          <div class="reason-title">Patient Condition & Assistance Required</div>
          <div class="reason-text">"${req.reason}"</div>
          ${req.medicineLocationNotes ? `<div class="notes-text"><strong>Home Storage Note:</strong> ${req.medicineLocationNotes}</div>` : ''}
        </div>

        <div class="request-bottom">
          <div class="privacy-pill">
            <span>🔒</span>
            <span>Street address & phone unlocked only after family monitor accepts offer</span>
          </div>

          <div class="card-actions">
            ${myOffer ? `
              <div style="background:#FEF3C7;border:1px solid #FCD34D;color:#92400E;padding:0.5rem 1rem;border-radius:8px;font-size:0.85rem;font-weight:700;">
                ⏳ Offer Sent: ₹${myOffer.offeredFee} (${myOffer.estimatedArrival || '15 mins'}) — Waiting for Family Approval
              </div>
            ` : `
              <button class="btn-primary" onclick="window.handleOpenOffer('${req._id}')">
                ⚡ Send Help Request & Fee to Family
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Global helper for opening modal from dynamic HTML
window.handleOpenOffer = (requestId) => {
  fetch(`${API_BASE}/assistance`)
    .then(r => r.json())
    .then(data => {
      const req = (data.data?.requests || []).find(r => r._id === requestId);
      if (req) openOfferModal(req);
    })
    .catch(err => console.error(err));
};

// Submit Offer to Family Monitor
async function submitOffer(requestId, offeredFee, estimatedArrival, notes) {
  try {
    const res = await fetch(`${API_BASE}/assistance/${requestId}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caregiverId: currentProfile.id,
        caregiverName: currentProfile.name,
        caregiverPhone: currentProfile.phone,
        hospital: currentProfile.hospital,
        department: currentProfile.department,
        experienceYears: currentProfile.experienceYears,
        rating: currentProfile.rating,
        offeredFee,
        estimatedArrival,
        notes
      })
    });

    const json = await res.json();
    if (json.success) {
      offerModal.style.display = 'none';
      showFlash(`✅ Assistance offer for ₹${offeredFee} submitted to family monitor! When accepted, patient phone and address will unlock immediately.`, 'success');
      fetchRadarRequests();
    } else {
      alert(json.message || 'Error submitting offer');
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
}

// Render Active Dispatches & Calls (Unlocked View!)
function renderDispatches(dispatches) {
  if (dispatches.length === 0) {
    dispatchesList.innerHTML = `
      <div class="empty-state">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">🛡️</div>
        <h3>No Active Dispatches Right Now</h3>
        <p style="margin-top:0.25rem;">Once a family caregiver accepts your offer, the job will appear here with the senior's full address and direct phone call button.</p>
      </div>
    `;
    return;
  }

  dispatchesList.innerHTML = dispatches.map(job => {
    const patientName = job.patientId?.preferredName || job.patientId?.fullName || 'Kalyani Ammal';
    const age = job.patientId?.age ? `${job.patientId.age} yrs` : '82 yrs';
    const address = job.patientId?.address || 'Flat 4B, Shanthi Apts, 14th Cross St, T. Nagar, Chennai - 600017';
    const familyName = job.primaryCaregiverId?.name || 'Ramesh (Son / Caregiver)';
    const familyPhone = job.primaryCaregiverId?.phone || '+91 98400 12345';
    const fee = job.fee || currentProfile.fee;

    return `
      <div class="dispatch-card">
        <div class="dispatch-header">
          <div>
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <h3 style="font-size:1.35rem;font-weight:800;color:#0F172A;">👵 ${patientName} (${age})</h3>
              <span class="authorized-badge">✅ FAMILY AUTHORIZED & ACCEPTED</span>
            </div>
            <div style="color:#16A34A;font-weight:700;font-size:0.9rem;margin-top:4px;">
              Assistance Fee Agreed: ₹${fee} • Payment Guaranteed
            </div>
          </div>

          <div>
            <a href="tel:${familyPhone.replace(/\s+/g, '')}" class="btn-call">
              📞 Direct Call Family: ${familyPhone}
            </a>
          </div>
        </div>

        <!-- UNLOCKED PRIVATE DETAILS (Protected by Two-Step Verification) -->
        <div class="unlocked-details-grid">
          <div class="unlocked-item">
            <div class="label">📍 Unlocked Residential Address</div>
            <div class="value">${address}</div>
            <div class="sub-value">
              <a href="https://maps.google.com/?q=${encodeURIComponent(address)}" target="_blank" style="color:#0284C7;font-weight:700;text-decoration:none;">
                🗺️ Open in Google Maps ↗
              </a>
            </div>
          </div>

          <div class="unlocked-item">
            <div class="label">👤 Family Monitor Contact</div>
            <div class="value">${familyName}</div>
            <div class="sub-value">Phone: <strong>${familyPhone}</strong> (Available for address directions)</div>
          </div>

          <div class="unlocked-item">
            <div class="label">💊 Medicine Location in Residence</div>
            <div class="value">${job.medicineLocationNotes || 'Bedside Medicine Organizer (Master Bedroom)'}</div>
            <div class="sub-value">Senior need: ${job.reason}</div>
          </div>
        </div>

        <!-- Real-Time Progress Steps -->
        <div class="progress-steps-bar">
          <span style="font-size:0.85rem;font-weight:700;color:#475569;display:flex;align-items:center;margin-right:0.5rem;">
            Update Status to Family:
          </span>

          <button class="btn-outline" onclick="window.advanceDispatchState('${job._id}', 'force-advance')" ${job.status === 'EN_ROUTE' ? 'disabled style="opacity:0.6;"' : ''}>
            🚗 Mark En Route
          </button>

          <button class="btn-outline" onclick="window.advanceDispatchState('${job._id}', 'arrived')" ${job.status === 'ARRIVED' ? 'disabled style="opacity:0.6;"' : ''}>
            📍 Mark Arrived at Residence
          </button>

          <button class="btn-primary" onclick="window.advanceDispatchState('${job._id}', 'complete', { completionMethod: 'ASSISTED_HANDOFF' })">
            ✅ Mark Medicine Assisted & Complete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Advance Dispatch State
window.advanceDispatchState = async (requestId, endpoint, body = {}) => {
  try {
    const res = await fetch(`${API_BASE}/assistance/${requestId}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.success) {
      showFlash(json.message || 'Status updated to family monitor.', 'success');
      fetchRadarRequests();
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert(err.message);
  }
};

// Audio Chime on Acceptance
function triggerAcceptChime() {
  const audio = document.getElementById('acceptAudio');
  if (audio) {
    audio.play().catch(e => console.log('Audio autoplay prevented:', e));
  }
}

// Socket.io Real-time connection
function initSocket() {
  try {
    socket = io('http://localhost:5000');
    socket.on('connect', () => {
      console.log('[Socket] Connected to LifeLink Central API');
    });

    socket.on('assistance_status', (data) => {
      console.log('[Socket] Assistance status updated:', data);
      fetchRadarRequests();
    });

    socket.on('offer_accepted', (data) => {
      console.log('[Socket] Offer accepted event:', data);
      triggerAcceptChime();
      showFlash(`🎉 ${data.acceptedOffer?.caregiverName || 'Your'} offer was ACCEPTED by the family! Address & contact unlocked.`, 'success');
      fetchRadarRequests();
    });

    socket.on('caregiver_message', (data) => {
      console.log('[Socket] New caregiver message received:', data);
      fetchProMessages();
    });
  } catch (err) {
    console.warn('[Socket] Could not connect to socket:', err);
  }
}

// Profile Form Save
function initForm() {
  const profileForm = document.getElementById('profileForm');
  const saveStatus = document.getElementById('saveStatus');

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updated = {
      fullName: document.getElementById('profFullName').value.trim(),
      hospital: document.getElementById('profHospital').value.trim(),
      department: document.getElementById('profDepartment').value.trim(),
      professionalRole: document.getElementById('profRole').value.trim(),
      phone: document.getElementById('profPhone').value.trim(),
      email: document.getElementById('profEmail').value.trim(),
      experienceYears: Number(document.getElementById('profExp').value),
      fixedAssistanceFee: Number(document.getElementById('profFee').value),
      serviceArea: document.getElementById('profServiceArea').value.trim(),
      serviceRadiusKm: Number(document.getElementById('profRadius').value),
      credentialsSummary: document.getElementById('profCredentials').value.trim(),
      address: 'Chennai Medical Zone'
    };

    saveStatus.textContent = 'Saving to central system...';

    try {
      const res = await fetch(`${API_BASE}/professional-caregivers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const json = await res.json();

      if (json.success) {
        saveStatus.textContent = '✅ Profile & Rates Successfully Synced!';
        currentProfile.name = updated.fullName;
        currentProfile.hospital = updated.hospital;
        currentProfile.department = updated.department;
        currentProfile.role = updated.professionalRole;
        currentProfile.phone = updated.phone;
        currentProfile.fee = updated.fixedAssistanceFee;
        currentProfile.serviceArea = updated.serviceArea;

        loadProfileToUI(currentProfile);
        setTimeout(() => saveStatus.textContent = '', 4000);
      } else {
        saveStatus.textContent = '❌ ' + json.message;
      }
    } catch (err) {
      saveStatus.textContent = '❌ Sync error: ' + err.message;
    }
  });
}

// Family Chat & Messaging for Professional Caregiver
function initProChat() {
  if (proChatForm) {
    proChatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = proChatInput.value.trim();
      if (!text) return;

      try {
        const res = await fetch(`${API_BASE}/professional-caregivers/${currentProfile.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            senderRole: 'professional_caregiver',
            senderName: currentProfile.name,
            senderPhone: currentProfile.phone
          })
        });
        const json = await res.json();
        if (json.success) {
          proChatInput.value = '';
          fetchProMessages();
        }
      } catch (err) {
        console.error('Error sending pro chat message:', err);
      }
    });
  }

  if (refreshMessagesBtn) {
    refreshMessagesBtn.addEventListener('click', fetchProMessages);
  }
}

async function fetchProMessages() {
  try {
    const res = await fetch(`${API_BASE}/professional-caregivers/${currentProfile.id}/messages`);
    const json = await res.json();
    if (json.success && json.data) {
      const messages = json.data.messages || [];
      if (messageBadgeCount) {
        messageBadgeCount.textContent = messages.length;
      }

      if (!proChatFeed) return;

      if (messages.length === 0) {
        proChatFeed.innerHTML = `
          <div style="text-align:center;margin:auto;color:#64748B;font-size:0.9rem;">
            No messages yet from family caregivers. When a family monitor accepts your rate or messages you from their dashboard, their texts appear here!
          </div>
        `;
        return;
      }

      proChatFeed.innerHTML = messages.map(msg => {
        const isMe = msg.senderRole === 'professional_caregiver';
        return `
          <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 80%; background: ${isMe ? '#0D9488' : '#FFFFFF'}; color: ${isMe ? '#FFFFFF' : '#0F172A'}; border-radius: 12px; padding: 0.75rem 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size: 0.72rem; color: ${isMe ? '#CCFBF1' : '#64748B'}; font-weight: 700; margin-bottom: 2px;">
              ${msg.senderName} (${msg.senderRole === 'family_monitor' ? 'Family Monitor' : 'Nurse'})
            </div>
            <div style="font-size: 0.92rem; line-height: 1.4;">
              ${msg.text}
            </div>
            <div style="font-size: 0.65rem; color: ${isMe ? '#99F6E4' : '#94A3B8'}; text-align: right; margin-top: 4px;">
              ${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `;
      }).join('');

      proChatFeed.scrollTop = proChatFeed.scrollHeight;
    }
  } catch (err) {
    console.warn('Error fetching pro messages:', err);
  }
}

// Render Reviews Tab
function renderReviews() {
  const reviewsList = document.getElementById('reviewsList');
  const reviews = [
    {
      author: 'Meenakshi Sundaram (Family Caregiver)',
      date: 'Yesterday, 6:45 PM',
      rating: 5,
      comment: 'Sister Lakshmi arrived within 15 minutes of my request in T. Nagar. She was extremely gentle with my grandmother and guided her through the evening medication with immense patience.'
    },
    {
      author: 'Dr. R. Ramanathan, MD (Geriatrician)',
      date: '3 days ago',
      rating: 5,
      comment: 'Very professional nursing demeanor. Recorded precise dose confirmation and verified grandmother’s blood pressure before administering evening pills.'
    },
    {
      author: 'Karthik Subramanian (Son)',
      date: 'Last week',
      rating: 5,
      comment: 'I was stuck in an office meeting in OMR when my father reported difficulty handling his Parkinson medication. The LifeLink ProCare dispatch was a life saver.'
    },
    {
      author: 'V. Sundaresan (Patient Husband)',
      date: '2 weeks ago',
      rating: 5,
      comment: 'Punctual, polite, and verified by Apollo Hospitals. Great reassurance for senior citizens living in apartment complexes.'
    }
  ];

  reviewsList.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <span class="review-author">${r.author}</span>
        <span class="review-date">${r.date}</span>
      </div>
      <div class="review-stars">${'★'.repeat(r.rating)}</div>
      <p class="review-comment">"${r.comment}"</p>
    </div>
  `).join('');
}
