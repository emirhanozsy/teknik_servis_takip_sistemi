// ===== Teknik Servis Yönetim Sistemi - Frontend App =====

let currentUser = null;
let currentPage = 'services';

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user) {
      window.location.href = '/';
      return;
    }
    currentUser = data.user;
    initApp();
  } catch {
    window.location.href = '/';
  }
});

function initApp() {
  // Set user info
  document.getElementById('userName').textContent = currentUser.full_name;
  const roleMap = {
    'admin': 'Sistem Yöneticisi',
    'yönetici': 'Hizmet Yöneticisi',
    'personel': 'Saha Personeli'
  };
  document.getElementById('userRole').textContent = roleMap[currentUser.role] || (currentUser.service_name || 'Personel');
  
  const avatarEl = document.getElementById('userAvatar');
  if (currentUser.profile_picture) {
    avatarEl.innerHTML = `<img src="${currentUser.profile_picture}" alt="${currentUser.full_name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
  } else {
    avatarEl.textContent = currentUser.full_name.charAt(0).toUpperCase();
  }

  // Hide Personnel and Settings for staff
  if (currentUser.role === 'personel') {
    document.querySelector('.nav-item[data-page="personnel"]')?.style.setProperty('display', 'none');
    document.querySelector('.nav-item[data-page="settings"]')?.style.setProperty('display', 'none');
  }

  // Admin class
  if (currentUser.role === 'admin') {
    document.body.classList.add('is-admin');
  }

  // Navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPage = btn.dataset.page;
      renderPage(currentPage);
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // Theme Toggle
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light-theme');

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const newTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
    });
  });

  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  const toggleMobileMenu = () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
  };

  menuToggle?.addEventListener('click', toggleMobileMenu);
  sidebarOverlay?.addEventListener('click', toggleMobileMenu);

  // Close sidebar on nav item click (mobile)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
      }
    });
  });

  // Modal close on overlay click
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });

  // Render initial page
  // Render initial page
  renderPage('home');
}

// ===== Page Router =====
function renderPage(page) {
  const main = document.getElementById('mainContent');
  switch (page) {
    case 'home': renderDashboardPage(main); break;
    case 'services': renderServicesPage(main); break;
    case 'customers': renderCustomersPage(main); break;
    case 'personnel': renderPersonnelPage(main); break;
    case 'settings': renderSettingsPage(main); break;
  }
}

// ===== HOME / DASHBOARD PAGE =====
async function renderDashboardPage(container) {
  const stats = await apiGet('/api/dashboard/stats');
  
  const avatarHtml = currentUser.profile_picture 
    ? `<img src="${currentUser.profile_picture}" alt="${currentUser.full_name}">`
    : currentUser.full_name.charAt(0).toUpperCase();

  const roleMap = {
    'admin': 'Patron',
    'yönetici': 'Hizmet Yöneticisi',
    'personel': 'Saha Personeli'
  };

  container.innerHTML = `
    <div class="dashboard-header-container">
      <div class="dashboard-stats-side">
        <h1 class="brand-title">${currentUser.service_name || 'KOLTUXPRESS'}</h1>
        <div class="stat-row">
          <span class="stat-label">Toplam Servis Sayısı</span>
          <span class="stat-value">${stats.services || 0}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Müşteri Sayısı</span>
          <span class="stat-value">${stats.customers || 0}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Personel Sayısı</span>
          <span class="stat-value">${stats.personnel || 0}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Kasa Durumu</span>
          <span class="stat-value">${(stats.cash || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
        </div>
      </div>
      <div class="dashboard-profile-side">
        <div class="dashboard-avatar">
          ${avatarHtml}
        </div>
        <div class="dashboard-user-info">
          <div class="dashboard-user-name">${currentUser.full_name}</div>
          <div class="dashboard-user-role">${roleMap[currentUser.role] || 'Personel'}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-periodic-stats">
      <div class="stat-card highlight">
        <div class="label">Günlük <span>alınan servis sayısı</span></div>
        <div class="value">${stats.periodic?.today || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">Haftalık <span>alınan servis sayısı</span></div>
        <div class="value">${stats.periodic?.thisWeek || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">Aylık <span>alınan servis sayısı</span></div>
        <div class="value">${stats.periodic?.thisMonth || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">Yıllık <span>alınan servis sayısı</span></div>
        <div class="value">${stats.periodic?.thisYear || 0}</div>
      </div>
    </div>

    <div class="dashboard-chart-section">
      <div class="chart-header">
        <h2>Son 7 Günlük Servis Grafiği</h2>
      </div>
      <div class="chart-container">
        <canvas id="serviceChart"></canvas>
      </div>
    </div>
  `;

  // Initialize Chart
  const ctx = document.getElementById('serviceChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stats.chart.map(d => d.label),
      datasets: [{
        label: 'Servis Sayısı',
        data: stats.chart.map(d => d.value),
        backgroundColor: stats.chart.map((_, i) => i % 2 === 0 ? '#60A5FA' : '#6366F1'),
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#94a3b8' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          ticks: { color: '#94a3b8' },
          grid: { display: false }
        }
      }
    }
  });
}

// ===== Utility Functions =====
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadge(status) {
  const map = {
    'Beklemede': 'badge-waiting',
    'Devam Ediyor': 'badge-progress',
    'Tamamlandı': 'badge-done',
    'İptal': 'badge-cancelled',
    'İade Edildi': 'badge-cancelled'
  };
  // Normalize key for map
  const key = Object.keys(map).find(k => k.toLowerCase() === (status || '').toLowerCase());
  return `<span class="badge ${map[key] || 'badge-default'}">${status || 'Beklemede'}</span>`;
}

function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

async function apiGet(url) {
  const res = await fetch(url);
  if (res.status === 401) { window.location.href = '/'; return []; }
  return await res.json();
}

async function apiPost(url, data) {
  console.log('apiPost called:', url, data);
  const isFormData = data && (data instanceof FormData || (data.constructor && data.constructor.name === 'FormData'));
  const options = {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data)
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(url, options);
  return await res.json();
}

async function apiPut(url, data) {
  console.log('apiPut called:', url, data);
  const isFormData = data && (data instanceof FormData || (data.constructor && data.constructor.name === 'FormData'));
  const options = {
    method: 'PUT',
    body: isFormData ? data : JSON.stringify(data)
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(url, options);
  return await res.json();
}

async function apiDelete(url) {
  const res = await fetch(url, { method: 'DELETE' });
  return await res.json();
}

// ===== SERVICES PAGE =====
async function renderServicesPage(container) {
  const [services, stages] = await Promise.all([
    apiGet('/api/services'),
    apiGet('/api/settings/stages')
  ]);

  const totalCount = services.length;
  const waitingCount = services.filter(s => s.status === 'Beklemede').length;
  const progressCount = services.filter(s => s.status === 'Devam Ediyor').length;
  const doneCount = services.filter(s => s.status === 'Tamamlandı').length;

  let authServiceFilterHtml = '';
  // Removed admin-only authorized services filter as per requested refinement

  container.innerHTML = `
    <div class="page-header">
      <h1>Servisler</h1>
      <div class="page-header-actions">
        <div class="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="serviceSearchInput" placeholder="ID veya Müşteri Ara...">
        </div>
        <div class="filter-group">
          <select id="statusFilter" class="filter-select">
            <option value="">Tüm Durumlar</option>
            <option value="Beklemede">Beklemede</option>
            <option value="Devam Ediyor">Devam Ediyor</option>
            <option value="Tamamlandı">Tamamlandı</option>
            <option value="İptal">İptal</option>
          </select>
        </div>
        
        <button class="btn-primary" id="newServiceBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Yeni Servis
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card accent">
        <div class="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <div class="stat-label">Toplam Servis</div>
        <div class="stat-value">${totalCount}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-label">Beklemede</div>
        <div class="stat-value">${waitingCount}</div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </div>
        <div class="stat-label">Devam Ediyor</div>
        <div class="stat-value">${progressCount}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-label">Tamamlandı</div>
        <div class="stat-value">${doneCount}</div>
      </div>
    </div>

    <div class="table-container">
      ${services.length === 0 ? `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <h3>Henüz servis kaydı yok</h3>
          <p>Yeni bir servis kaydı oluşturmak için yukarıdaki butonu kullanın</p>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tarih</th>
              <th>Müşteri</th>
              <th>Cihaz</th>
              <th>Arıza</th>
              <th>Kaynak</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody id="servicesTableBody">
            ${services.map(s => `
              <tr data-id="${s.id}" data-customer="${(s.customer_name || '').toLowerCase()}" data-status="${s.status}">
                <td><small>#${s.id}</small></td>
                <td>${formatDate(s.created_at)}</td>
                <td>${s.customer_name || '-'}</td>
                <td>${[s.device_brand, s.device_model].filter(Boolean).join(' ') || '-'}</td>
                <td>${s.device_fault || '-'}</td>
                <td><span class="badge badge-outline">${s.service_source || '-'}</span></td>
                <td>${getStatusBadge(s.status)}</td>
                <td>
                  <div style="display:flex;gap:0.25rem;">
                    <select class="status-select" data-id="${s.id}" style="padding:0.3rem;font-size:0.8rem;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--text-primary);">
                      ${stages.length > 0 
                        ? stages.map(st => `<option value="${st.name}" ${s.status === st.name ? 'selected' : ''}>${st.name}</option>`).join('')
                        : `
                          <option value="Beklemede" ${s.status === 'Beklemede' ? 'selected' : ''}>Beklemede</option>
                          <option value="Devam Ediyor" ${s.status === 'Devam Ediyor' ? 'selected' : ''}>Devam Ediyor</option>
                          <option value="Tamamlandı" ${s.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                          <option value="İptal" ${s.status === 'İptal' ? 'selected' : ''}>İptal</option>
                        `
                      }
                    </select>
                    <button class="btn-icon edit-service-btn" data-id="${s.id}" title="Düzenle">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    ${(currentUser.role === 'admin' || currentUser.role === 'yönetici') ? `
                      <button class="btn-icon delete-service-btn" data-id="${s.id}" title="Sil">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;

  // Filter Function
  const filterServices = () => {
    const searchTerm = document.getElementById('serviceSearchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;
    
    document.querySelectorAll('#servicesTableBody tr').forEach(tr => {
      const id = tr.dataset.id;
      const customer = tr.dataset.customer;
      const status = tr.dataset.status;
      
      const matchesSearch = !searchTerm || id.includes(searchTerm) || customer.includes(searchTerm) || `#${id}`.includes(searchTerm);
      const matchesStatus = !statusFilter || status === statusFilter;
      
      tr.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
  };

  document.getElementById('serviceSearchInput')?.addEventListener('input', filterServices);
  document.getElementById('statusFilter')?.addEventListener('change', filterServices);
  

  // Event listeners
  document.getElementById('newServiceBtn')?.addEventListener('click', openNewServiceModal);

  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      await apiPut(`/api/services/${e.target.dataset.id}`, { status: e.target.value });
      renderServicesPage(container);
    });
  });

  document.querySelectorAll('.edit-service-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditServiceModal(btn.dataset.id, services));
  });

  document.querySelectorAll('.delete-service-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu servis kaydını silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/services/${btn.dataset.id}`);
        renderServicesPage(container);
      }
    });
  });
}

// ===== New Service Modal =====
async function openNewServiceModal() {
  const [brands, types, stages, sources, vehicles] = await Promise.all([
    apiGet('/api/settings/brands'),
    apiGet('/api/settings/types'),
    apiGet('/api/settings/stages'),
    apiGet('/api/settings/sources'),
    apiGet('/api/settings/vehicles')
  ]);
  

  openModal(`
    <div class="modal-header">
      <h2>Yeni Servis Kaydı</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-section-title">Müşteri Bilgileri</div>
        <div class="form-group">
          <label>Servis Kaynağı</label>
          <select id="svc_source">
            <option value="">Seçiniz...</option>
            ${sources.map(src => `<option value="${src.name}">${src.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Müşteri Tipi</label>
          <select id="svc_customer_type">
            <option value="bireysel">Bireysel</option>
            <option value="kurumsal">Kurumsal</option>
          </select>
        </div>
        <div class="form-group autocomplete-wrapper">
          <label>Müşteri Adı</label>
          <input type="text" id="svc_customer_name" placeholder="Müşteri adını girin veya arayın" autocomplete="off">
          <input type="hidden" id="svc_customer_id">
          <div class="autocomplete-list" id="svc_autocomplete_list"></div>
        </div>
        <div class="form-group">
          <label>Telefon</label>
          <input type="tel" id="svc_phone" placeholder="Telefon numarası">
        </div>
        <div class="form-group">
          <label>Telefon 2</label>
          <input type="tel" id="svc_phone2" placeholder="Alternatif telefon">
        </div>
        <div class="form-group">
          <label>İl</label>
          <input type="text" id="svc_city" placeholder="İl">
        </div>
        <div class="form-group">
          <label>İlçe</label>
          <input type="text" id="svc_district" placeholder="İlçe">
        </div>
        <div class="form-group full-width">
          <label>Adres</label>
          <textarea id="svc_address" placeholder="Açık adres"></textarea>
        </div>
        <div class="form-group">
          <label>Kimlik No</label>
          <input type="text" id="svc_id_number" placeholder="TC Kimlik No">
        </div>
        <div class="form-group">
          <label>Müsait Olma Tarihi</label>
          <input type="date" id="svc_availability_date">
        </div>
        <div class="form-group">
          <label>Saat Başlangıç</label>
          <input type="time" id="svc_time_start">
        </div>
        <div class="form-group">
          <label>Saat Bitiş</label>
          <input type="time" id="svc_time_end">
        </div>

        <div class="form-section-title">Cihaz Bilgileri</div>
        <div class="form-group">
          <label>Cihaz Markası</label>
          <select id="svc_device_brand">
            <option value="">Seçiniz...</option>
            ${brands.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Cihaz Türü</label>
          <select id="svc_device_type">
            <option value="">Seçiniz...</option>
            ${types.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Cihaz Modeli</label>
          <input type="text" id="svc_device_model" placeholder="Model">
        </div>
        <div class="form-group">
          <label>Garanti Süresi</label>
          <input type="text" id="svc_warranty_period" placeholder="Ör: 6 ay">
        </div>
        <div class="form-group full-width">
          <label>Cihaz Arızası</label>
          <textarea id="svc_device_fault" placeholder="Arıza detaylarını yazın"></textarea>
        </div>
        <div class="form-group">
          <label>Durum</label>
          <select id="svc_status">
            ${stages.length > 0 
              ? stages.map(st => `<option value="${st.name}">${st.name}</option>`).join('')
              : `
                <option value="Beklemede">Beklemede</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal">İptal</option>
              `
            }
          </select>
        </div>
        <div class="form-group">
          <label>Servis Aracı</label>
          <select id="svc_vehicle">
            <option value="">Seçiniz...</option>
            ${vehicles.map(v => `<option value="${v.name}">${v.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label>Operatör Notu</label>
          <textarea id="svc_operator_note" placeholder="Eklemek istediğiniz notlar"></textarea>
        </div>
      </div>
      <div id="svc_error" class="error-message" style="display:none;margin-top:1rem;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn-primary" id="saveServiceBtn">Kaydet</button>
    </div>
  `);

  // Autocomplete
  setupCustomerAutocomplete();

  // Save service
  document.getElementById('saveServiceBtn').addEventListener('click', saveNewService);
}

function setupCustomerAutocomplete() {
  const input = document.getElementById('svc_customer_name');
  const list = document.getElementById('svc_autocomplete_list');
  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    document.getElementById('svc_customer_id').value = '';

    if (q.length < 2) {
      list.classList.remove('show');
      return;
    }

    debounceTimer = setTimeout(async () => {
      const results = await apiGet(`/api/customers/search?q=${encodeURIComponent(q)}`);
      if (results.length === 0) {
        list.classList.remove('show');
        return;
      }

      list.innerHTML = results.map(c => `
        <div class="autocomplete-item" data-id="${c.id}" data-name="${c.full_name}"
             data-type="${c.customer_type}" data-phone="${c.phone || ''}" data-phone2="${c.phone2 || ''}"
             data-city="${c.city || ''}" data-district="${c.district || ''}"
             data-address="${c.address || ''}" data-idnumber="${c.id_number || ''}">
          ${c.full_name}
          <div class="sub">${c.phone || ''} - ${c.city || ''}</div>
        </div>
      `).join('');
      list.classList.add('show');

      list.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          document.getElementById('svc_customer_id').value = item.dataset.id;
          document.getElementById('svc_customer_name').value = item.dataset.name;
          document.getElementById('svc_customer_type').value = item.dataset.type || 'bireysel';
          document.getElementById('svc_phone').value = item.dataset.phone;
          document.getElementById('svc_phone2').value = item.dataset.phone2;
          document.getElementById('svc_city').value = item.dataset.city;
          document.getElementById('svc_district').value = item.dataset.district;
          document.getElementById('svc_address').value = item.dataset.address;
          document.getElementById('svc_id_number').value = item.dataset.idnumber;
          list.classList.remove('show');
        });
      });
    }, 300);
  });

  // Close autocomplete on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper')) {
      list.classList.remove('show');
    }
  });
}

async function saveNewService() {
  const errorEl = document.getElementById('svc_error');
  errorEl.style.display = 'none';

  const data = {
    customer_id: document.getElementById('svc_customer_id').value || null,
    customer_type: document.getElementById('svc_customer_type').value,
    customer_name: document.getElementById('svc_customer_name').value.trim(),
    phone: document.getElementById('svc_phone').value.trim(),
    phone2: document.getElementById('svc_phone2').value.trim(),
    city: document.getElementById('svc_city').value.trim(),
    district: document.getElementById('svc_district').value.trim(),
    address: document.getElementById('svc_address').value.trim(),
    id_number: document.getElementById('svc_id_number').value.trim(),
    availability_date: document.getElementById('svc_availability_date').value,
    time_start: document.getElementById('svc_time_start').value,
    time_end: document.getElementById('svc_time_end').value,
    device_brand: document.getElementById('svc_device_brand').value.trim(),
    device_type: document.getElementById('svc_device_type').value.trim(),
    device_model: document.getElementById('svc_device_model').value.trim(),
    device_fault: document.getElementById('svc_device_fault').value.trim(),
    operator_note: document.getElementById('svc_operator_note').value.trim(),
    warranty_period: document.getElementById('svc_warranty_period').value.trim(),
    status: document.getElementById('svc_status').value,
    service_source: document.getElementById('svc_source').value,
    service_vehicle: document.getElementById('svc_vehicle').value
  };


  if (!data.customer_name) {
    errorEl.textContent = 'Müşteri adı gereklidir';
    errorEl.style.display = 'block';
    return;
  }

  const result = await apiPost('/api/services', data);
  if (result.success) {
    closeModal();
    renderPage('services');
  } else {
    errorEl.textContent = result.error || 'Bir hata oluştu';
    errorEl.style.display = 'block';
  }
}

// ===== Edit Service Modal =====
async function openEditServiceModal(serviceId, services) {
  const s = services.find(item => item.id == serviceId);
  if (!s) return;

  const [brands, types, stages, sources, vehicles] = await Promise.all([
    apiGet('/api/settings/brands'),
    apiGet('/api/settings/types'),
    apiGet('/api/settings/stages'),
    apiGet('/api/settings/sources'),
    apiGet('/api/settings/vehicles')
  ]);

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'yönetici';
  const isStaff = currentUser.role === 'personel';
  
  let servicesListHtml = '';
  // Removed admin-only authorized services fetching as per requested refinement

  openModal(`
    <div class="modal-header">
      <h2>Servis Kaydını Düzenle</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-section-title">Genel Bilgiler</div>
        <div class="form-group">
          <label>Servis Kaynağı</label>
          <select id="edit_svc_source" ${isStaff ? 'disabled' : ''}>
            <option value="">Seçiniz...</option>
            ${sources.map(src => `<option value="${src.name}" ${s.service_source === src.name ? 'selected' : ''}>${src.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Durum</label>
          <select id="edit_svc_status">
            ${stages.length > 0 
              ? stages.map(st => `<option value="${st.name}" ${s.status === st.name ? 'selected' : ''}>${st.name}</option>`).join('')
              : `
                <option value="Beklemede" ${s.status === 'Beklemede' ? 'selected' : ''}>Beklemede</option>
                <option value="Devam Ediyor" ${s.status === 'Devam Ediyor' ? 'selected' : ''}>Devam Ediyor</option>
                <option value="Tamamlandı" ${s.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                <option value="İptal" ${s.status === 'İptal' ? 'selected' : ''}>İptal</option>
              `
            }
          </select>
        </div>
        <div class="form-group">
          <label>Servis Aracı</label>
          <select id="edit_svc_vehicle" ${isStaff ? 'disabled' : ''}>
            <option value="">Seçiniz...</option>
            ${vehicles.map(v => `<option value="${v.name}" ${s.service_vehicle === v.name ? 'selected' : ''}>${v.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-section-title">Cihaz Bilgileri</div>
        <div class="form-group">
          <label>Cihaz Markası</label>
          <select id="edit_svc_device_brand" ${isStaff ? 'disabled' : ''}>
            <option value="">Seçiniz...</option>
            ${brands.map(b => `<option value="${b.name}" ${s.device_brand === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
            ${s.device_brand && !brands.find(b => b.name === s.device_brand) ? `<option value="${s.device_brand}" selected>${s.device_brand}</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label>Cihaz Türü</label>
          <select id="edit_svc_device_type" ${isStaff ? 'disabled' : ''}>
            <option value="">Seçiniz...</option>
            ${types.map(t => `<option value="${t.name}" ${s.device_type === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}
            ${s.device_type && !types.find(t => t.name === s.device_type) ? `<option value="${s.device_type}" selected>${s.device_type}</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label>Cihaz Modeli</label>
          <input type="text" id="edit_svc_device_model" value="${s.device_model || ''}" ${isStaff ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label>Garanti Süresi</label>
          <input type="text" id="edit_svc_warranty_period" value="${s.warranty_period || ''}" ${isStaff ? 'readonly' : ''}>
        </div>
        <div class="form-group full-width">
          <label>Cihaz Arızası</label>
          <textarea id="edit_svc_device_fault" ${isStaff ? 'readonly' : ''}>${s.device_fault || ''}</textarea>
        </div>
        
        <div class="form-section-title">Randevu Bilgileri</div>
        <div class="form-group">
          <label>Müsait Olma Tarihi</label>
          <input type="date" id="edit_svc_availability_date" value="${s.availability_date || ''}" ${isStaff ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label>Saat Başlangıç</label>
          <input type="time" id="edit_svc_time_start" value="${s.time_start || ''}" ${isStaff ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label>Saat Bitiş</label>
          <input type="time" id="edit_svc_time_end" value="${s.time_end || ''}" ${isStaff ? 'readonly' : ''}>
        </div>

        <div class="form-section-title">Notlar</div>
        <div class="form-group full-width">
          <label>Operatör Notu</label>
          <textarea id="edit_svc_operator_note" ${isStaff ? 'readonly' : ''}>${s.operator_note || ''}</textarea>
        </div>
      </div>
      <div id="edit_svc_error" class="error-message" style="display:none;margin-top:1rem;"></div>
      ${isStaff ? '<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem;">Not: Personel yetkisiyle sadece durum bilgisini değiştirebilirsiniz.</p>' : ''}
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn-primary" id="saveEditServiceBtn">Kaydet</button>
    </div>
  `);

  document.getElementById('saveEditServiceBtn').addEventListener('click', async () => {
    const errorEl = document.getElementById('edit_svc_error');
    errorEl.style.display = 'none';

    let data = {
      status: document.getElementById('edit_svc_status').value
    };

    if (isAdmin || isManager) {
      data = {
        ...data,
        device_brand: document.getElementById('edit_svc_device_brand').value.trim(),
        device_type: document.getElementById('edit_svc_device_type').value.trim(),
        device_model: document.getElementById('edit_svc_device_model').value.trim(),
        device_fault: document.getElementById('edit_svc_device_fault').value.trim(),
        operator_note: document.getElementById('edit_svc_operator_note').value.trim(),
        warranty_period: document.getElementById('edit_svc_warranty_period').value.trim(),
        availability_date: document.getElementById('edit_svc_availability_date').value,
        time_start: document.getElementById('edit_svc_time_start').value,
        time_end: document.getElementById('edit_svc_time_end').value,
        service_source: document.getElementById('edit_svc_source').value,
        service_vehicle: document.getElementById('edit_svc_vehicle').value
      };
      
    }

    const result = await apiPut(`/api/services/${serviceId}`, data);
    if (result.success) {
      closeModal();
      renderPage('services');
    } else {
      errorEl.textContent = result.error || 'Bir hata oluştu';
      errorEl.style.display = 'block';
    }
  });
}

// ===== CUSTOMERS PAGE =====
async function renderCustomersPage(container) {
  const customers = await apiGet('/api/customers');

  let authServiceFilterHtml = '';
  // Removed admin-only authorized services filter as per requested refinement

  container.innerHTML = `
    <div class="page-header">
      <h1>Müşteriler</h1>
      <div class="page-header-actions">
        <div class="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="customerSearchInput" placeholder="Müşteri ara...">
        </div>
        ${authServiceFilterHtml}
        <button class="btn-primary" id="newCustomerBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Yeni Müşteri
        </button>
      </div>
    </div>

    <div class="table-container">
      ${customers.length === 0 ? `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <h3>Henüz müşteri kaydı yok</h3>
          <p>Yeni müşteri eklemek için yukarıdaki butonu kullanın</p>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Eklenme Tarihi</th>
              <th>Müşteri Adı</th>
              <th>Telefon</th>
              <th>İl / İlçe</th>
              <th>Adres</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody id="customersTableBody">
            ${customers.map(c => `
              <tr data-id="${c.id}" data-name="${(c.full_name || '').toLowerCase()}">
                <td><small>#${c.id}</small></td>
                <td>${formatDate(c.created_at)}</td>
                <td>${c.full_name || '-'}</td>
                <td>${c.phone || '-'}</td>
                <td>${[c.city, c.district].filter(Boolean).join(' / ') || '-'}</td>
                <td>${c.address || '-'}</td>
                <td>
                  <button class="btn-danger btn-sm delete-customer-btn" data-id="${c.id}">Sil</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;

  // Filter Function
  const filterCustomers = () => {
    const q = document.getElementById('customerSearchInput').value.toLowerCase().trim();
    
    document.querySelectorAll('#customersTableBody tr').forEach(tr => {
      const id = tr.dataset.id;
      const name = tr.dataset.name;
      
      const matchesSearch = !q || id.includes(q) || name.includes(q) || `#${id}`.includes(q);
      
      tr.style.display = matchesSearch ? '' : 'none';
    });
  };

  document.getElementById('customerSearchInput')?.addEventListener('input', filterCustomers);
  

  // New customer
  document.getElementById('newCustomerBtn')?.addEventListener('click', openNewCustomerModal);

  // Delete
  document.querySelectorAll('.delete-customer-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/customers/${btn.dataset.id}`);
        renderCustomersPage(container);
      }
    });
  });
}

async function openNewCustomerModal() {

  openModal(`
    <div class="modal-header">
      <h2>Yeni Müşteri</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Müşteri Tipi</label>
          <select id="cust_customer_type">
            <option value="bireysel">Bireysel</option>
            <option value="kurumsal">Kurumsal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Müşteri Adı *</label>
          <input type="text" id="cust_full_name" placeholder="Ad Soyad" required>
        </div>
        <div class="form-group">
          <label>Telefon</label>
          <input type="tel" id="cust_phone" placeholder="Telefon numarası">
        </div>
        <div class="form-group">
          <label>Telefon 2</label>
          <input type="tel" id="cust_phone2" placeholder="Alternatif telefon">
        </div>
        <div class="form-group">
          <label>İl</label>
          <input type="text" id="cust_city" placeholder="İl">
        </div>
        <div class="form-group">
          <label>İlçe</label>
          <input type="text" id="cust_district" placeholder="İlçe">
        </div>
        <div class="form-group full-width">
          <label>Adres</label>
          <textarea id="cust_address" placeholder="Açık adres"></textarea>
        </div>
        <div class="form-group">
          <label>Kimlik No</label>
          <input type="text" id="cust_id_number" placeholder="TC Kimlik No">
        </div>
      </div>
      <div id="cust_error" class="error-message" style="display:none;margin-top:1rem;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn-primary" id="saveCustomerBtn">Kaydet</button>
    </div>
  `);

  document.getElementById('saveCustomerBtn').addEventListener('click', async () => {
    const errorEl = document.getElementById('cust_error');
    errorEl.style.display = 'none';

    const data = {
      customer_type: document.getElementById('cust_customer_type').value,
      full_name: document.getElementById('cust_full_name').value.trim(),
      phone: document.getElementById('cust_phone').value.trim(),
      phone2: document.getElementById('cust_phone2').value.trim(),
      city: document.getElementById('cust_city').value.trim(),
      district: document.getElementById('cust_district').value.trim(),
      address: document.getElementById('cust_address').value.trim(),
      id_number: document.getElementById('cust_id_number').value.trim()
    };

    

    if (!data.full_name) {
      errorEl.textContent = 'Müşteri adı gereklidir';
      errorEl.style.display = 'block';
      return;
    }

    const result = await apiPost('/api/customers', data);
    if (result.success) {
      closeModal();
      renderPage('customers');
    } else {
      errorEl.textContent = result.error || 'Bir hata oluştu';
      errorEl.style.display = 'block';
    }
  });
}

// ===== PERSONNEL PAGE =====
async function renderPersonnelPage(container) {
  const personnel = await apiGet('/api/personnel');

  let authServiceFilterHtml = '';
  // Removed admin-only authorized services filter as per requested refinement

  container.innerHTML = `
    <div class="page-header">
      <h1>Personeller</h1>
      <div class="page-header-actions">
        <div class="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="personnelSearchInput" placeholder="ID veya Personel Ara...">
        </div>
        <div class="filter-group">
          <select id="roleFilter" class="filter-select">
            <option value="">Tüm Yetkiler</option>
            <option value="admin">Sistem Yöneticisi</option>
            <option value="yönetici">Hizmet Yöneticisi</option>
            <option value="personel">Saha Personeli</option>
          </select>
        </div>
        ${authServiceFilterHtml}
        <button class="btn-primary" id="newPersonnelBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Yeni Personel
        </button>
      </div>
    </div>

    <div class="table-container">
      ${personnel.length === 0 ? `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <h3>Henüz personel kaydı yok</h3>
          <p>Yeni personel eklemek için yukarıdaki butonu kullanın</p>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th></th>
              <th>Ad Soyad</th>
              <th>Pozisyon</th>
              <th>Başlama Tarihi</th>
              <th>Telefon</th>
              <th>E-posta</th>
              <th>Kullanıcı Adı</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody id="personnelTableBody">
            ${personnel.map(p => `
              <tr data-id="${p.id}" data-name="${(p.full_name || '').toLowerCase()}" data-role="${p.role}">
                <td><small>#${p.id}</small></td>
                <td>
                  <div class="personnel-avatar">
                    ${p.profile_picture 
                      ? `<img src="${p.profile_picture}" alt="${p.full_name}">` 
                      : `<span>${(p.full_name || '?').charAt(0).toUpperCase()}</span>`
                    }
                  </div>
                </td>
                <td>${p.full_name}</td>
                <td>${p.position || '-'}</td>
                <td>${formatDate(p.start_date)}</td>
                <td>${p.phone || '-'}</td>
                <td>${p.email || '-'}</td>
                <td>${p.username}</td>
                <td>
                  <div style="display:flex;gap:0.25rem;">
                    ${currentUser.role === 'admin' ? `
                      <button class="btn-icon edit-personnel-btn" data-id="${p.id}" title="Düzenle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    ` : ''}
                    ${p.role !== 'admin' ? `
                      <button class="btn-icon delete-personnel-btn" data-id="${p.id}" title="Sil">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    ` : '<span class="badge badge-done" style="font-size:0.7rem;">Admin</span>'}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;

  // Filter Function
  const filterPersonnel = () => {
    const searchTerm = document.getElementById('personnelSearchInput').value.toLowerCase().trim();
    const roleFilter = document.getElementById('roleFilter').value;
    
    document.querySelectorAll('#personnelTableBody tr').forEach(tr => {
      const id = tr.dataset.id;
      const name = tr.dataset.name;
      const role = tr.dataset.role;
      
      const matchesSearch = !searchTerm || id.includes(searchTerm) || name.includes(searchTerm) || `#${id}`.includes(searchTerm);
      const matchesRole = !roleFilter || role === roleFilter;
      
      tr.style.display = (matchesSearch && matchesRole) ? '' : 'none';
    });
  };

  document.getElementById('personnelSearchInput')?.addEventListener('input', filterPersonnel);
  document.getElementById('roleFilter')?.addEventListener('change', filterPersonnel);

  document.getElementById('newPersonnelBtn')?.addEventListener('click', openNewPersonnelModal);

  document.querySelectorAll('.edit-personnel-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditPersonnelModal(btn.dataset.id, personnel));
  });

  document.querySelectorAll('.delete-personnel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/personnel/${btn.dataset.id}`);
        renderPersonnelPage(container);
      }
    });
  });
}

async function openNewPersonnelModal() {
  let servicesListHtml = '';
  // Removed admin-only authorized services fetching as per requested refinement

  openModal(`
    <div class="modal-header">
      <h2>Yeni Personel</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="profile-upload-section">
        <div class="profile-preview" id="pers_pic_preview">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="profile-upload-info">
          <label class="btn-secondary btn-sm" style="cursor:pointer;">
            Fotoğraf Seç
            <input type="file" id="pers_profile_pic" accept="image/*" style="display:none;">
          </label>
          <p>JPG, PNG - Max 2MB</p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-section-title">Kişisel Bilgiler</div>
        ${servicesListHtml}
        <div class="form-group">
          <label>Ad Soyad *</label>
          <input type="text" id="pers_full_name" placeholder="Ad Soyad" required>
        </div>
        <div class="form-group">
          <label>Pozisyon</label>
          <input type="text" id="pers_position" placeholder="Pozisyon">
        </div>
        <div class="form-group">
          <label>Başlama Tarihi</label>
          <input type="date" id="pers_start_date">
        </div>
        <div class="form-group">
          <label>Telefon</label>
          <input type="tel" id="pers_phone" placeholder="Telefon">
        </div>
        <div class="form-group">
          <label>Telefon 2</label>
          <input type="tel" id="pers_phone2" placeholder="Alternatif telefon">
        </div>
        <div class="form-group">
          <label>İl</label>
          <input type="text" id="pers_city" placeholder="İl">
        </div>
        <div class="form-group">
          <label>İlçe</label>
          <input type="text" id="pers_district" placeholder="İlçe">
        </div>
        <div class="form-group full-width">
          <label>Adres</label>
          <textarea id="pers_address" placeholder="Açık adres"></textarea>
        </div>
        <div class="form-group">
          <label>E-posta</label>
          <input type="email" id="pers_email" placeholder="E-posta">
        </div>
        <div class="form-group">
          <label>Kimlik No</label>
          <input type="text" id="pers_id_number" placeholder="TC Kimlik No">
        </div>

        <div class="form-section-title">Giriş Bilgileri ve Yetki</div>
        <div class="form-group">
          <label>Kullanıcı Adı *</label>
          <input type="text" id="pers_username" placeholder="Kullanıcı adı" required>
        </div>
        <div class="form-group">
          <label>Şifre *</label>
          <input type="password" id="pers_password" placeholder="Şifre" required>
        </div>
        <div class="form-group">
          <label>Yetki / Rol *</label>
          <select id="pers_role" required>
            <option value="personel">Saha Personeli</option>
            ${currentUser.role === 'admin' ? '<option value="yönetici">Hizmet Yöneticisi</option>' : ''}
            ${currentUser.role === 'admin' ? '<option value="admin">Sistem Yöneticisi</option>' : ''}
          </select>
        </div>
      </div>
      <div id="pers_error" class="error-message" style="display:none;margin-top:1rem;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn-primary" id="savePersonnelBtn">Kaydet</button>
    </div>
  `);

  // Image preview
  document.getElementById('pers_profile_pic').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('pers_pic_preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      }
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('savePersonnelBtn').addEventListener('click', async () => {
    const errorEl = document.getElementById('pers_error');
    errorEl.style.display = 'none';

    try {
      const formData = new FormData();
      formData.append('full_name', document.getElementById('pers_full_name')?.value.trim() || '');
      formData.append('position', document.getElementById('pers_position')?.value.trim() || '');
      formData.append('start_date', document.getElementById('pers_start_date')?.value || '');
      formData.append('phone', document.getElementById('pers_phone')?.value.trim() || '');
      formData.append('phone2', document.getElementById('pers_phone2')?.value.trim() || '');
      formData.append('city', document.getElementById('pers_city')?.value.trim() || '');
      formData.append('district', document.getElementById('pers_district')?.value.trim() || '');
      formData.append('address', document.getElementById('pers_address')?.value.trim() || '');
      formData.append('email', document.getElementById('pers_email')?.value.trim() || '');
      formData.append('id_number', document.getElementById('pers_id_number')?.value.trim() || '');
      formData.append('username', document.getElementById('pers_username')?.value.trim() || '');
      formData.append('password', document.getElementById('pers_password')?.value || '');
      formData.append('role', document.getElementById('pers_role')?.value || 'personel');

      const serviceEl = document.getElementById('pers_service_id');
      if (serviceEl) {
        formData.append('service_id', serviceEl.value || '');
      }

      const fileInput = document.getElementById('pers_profile_pic');
      if (fileInput.files[0]) {
        formData.append('profile_picture', fileInput.files[0]);
      }

      if (!formData.get('full_name') || !formData.get('username') || !formData.get('password')) {
        errorEl.textContent = 'Ad, kullanıcı adı ve şifre alanları zorunludur';
        errorEl.style.display = 'block';
        return;
      }

      const result = await apiPost('/api/personnel', formData);
      if (result.success) {
        closeModal();
        renderPage('personnel');
      } else {
        errorEl.textContent = result.error || 'Bir hata oluştu';
        errorEl.style.display = 'block';
      }
    } catch (err) {
      console.error('Personnel save error:', err);
      errorEl.textContent = 'Bir hata oluştu. Lütfen konsolu kontrol edin.';
      errorEl.style.display = 'block';
    }
  });
}

// ===== Edit Personnel Modal =====
async function openEditPersonnelModal(personnelId, personnelList) {
  const p = personnelList.find(item => item.id == personnelId);
  if (!p) return;

  // Removed admin-only authorized services fetching as per requested refinement

  openModal(`
    <div class="modal-header">
      <h2>Personel Düzenle</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="profile-upload-section">
        <div class="profile-preview" id="edit_pers_pic_preview">
          ${p.profile_picture 
            ? `<img src="${p.profile_picture}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` 
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
          }
        </div>
        <div class="profile-upload-info">
          <label class="btn-secondary btn-sm" style="cursor:pointer;">
            Değiştir
            <input type="file" id="edit_pers_profile_pic" accept="image/*" style="display:none;">
          </label>
          <p>JPG, PNG - Max 2MB</p>
        </div>
      </div>

        <div class="form-section-title">Kişisel Bilgiler</div>
        <div class="form-group">
          <label>Ad Soyad *</label>
          <input type="text" id="edit_pers_full_name" value="${p.full_name || ''}" required>
        </div>
        <div class="form-group">
          <label>Pozisyon</label>
          <input type="text" id="edit_pers_position" value="${p.position || ''}">
        </div>
        <div class="form-group">
          <label>Başlama Tarihi</label>
          <input type="date" id="edit_pers_start_date" value="${p.start_date || ''}">
        </div>
        <div class="form-group">
          <label>Telefon</label>
          <input type="tel" id="edit_pers_phone" value="${p.phone || ''}">
        </div>
        <div class="form-group">
          <label>Telefon 2</label>
          <input type="tel" id="edit_pers_phone2" value="${p.phone2 || ''}">
        </div>
        <div class="form-group">
          <label>İl</label>
          <input type="text" id="edit_pers_city" value="${p.city || ''}">
        </div>
        <div class="form-group">
          <label>İlçe</label>
          <input type="text" id="edit_pers_district" value="${p.district || ''}">
        </div>
        <div class="form-group full-width">
          <label>Adres</label>
          <textarea id="edit_pers_address">${p.address || ''}</textarea>
        </div>
        <div class="form-group">
          <label>E-posta</label>
          <input type="email" id="edit_pers_email" value="${p.email || ''}">
        </div>
        <div class="form-group">
          <label>Kimlik No</label>
          <input type="text" id="edit_pers_id_number" value="${p.id_number || ''}">
        </div>

        <div class="form-section-title">Giriş Bilgileri ve Yetki</div>
        <div class="form-group">
          <label>Kullanıcı Adı *</label>
          <input type="text" id="edit_pers_username" value="${p.username || ''}" required>
        </div>
        <div class="form-group">
          <label>Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
          <input type="password" id="edit_pers_password" placeholder="Yeni şifre">
        </div>
        <div class="form-group">
          <label>Yetki / Rol</label>
          <select id="edit_pers_role" ${currentUser.role !== 'admin' ? 'disabled' : ''}>
            <option value="personel" ${p.role === 'personel' ? 'selected' : ''}>Saha Personeli</option>
            <option value="yönetici" ${p.role === 'yönetici' ? 'selected' : ''}>Hizmet Yöneticisi</option>
            <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>Sistem Yöneticisi</option>
          </select>
        </div>
      </div>
      <div id="edit_pers_error" class="error-message" style="display:none;margin-top:1rem;"></div>
      ${currentUser.role !== 'admin' ? '<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem;">Not: Rol ve servis değişikliği sadece sistem yöneticisi tarafından yapılabilir.</p>' : ''}
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">İptal</button>
      <button class="btn-primary" id="saveEditPersonnelBtn">Kaydet</button>
    </div>
  `);

  // Image preview
  document.getElementById('edit_pers_profile_pic').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('edit_pers_pic_preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      }
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('saveEditPersonnelBtn').addEventListener('click', async () => {
    const errorEl = document.getElementById('edit_pers_error');
    errorEl.style.display = 'none';

    try {
      const formData = new FormData();
      formData.append('service_id', document.getElementById('edit_pers_service_id')?.value || '');
      formData.append('full_name', document.getElementById('edit_pers_full_name')?.value.trim() || '');
      formData.append('position', document.getElementById('edit_pers_position')?.value.trim() || '');
      formData.append('start_date', document.getElementById('edit_pers_start_date')?.value || '');
      formData.append('phone', document.getElementById('edit_pers_phone')?.value.trim() || '');
      formData.append('phone2', document.getElementById('edit_pers_phone2')?.value.trim() || '');
      formData.append('city', document.getElementById('edit_pers_city')?.value.trim() || '');
      formData.append('district', document.getElementById('edit_pers_district')?.value.trim() || '');
      formData.append('address', document.getElementById('edit_pers_address')?.value.trim() || '');
      formData.append('email', document.getElementById('edit_pers_email')?.value.trim() || '');
      formData.append('id_number', document.getElementById('edit_pers_id_number')?.value.trim() || '');
      formData.append('username', document.getElementById('edit_pers_username')?.value.trim() || '');
      formData.append('password', document.getElementById('edit_pers_password')?.value || '');
      formData.append('role', document.getElementById('edit_pers_role')?.value || p.role);

      const fileInput = document.getElementById('edit_pers_profile_pic');
      if (fileInput.files[0]) {
        formData.append('profile_picture', fileInput.files[0]);
      }

      if (!formData.get('full_name') || !formData.get('username')) {
        errorEl.textContent = 'Ad ve kullanıcı adı alanları zorunludur';
        errorEl.style.display = 'block';
        return;
      }

      const result = await apiPut(`/api/personnel/${personnelId}`, formData);
      if (result.success) {
        closeModal();
        renderPage('personnel');
      } else {
        errorEl.textContent = result.error || 'Bir hata oluştu';
        errorEl.style.display = 'block';
      }
    } catch (err) {
      console.error('Edit personnel save error:', err);
      errorEl.textContent = 'Bir hata oluştu. Lütfen konsolu kontrol edin.';
      errorEl.style.display = 'block';
    }
  });
}



// ===== SETTINGS PAGE =====
async function renderSettingsPage(container) {
  if (currentUser.role === 'personel') {
    container.innerHTML = '<div class="error-state"><h1>Yetkiniz yok</h1><p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p></div>';
    return;
  }
  const brands = await apiGet('/api/settings/brands');
  const types = await apiGet('/api/settings/types');
  const stages = await apiGet('/api/settings/stages');
  const sources = await apiGet('/api/settings/sources');
  const vehicles = await apiGet('/api/settings/vehicles');

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'yönetici';

  container.innerHTML = `
    <div class="page-header">
      <h1>Ayarlar</h1>
    </div>

    <div class="settings-hub">
      <div class="settings-group-premium">
        <label class="group-label">Servis Tanımlamaları</label>
        <div class="category-grid">
          ${isAdmin ? `
            <!-- Cihaz Markaları Card -->
            <div class="category-card" onclick="this.classList.toggle('active')">
              <div class="card-info">
                <div class="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div class="details">
                  <h3>Cihaz Markaları</h3>
                  <p>${brands.length} Tanımlı</p>
                </div>
                <div class="chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="card-content" onclick="event.stopPropagation()">
                <ul class="settings-list compact">
                  ${brands.map(b => `
                    <li class="list-item">
                      <span>${b.name}</span>
                      ${isAdmin ? `
                        <button class="btn-icon delete-brand-btn" data-id="${b.id}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      ` : ''}
                    </li>
                  `).join('')}
                </ul>
                ${isAdmin ? `
                  <div class="settings-add-form mini">
                    <input type="text" id="newBrandName" placeholder="Yeni marka adı">
                    <button class="btn-primary btn-sm" id="addBrandBtn">Ekle</button>
                  </div>
                ` : '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;text-align:center;">Sadece görüntüleme yetkiniz var.</p>'}
              </div>
            </div>

            <!-- Cihaz Türleri Card -->
            <div class="category-card" onclick="this.classList.toggle('active')">
              <div class="card-info">
                <div class="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div class="details">
                  <h3>Cihaz Türleri</h3>
                  <p>${types.length} Tanımlı</p>
                </div>
                <div class="chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="card-content" onclick="event.stopPropagation()">
                <ul class="settings-list compact">
                  ${types.map(t => `
                    <li class="list-item">
                      <span>${t.name}</span>
                      ${isAdmin ? `
                        <button class="btn-icon delete-type-btn" data-id="${t.id}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      ` : ''}
                    </li>
                  `).join('')}
                </ul>
                ${isAdmin ? `
                  <div class="settings-add-form mini">
                    <input type="text" id="newTypeName" placeholder="Yeni cihaz türü">
                    <button class="btn-primary btn-sm" id="addTypeBtn">Ekle</button>
                  </div>
                ` : '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;text-align:center;">Sadece görüntüleme yetkiniz var.</p>'}
              </div>
            </div>

            <!-- Servis Kaynakları Card -->
            <div class="category-card" onclick="this.classList.toggle('active')">
              <div class="card-info">
                <div class="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div class="details">
                  <h3>Servis Kaynakları</h3>
                  <p>${sources.length} Tanımlı</p>
                </div>
                <div class="chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="card-content" onclick="event.stopPropagation()">
                <ul class="settings-list compact">
                  ${sources.map(s => `
                    <li class="list-item">
                      <span>${s.name}</span>
                      ${isAdmin ? `
                        <button class="btn-icon delete-source-btn" data-id="${s.id}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      ` : ''}
                    </li>
                  `).join('')}
                </ul>
                ${isAdmin ? `
                  <div class="settings-add-form mini">
                    <input type="text" id="newSourceName" placeholder="Yeni servis kaynağı">
                    <button class="btn-primary btn-sm" id="addSourceBtn">Ekle</button>
                  </div>
                ` : '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;text-align:center;">Sadece görüntüleme yetkiniz var.</p>'}
              </div>
            </div>

            <!-- Servis Aşamaları Card -->
            <div class="category-card" onclick="this.classList.toggle('active')">
              <div class="card-info">
                <div class="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 8v8"/></svg>
                </div>
                <div class="details">
                  <h3>Servis Aşamaları</h3>
                  <p>${stages.length} Tanımlı</p>
                </div>
                <div class="chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="card-content" onclick="event.stopPropagation()">
                <ul class="settings-list compact">
                  ${stages.map(s => `
                    <li class="list-item">
                      <span>${s.name}</span>
                      ${isAdmin ? `
                        <button class="btn-icon delete-stage-btn" data-id="${s.id}">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      ` : ''}
                    </li>
                  `).join('')}
                </ul>
                ${isAdmin ? `
                  <div class="settings-add-form mini">
                    <input type="text" id="newStageName" placeholder="Yeni servis aşaması">
                    <button class="btn-primary btn-sm" id="addStageBtn">Ekle</button>
                  </div>
                ` : '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;text-align:center;">Sadece görüntüleme yetkiniz var.</p>'}
              </div>
            </div>
          ` : ''}

          <!-- Servis Araçları Card -->
          <div class="category-card" onclick="this.classList.toggle('active')">
            <div class="card-info">
              <div class="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <div class="details">
                <h3>Servis Araçları</h3>
                <p>${vehicles.length} Tanımlı</p>
              </div>
              <div class="chevron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            <div class="card-content" onclick="event.stopPropagation()">
              <ul class="settings-list compact">
                ${vehicles.map(v => `
                  <li class="list-item">
                    <span>${v.name}</span>
                    ${(isAdmin || isManager) ? `
                      <button class="btn-icon delete-vehicle-btn" data-id="${v.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    ` : ''}
                  </li>
                `).join('')}
              </ul>
              ${(isAdmin || isManager) ? `
                <div class="settings-add-form mini">
                  <input type="text" id="newVehicleName" placeholder="Yeni araç adı/plaka">
                  <button class="btn-primary btn-sm" id="addVehicleBtn">Ekle</button>
                </div>
              ` : '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;text-align:center;">Sadece görüntüleme yetkiniz var.</p>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add Brand
  document.getElementById('addBrandBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newBrandName');
    const name = input.value.trim();
    if (!name) return;
    await apiPost('/api/settings/brands', { name });
    renderSettingsPage(container);
  });

  // Delete Brand
  document.querySelectorAll('.delete-brand-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu markayı silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/settings/brands/${btn.dataset.id}`);
        renderSettingsPage(container);
      }
    });
  });

  // Add Type
  document.getElementById('addTypeBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newTypeName');
    const name = input.value.trim();
    if (!name) return;
    await apiPost('/api/settings/types', { name });
    renderSettingsPage(container);
  });

  document.querySelectorAll('.delete-type-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu türü silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/settings/types/${btn.dataset.id}`);
        renderSettingsPage(container);
      }
    });
  });

  // Add Stage
  document.getElementById('addStageBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newStageName');
    const name = input.value.trim();
    if (!name) return;
    await apiPost('/api/settings/stages', { name });
    renderSettingsPage(container);
  });

  // Delete Stage
  document.querySelectorAll('.delete-stage-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu aşamayı silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/settings/stages/${btn.dataset.id}`);
        renderSettingsPage(container);
      }
    });
  });

  // Add Source
  document.getElementById('addSourceBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newSourceName');
    const name = input.value.trim();
    if (!name) return;
    await apiPost('/api/settings/sources', { name });
    renderSettingsPage(container);
  });

  // Delete Source
  document.querySelectorAll('.delete-source-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu kaynağı silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/settings/sources/${btn.dataset.id}`);
        renderSettingsPage(container);
      }
    });
  });

  // Add Vehicle
  document.getElementById('addVehicleBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newVehicleName');
    const name = input.value.trim();
    if (!name) return;
    await apiPost('/api/settings/vehicles', { name });
    renderSettingsPage(container);
  });

  // Delete Vehicle
  document.querySelectorAll('.delete-vehicle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu aracı silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/settings/vehicles/${btn.dataset.id}`);
        renderSettingsPage(container);
      }
    });
  });
}
