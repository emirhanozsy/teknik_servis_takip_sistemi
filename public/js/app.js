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
    'admin': 'Patron',
    'yönetici': 'Hizmet Yöneticisi',
    'personel': 'Saha Personeli'
  };
  document.getElementById('userRole').textContent = currentUser.title || roleMap[currentUser.role] || (currentUser.service_name || 'Personel');
  
  const avatarEl = document.getElementById('userAvatar');
  if (currentUser.profile_picture) {
    avatarEl.innerHTML = `<img src="${currentUser.profile_picture}" alt="${currentUser.full_name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
  } else {
    avatarEl.textContent = currentUser.full_name.charAt(0).toUpperCase();
  }

  // Permissions-based UI Enforcement
  applyPermissions();

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
  renderPage('home');
}

function hasPermission(module, level = 'view') {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  if (!currentUser.permissions) return false;

  const userPerm = currentUser.permissions[module];
  if (!userPerm || userPerm === 'none') return false;

  // Specific logic for different modules
  if (module === 'all_services_view') {
    if (level === 'all') return userPerm === 'all';
    if (level === 'own') return userPerm === 'own' || userPerm === 'all';
    return userPerm !== 'none';
  }

  if (module === 'customer_edit' || module === 'personnel_edit') {
    if (level === 'edit') return userPerm === 'edit';
    if (level === 'view') return userPerm === 'view' || userPerm === 'edit';
    return false;
  }

  if (module === 'finance_view') {
    if (level === 'view') return ['view', 'expense', 'view_only'].includes(userPerm);
    if (level === 'expense') return userPerm === 'expense' || userPerm === 'view';
    if (level === 'view_only') return userPerm === 'view_only';
    return false;
  }

  // Boolean-like permissions (stock_view, settings_view, delete_service, delete_service_action)
  if (level === 'yes' || level === 'view' || level === 'all') return userPerm === 'yes' || userPerm === 'view' || userPerm === 'all';
  
  return false;
}

function applyPermissions() {
  if (!currentUser) return;

  // Sidebar visibility
  const navPersonnel = document.querySelector('.nav-item[data-page="personnel"]');
  if (navPersonnel && !hasPermission('personnel_edit', 'view')) {
    navPersonnel.style.display = 'none';
  }

  const navSettings = document.querySelector('.nav-item[data-page="settings"]');
  if (navSettings && !hasPermission('settings_view')) {
    navSettings.style.display = 'none';
  }

  // Example for finance if it existed in sidebar
  const navFinance = document.querySelector('.nav-item[data-page="finance"]');
  if (navFinance && !hasPermission('finance_view', 'view')) {
    navFinance.style.display = 'none';
  }
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
        ${hasPermission('finance_view', 'view') ? `
        <div class="stat-row">
          <span class="stat-label">Kasa Durumu</span>
          <span class="stat-value">${(stats.cash || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
        </div>
        ` : ''}
      </div>
      <div class="dashboard-profile-side">
        <div class="dashboard-avatar">
          ${avatarHtml}
        </div>
        <div class="dashboard-user-info">
          <div class="dashboard-user-name">${currentUser.full_name}</div>
          <div class="dashboard-user-role">${currentUser.title || roleMap[currentUser.role] || 'Personel'}</div>
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
    'aaa beklemede': 'badge-waiting',
    'Devam Ediyor': 'badge-progress',
    'Tamamlandı': 'badge-done',
    'İptal': 'badge-cancelled',
    'İade Edildi': 'badge-cancelled',
    'Müşteri İptal Etti': 'badge-cancelled'
  };
  // Normalize key for map
  const key = Object.keys(map).find(k => k.toLowerCase() === (status || '').toLowerCase());
  return `<span class="badge ${map[key] || 'badge-default'}">${status || 'Beklemede'}</span>`;
}

function openModal(html, wide = false) {
  const modal = document.getElementById('modalContent');
  modal.innerHTML = html;
  if (wide) modal.classList.add('wide');
  else modal.classList.remove('wide');
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.getElementById('modalContent').classList.remove('wide');
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
  const waitingCount = services.filter(s => s.status === 'AAA BEKLEMEDE').length;
  const doneCount = services.filter(s => s.status === 'Tamamlandı').length;
  const cancelStatuses = ['Müşteri İptal Etti', 'İade Edildi', 'İptal', 'Cihaz Tamir Edilemiyor'];
  const cancelCount = services.filter(s => cancelStatuses.includes(s.status)).length;
  const progressCount = totalCount - (waitingCount + doneCount + cancelCount);

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
      <div class="stat-card danger">
        <div class="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div class="stat-label">İptal Oldu</div>
        <div class="stat-value">${cancelCount}</div>
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
                    ${hasPermission('delete_service') ? `
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

  // Row Click for Detail (Event Delegation)
  const tableBody = document.getElementById('servicesTableBody');
  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      
      // Don't trigger if clicking buttons or selects
      if (e.target.closest('.btn-icon') || e.target.closest('select') || e.target.closest('button')) return;
      
      const id = tr.dataset.id;
      if (id) openServiceDetailModal(id);
    });
    tableBody.style.cursor = 'pointer';
  }

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
                  ${hasPermission('customer_edit', 'edit') ? `
                    <button class="btn-danger btn-sm delete-customer-btn" data-id="${c.id}">Sil</button>
                  ` : '-'}
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
                <td>
                  ${p.position || '-'}
                  ${p.title ? `<div style="font-size:0.75rem; opacity:0.6; margin-top:2px;">${p.title}</div>` : ''}
                </td>
                <td>${formatDate(p.start_date)}</td>
                <td>${p.phone || '-'}</td>
                <td>${p.email || '-'}</td>
                <td>${p.username}</td>
                <td>
                  <div style="display:flex;gap:0.25rem;">
                    ${hasPermission('personnel_edit', 'edit') ? `
                      <button class="btn-icon edit-personnel-btn" data-id="${p.id}" title="Düzenle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    ` : ''}
                    ${(hasPermission('personnel_edit', 'edit') && p.role !== 'admin') ? `
                      <button class="btn-icon delete-personnel-btn" data-id="${p.id}" title="Sil">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    ` : (p.role === 'admin' ? '<span class="badge badge-done" style="font-size:0.7rem;">Admin</span>' : '')}
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
          <input type="text" id="pers_position" placeholder="Örn: Usta, Kalfa, Sekreter">
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
            <option value="">Yükleniyor...</option>
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

  // Populate roles from positions
  let allPositions = [];
  try {
    allPositions = await apiGet('/api/settings/positions');
    const roleSelect = document.getElementById('pers_role');
    if (roleSelect) {
      roleSelect.innerHTML = '<option value="">Seçiniz</option>';
      allPositions.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        opt.dataset.baseRole = p.base_role;
        roleSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Positions fetch error:', err);
  }

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
      const roleSelect = document.getElementById('pers_role');
      const selectedOption = roleSelect?.options[roleSelect.selectedIndex];
      formData.append('role', selectedOption?.dataset.baseRole || 'personel');
      formData.append('position', document.getElementById('pers_role')?.value || ''); // Position is the select value
      formData.append('title', document.getElementById('pers_position')?.value.trim() || ''); // Using position text as a separate title or just updating position

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
          <input type="text" id="edit_pers_position" value="${p.position_title || p.position || ''}" placeholder="Örn: Usta, Kalfa, Sekreter">
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
          <label>Yetki / Rol *</label>
          <select id="edit_pers_role" required ${currentUser.role !== 'admin' ? 'disabled' : ''}>
            <option value="">Yükleniyor...</option>
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

  // Populate roles from positions
  try {
    const roles = await apiGet('/api/settings/positions');
    const roleSelect = document.getElementById('edit_pers_role');
    if (roleSelect) {
      roleSelect.innerHTML = '<option value="">Seçiniz</option>';
      roles.forEach(pos => {
        const opt = document.createElement('option');
        opt.value = pos.name;
        opt.textContent = pos.name;
        opt.dataset.baseRole = pos.base_role;
        if (pos.name === p.position) opt.selected = true;
        roleSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Positions fetch error:', err);
  }

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
      const roleSelect = document.getElementById('edit_pers_role');
      const selectedOption = roleSelect?.options[roleSelect.selectedIndex];
      formData.append('role', selectedOption?.dataset.baseRole || p.role);
      formData.append('position', document.getElementById('edit_pers_role')?.value || p.position);
      formData.append('title', document.getElementById('edit_pers_position')?.value.trim() || '');

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

// ===== SERVICE DETAIL MODAL =====
async function openServiceDetailModal(id) {
  const service = await apiGet(`/api/services/${id}`);
  if (!service || service.error) {
    console.error('Service load error:', service ? service.error : 'No data');
    return;
  }

  const formatDateWithTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  openModal(`
    <div class="modal-content detail-modal">
      <div class="modal-header">
        <div class="detail-header-top">
          <h1>SERVİS DETAY (#${service.id})</h1>
          <div style="display:flex; gap: 1rem; align-items: center;">
             <button class="btn-icon" title="Yardım"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></button>
             <button class="btn-icon" onclick="closeModal()" style="color:var(--danger)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
          </div>
        </div>
      </div>
      <div class="modal-body">
        <div class="detail-meta-row">
          <div class="detail-meta-item"><strong>Kayıt Tarihi:</strong> ${formatDateWithTime(service.created_at)}</div>
          <div class="detail-meta-item"><strong>Servis Kaynağı:</strong> ${service.service_source || '-'}</div>
          <div class="detail-meta-item"><strong>Operatör:</strong> ${service.personnel_name || '-'}</div>
          <div class="locked-indicator">
            <input type="checkbox" id="lockService" ${service.is_locked ? 'checked' : ''}>
            <label for="lockService">Servisi Kilitle</label>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-section">
            <div class="detail-section-header">
              <span>Müşteri Bilgisi</span>
              <button class="btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></button>
            </div>
            <div class="detail-section-body">
              <table class="info-table">
                <tr><td>Ad</td><td>: ${service.customer_name || '-'}</td></tr>
                <tr><td>Telefon</td><td>: ${service.customer_phone || '-'}</td></tr>
                <tr><td>Adres</td><td>: ${service.customer_address || '-'}</td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid var(--border); margin:0.5rem 0;"></td></tr>
                <tr><td>Müsait Olma Zamanı</td><td>: ${formatDate(service.availability_date)} - ${service.time_start || '00:00'} ile ${service.time_end || '00:00'} Arası</td></tr>
                <tr><td>Operatör Notu</td><td>: ${service.operator_note || '-'}</td></tr>
              </table>
              <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                <select id="redirectPersonnel" style="flex:1; padding:0.4rem;">
                  <option value="">Personel Seçiniz...</option>
                </select>
                <button class="btn-primary btn-sm btn-danger" style="background:var(--danger)">Yönlendir</button>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-header">
              <span>Cihaz Bilgisi</span>
            </div>
            <div class="detail-section-body">
              <table class="info-table">
                <tr><td>Servis Sahibi</td><td>: PORTAL</td></tr>
                <tr><td>Cihaz Markası</td><td>: ${service.device_brand || '-'}</td></tr>
                <tr><td>Cihaz Türü</td><td>: ${service.device_type || '-'}</td></tr>
                <tr><td>Cihaz Modeli</td><td>: ${service.device_model || '-'}</td></tr>
                <tr><td>Cihaz Arızası</td><td>: ${service.device_fault || '-'}</td></tr>
              </table>
              <div style="margin-top:1rem; padding:0.5rem; border:1px solid var(--border); border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:600;">Garanti Bitiş :</span>
                <span style="color:var(--danger); font-weight:700;">${service.warranty_period || 'Garanti Yok'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="status-row-bar">
          <span class="status-label-large">Servis Durumu : <span class="current-status-val" style="color:${(service.status || '').toUpperCase() === 'BEKLEMEDE' ? 'var(--danger)' : 'var(--success)'}">${(service.status || 'BELİRSİZ').toUpperCase()}</span></span>
          <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
            <span class="status-label-large">» Yapılacak İşlemi Seçiniz :</span>
            <select id="newActionSelect" style="flex:1;">
              <option value="">Seçiniz...</option>
              <option value="Servis Alındı">Servis Alındı</option>
              <option value="Parça Bekleniyor">Parça Bekleniyor</option>
              <option value="Onarım Tamamlandı">Onarım Tamamlandı</option>
              <option value="Bilgi Verildi">Bilgi Verildi</option>
            </select>
            <button class="btn-primary btn-sm" id="addActionBtn">Ekle</button>
          </div>
        </div>

        <div class="detail-section" style="margin-bottom:1.5rem;">
          <div class="detail-section-header">İşlem Geçmişi</div>
          <div class="action-history-list" id="actionHistoryList">
            ${service.actions.length === 0 ? '<div style="padding:1rem; color:var(--danger)">Henüz bir işlem yapmadınız.</div>' : ''}
            ${service.actions.map(a => `
              <div class="action-history-item">
                <div class="action-header">
                  <span>${a.personnel_name || 'Sistem'}</span>
                  <span>${formatDateWithTime(a.created_at)}</span>
                </div>
                <div class="action-text">${a.action_text}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-header">
            <span>PARA HAREKETLERİ</span>
            <button class="btn-primary btn-sm" style="background:var(--success)" id="addPaymentBtn">Ödeme Ekle</button>
          </div>
          <div class="payment-section">
            <table class="payment-table">
              <thead>
                <tr>
                  <th>TARİH</th>
                  <th>İŞLEMİ YAPAN</th>
                  <th>TAHSİL EDEN</th>
                  <th>ÖDEME ŞEKLİ</th>
                  <th>ÖDEME DURUMU</th>
                  <th>TUTAR</th>
                  <th>#</th>
                </tr>
              </thead>
              <tbody id="paymentListBody">
                ${service.payments.length === 0 ? '<tr><td colspan="7" style="padding:1rem; color:var(--danger); text-align:center;">Henüz bir para tahsilatı yapmadınız.</td></tr>' : ''}
                ${service.payments.map(p => `
                  <tr>
                    <td>${formatDate(p.created_at)}</td>
                    <td>${p.personnel_name || '-'}</td>
                    <td>-</td>
                    <td>${p.payment_method || '-'}</td>
                    <td><span class="payment-status-paid">${p.payment_status || 'Ödendi'}</span></td>
                    <td style="font-weight:700;">${p.amount.toLocaleString('tr-TR')} TL</td>
                    <td><button class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="display:flex; justify-content:flex-end; margin-top:1.5rem;">
           <button class="btn-primary btn-sm btn-gray" id="addPhotoBtn">Fotoğraf Ekle</button>
        </div>
      </div>
      <div class="modal-detail-footer">
        <a href="#" style="color:var(--danger); font-size:0.85rem; text-decoration:none;">» Servisi Sil</a>
        <div class="detail-btn-group">
          <button class="btn-secondary btn-sm">PDF Fiş</button>
          <button class="btn-secondary btn-sm">SMS Gönder</button>
          <button class="btn-secondary btn-sm">Yazdırmak İçin Kopyala</button>
          <button class="btn-secondary btn-sm">Yazdır</button>
          <button class="btn-primary btn-sm" style="background:var(--success)" id="updateServiceDetailBtn">Servisi Güncelle</button>
        </div>
      </div>
    </div>
  `, true);

  // Event Listeners for Modal
  document.getElementById('addActionBtn').addEventListener('click', async () => {
    const actionText = document.getElementById('newActionSelect').value;
    if (!actionText) return;
    await apiPost(`/api/services/${id}/actions`, { action_text: actionText });
    openServiceDetailModal(id);
  });

  document.getElementById('addPaymentBtn').addEventListener('click', async () => {
    const amount = prompt('Ödeme Tutarı:');
    if (!amount || isNaN(amount)) return;
    await apiPost(`/api/services/${id}/payments`, { 
      amount: parseFloat(amount), 
      payment_method: 'Nakit', 
      payment_status: 'Ödendi',
      description: 'Panelden eklendi'
    });
    openServiceDetailModal(id);
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
  const positions = await apiGet('/api/settings/positions');
  const paymentCategories = await apiGet('/api/settings/payment-categories');
  const paymentMethods = await apiGet('/api/settings/payment-methods');

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'yönetici';

  container.innerHTML = `
    <div class="page-header">
      <h1>Ayarlar</h1>
    </div>

    <div class="settings-hub">
      <div class="settings-group-premium">
        <label class="group-label">Personel Ayarları</label>
        <div class="category-grid">
           <!-- Personel Pozisyonları Card -->
            <div class="category-card" onclick="this.classList.toggle('active')">
              <div class="card-info">
                <div class="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div class="details">
                  <h3>Personel Pozisyonları ve Yetkileri</h3>
                  <p>${positions.length} Tanımlı</p>
                </div>
                <div class="chevron">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div class="card-content" onclick="event.stopPropagation()">
                <ul class="settings-list compact">
                  ${positions.map(p => `
                    <li class="list-item clickable position-item" data-id="${p.id}" title="Yetkileri Düzenle">
                      <div class="list-item-main">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span>${p.name}</span>
                      </div>
                      ${isAdmin ? `
                        <button class="btn-icon delete-position-btn" data-id="${p.id}" onclick="event.stopPropagation()">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      ` : ''}
                    </li>
                  `).join('')}
                </ul>
                ${isAdmin ? `
                  <div class="settings-add-form mini">
                    <input type="text" id="newPositionName" placeholder="Yeni pozisyon adı">
                    <button class="btn-primary btn-sm" id="addPositionBtn">Ekle</button>
                  </div>
                ` : '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;text-align:center;">Sadece görüntüleme yetkiniz var.</p>'}
              </div>
            </div>
        </div>
      </div>

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

      <div class="settings-group-premium">
        <label class="group-label">Kasa Ayarları</label>
        <div class="category-grid">
          <!-- Ödeme Türleri Card -->
          <div class="category-card" onclick="this.classList.toggle('active')">
            <div class="card-info">
              <div class="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div class="details">
                <h3>Ödeme Türleri</h3>
                <p>${paymentCategories.length} Tanımlı</p>
              </div>
              <div class="chevron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            <div class="card-content" onclick="event.stopPropagation()">
              <ul class="settings-list compact">
                ${paymentCategories.map(c => `
                  <li class="list-item clickable payment-category-item" data-id="${c.id}" title="Düzenle">
                    <div class="list-item-main">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      <span>${c.name}</span>
                    </div>
                    ${isAdmin ? `
                      <button class="btn-icon delete-payment-category-btn" data-id="${c.id}" onclick="event.stopPropagation()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    ` : ''}
                  </li>
                `).join('')}
              </ul>
              ${isAdmin ? `
                <div class="settings-add-form mini">
                  <input type="text" id="newPaymentCategoryName" placeholder="Yeni ödeme türü">
                  <button class="btn-primary btn-sm" id="addPaymentCategoryBtn">Ekle</button>
                </div>
              ` : '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;text-align:center;">Sadece görüntüleme yetkiniz var.</p>'}
            </div>
          </div>
          <!-- Ödeme Şekilleri Card -->
          <div class="category-card" onclick="this.classList.toggle('active')">
            <div class="card-info">
              <div class="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div class="details">
                <h3>Ödeme Şekilleri</h3>
                <p>${paymentMethods.length} Tanımlı</p>
              </div>
              <div class="chevron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            <div class="card-content" onclick="event.stopPropagation()">
              <ul class="settings-list compact">
                ${paymentMethods.map(m => `
                  <li class="list-item">
                    <span>${m.name}</span>
                    ${isAdmin ? `
                      <button class="btn-icon delete-payment-method-btn" data-id="${m.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    ` : ''}
                  </li>
                `).join('')}
              </ul>
              ${isAdmin ? `
                <div class="settings-add-form mini">
                  <input type="text" id="newPaymentMethodName" placeholder="Yeni ödeme şekli">
                  <button class="btn-primary btn-sm" id="addPaymentMethodBtn">Ekle</button>
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

  // Add Payment Method
  document.getElementById('addPaymentMethodBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newPaymentMethodName');
    const name = input.value.trim();
    if (!name) return;
    await apiPost('/api/settings/payment-methods', { name });
    renderSettingsPage(container);
  });

  // Delete Payment Method
  document.querySelectorAll('.delete-payment-method-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu ödeme şeklini silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/settings/payment-methods/${btn.dataset.id}`);
        renderSettingsPage(container);
      }
    });
  });

  // Add Payment Category
  document.getElementById('addPaymentCategoryBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newPaymentCategoryName');
    const name = input.value.trim();
    if (!name) return;
    await apiPost('/api/settings/payment-categories', { name });
    renderSettingsPage(container);
  });

  // Delete Payment Category
  document.querySelectorAll('.delete-payment-category-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu ödeme türünü silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/settings/payment-categories/${btn.dataset.id}`);
        renderSettingsPage(container);
      }
    });
  });

  // Edit Payment Category Settings
  document.querySelectorAll('.payment-category-item').forEach(item => {
    item.addEventListener('click', () => openPaymentCategoryModal(item.dataset.id, paymentCategories));
  });

  // Edit Position Permissions
  document.querySelectorAll('.position-item').forEach(item => {
    item.addEventListener('click', () => openPositionPermissionsModal(item.dataset.id, positions, stages));
  });
}

// ===== PAYMENT CATEGORY DETAIL MODAL =====
async function openPaymentCategoryModal(categoryId, categories) {
  const c = categories.find(item => item.id == categoryId);
  if (!c) return;

  openModal(`
    <div class="modal-header glass">
      <div class="header-content">
        <h2 style="margin:0;">Ödeme Türü Güncelle</h2>
      </div>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body modern-scroll" style="padding: 2rem;">
      <div class="form-group-premium" style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
          <label style="width: 120px; font-weight: 600; color: var(--text-secondary);">Tür Adı</label>
          <input type="text" id="edit_pay_cat_name" class="modern-input" style="flex: 1;" value="${c.name}">
        </div>
        
        <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem;">
          <label style="width: 120px; font-weight: 600; color: var(--text-secondary); padding-top: 8px;">Seçenekler</label>
          <div style="flex: 1; display: flex; flex-wrap: wrap; gap: 0.75rem;">
            <label class="chip-checkbox">
              <input type="checkbox" id="cat_ask_description" ${c.ask_description ? 'checked' : ''}>
              <span class="chip-label">
                <span class="chip-circle"></span>
                Açıklama Sor
              </span>
            </label>
            <label class="chip-checkbox">
              <input type="checkbox" id="cat_ask_personnel" ${c.ask_personnel ? 'checked' : ''}>
              <span class="chip-label">
                <span class="chip-circle"></span>
                Personel Sor
              </span>
            </label>
            <label class="chip-checkbox">
              <input type="checkbox" id="cat_ask_service_no" ${c.ask_service_no ? 'checked' : ''}>
              <span class="chip-label">
                <span class="chip-circle"></span>
                Servis No Sor
              </span>
            </label>
            <label class="chip-checkbox">
              <input type="checkbox" id="cat_ask_supplier" ${c.ask_supplier ? 'checked' : ''}>
              <span class="chip-label">
                <span class="chip-circle"></span>
                Tedarikçi Sor
              </span>
            </label>
          </div>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
          <label style="width: 120px; font-weight: 600; color: var(--text-secondary);">Ödemenin Yönü</label>
          <select id="cat_direction" class="auth-select modern" style="flex: 1;">
            <option value="out" ${c.direction === 'out' ? 'selected' : ''}>Giden Ödeme</option>
            <option value="in" ${c.direction === 'in' ? 'selected' : ''}>Gelen Ödeme</option>
          </select>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-left: 120px;">
          <label class="chip-checkbox" style="display: block; width: fit-content;">
            <input type="checkbox" id="cat_is_service_payment" ${c.is_service_payment ? 'checked' : ''}>
            <span class="chip-label" style="width: 100%; justify-content: flex-start;">
              <span class="chip-circle"></span>
              Servis Ödemelerinde Kullanılacak Tür mü?
            </span>
          </label>
          <label class="chip-checkbox" style="display: block; width: fit-content;">
            <input type="checkbox" id="cat_is_stock_payment" ${c.is_stock_payment ? 'checked' : ''}>
            <span class="chip-label" style="width: 100%; justify-content: flex-start;">
              <span class="chip-circle"></span>
              Stok Alımlarında Kullanılacak Tür mü?
            </span>
          </label>
        </div>
      </div>
    </div>
    <div class="modal-footer glass">
      <button class="btn-secondary" onclick="closeModal()">Vazgeç</button>
      <button class="btn-primary" id="savePayCatBtn" style="min-width:120px;">Güncelle</button>
    </div>
  `, true);

  document.getElementById('savePayCatBtn').addEventListener('click', async () => {
    const btn = document.getElementById('savePayCatBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span>';

    const data = {
      name: document.getElementById('edit_pay_cat_name').value,
      ask_description: document.getElementById('cat_ask_description').checked ? 1 : 0,
      ask_personnel: document.getElementById('cat_ask_personnel').checked ? 1 : 0,
      ask_service_no: document.getElementById('cat_ask_service_no').checked ? 1 : 0,
      ask_supplier: document.getElementById('cat_ask_supplier').checked ? 1 : 0,
      direction: document.getElementById('cat_direction').value,
      is_service_payment: document.getElementById('cat_is_service_payment').checked ? 1 : 0,
      is_stock_payment: document.getElementById('cat_is_stock_payment').checked ? 1 : 0
    };

    try {
      const result = await apiPut(`/api/settings/payment-categories/${categoryId}`, data);
      if (result.success) {
        btn.innerHTML = 'Başarılı!';
        btn.style.background = '#10B981';
        setTimeout(() => {
          closeModal();
          renderPage('settings');
        }, 1000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      alert('Hata: ' + err.message);
      btn.innerHTML = 'Güncelle';
      btn.disabled = false;
    }
  });
}

// ===== PERSONNEL PERMISSIONS MODAL =====
async function openPositionPermissionsModal(positionId, positions, stages) {
  const p = positions.find(item => item.id == positionId);
  if (!p) return;

  const defaultPermissions = {
    all_services_view: 'none',
    delete_service: 'none',
    delete_service_action: 'none',
    customer_edit: 'none',
    personnel_edit: 'none',
    stock_view: 'none',
    finance_view: 'none',
    settings_view: 'none',
    membership_info_view: 'none'
  };
  const permissions = p.permissions ? { ...defaultPermissions, ...JSON.parse(p.permissions) } : defaultPermissions;
  const visibleStages = p.visible_stages ? JSON.parse(p.visible_stages) : stages.map(s => s.name);

  const authOptions = [
    { value: 'full', label: 'Tam Yetki (Ekle/Sil/Düzenle)', color: '#10B981' },
    { value: 'edit', label: 'Düzenleme Yetkisi (Ekle/Düzenle)', color: '#3B82F6' },
    { value: 'view', label: 'Görüntüleme Yetkisi', color: '#6366F1' },
    { value: 'none', label: 'Yetki Yok', color: '#EF4444' }
  ];

  const categories = [
    { 
      key: 'all_services_view', 
      icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
      options: [
        { value: 'all', label: 'Tüm Servisleri Görür' },
        { value: 'own', label: 'Kendi Servislerini Görür' },
        { value: 'workshop', label: 'Atölyeyi Görür' },
        { value: 'external', label: 'Harici Operatör' },
        { value: 'own_workshop', label: 'Kendi Servislerini Görür (Atölyeci)' },
        { value: 'none', label: 'Servisleri Göremez' }
      ]
    },
    { 
      key: 'delete_service', 
      icon: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
      options: [{ value: 'yes', label: 'Servis Silebilir' }, { value: 'no', label: 'Servis Silemez' }]
    },
    { 
      key: 'delete_service_action', 
      icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/><line x1="10" y1="14" x2="14" y2="10"/>',
      options: [{ value: 'yes', label: 'Servis İşlemini Silebilir' }, { value: 'no', label: 'Servis İşlemini Silemez' }]
    },
    { 
      key: 'customer_edit', 
      icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M11 19h4"/>',
      options: [
        { value: 'full', label: 'Müşteride Değişiklik Yapabilir' },
        { value: 'view', label: 'Müşterileri Sadece Görür' },
        { value: 'none', label: 'Müşterileri Göremez' }
      ]
    },
    { 
      key: 'personnel_edit', 
      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      options: [
        { value: 'contact', label: 'Personellerin İletişim Bilgilerini Görür' },
        { value: 'full', label: 'Personelde Değişiklik Yapabilir' },
        { value: 'none', label: 'Personelleri Göremez' }
      ]
    },
    { 
      key: 'stock_view', 
      icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
      options: [{ value: 'yes', label: 'Stokları Görür' }, { value: 'no', label: 'Stokları Göremez' }]
    },
    { 
      key: 'finance_view', 
      icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      options: [
        { value: 'view', label: 'Kasayı Görür' },
        { value: 'none', label: 'Kasayı Göremez' },
        { value: 'expense', label: 'Kasaya Gider Girebilir' },
        { value: 'view_only', label: 'Kasayı Görür ama Değiştiremez' }
      ]
    },
    { 
      key: 'settings_view', 
      icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      options: [{ value: 'yes', label: 'Ayarları Görür' }, { value: 'no', label: 'Ayarları Göremez' }]
    },
    { 
      key: 'membership_info_view', 
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M22 11l-3 3L17 12"/>',
      options: [{ value: 'yes', label: 'Üyelik Bilgilerini Görür' }, { value: 'no', label: 'Üyelik Bilgilerini Göremez' }]
    }
  ];

  openModal(`
    <div class="modal-header glass">
      <div class="header-content">
        <h2 style="margin:0;">${p.name} Pozisyonu Yetkileri</h2>
        <p style="margin:0.25rem 0 0; font-size:0.85rem; opacity:0.7;">Sistem genelindeki yetki seviyelerini ve görünürlüğü yönetin</p>
      </div>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body modern-scroll" style="max-height: 70vh; overflow-y: auto;">
      <div class="permissions-split-layout">
        <div class="permission-column">
          <div class="permission-section">
            <h4 class="section-title-premium">Modül Bazlı Yetkiler</h4>
            
            <div class="form-group" style="margin-bottom:1.5rem;">
              <label style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:0.5rem; opacity:0.8;">Sistem Yetkisi (Giriş Rolü)</label>
              <select id="edit_pos_base_role" class="auth-select modern" style="width:100%;">
                <option value="personel" ${p.base_role === 'personel' ? 'selected' : ''}>Saha Personeli</option>
                <option value="yönetici" ${p.base_role === 'yönetici' ? 'selected' : ''}>Hizmet Yöneticisi</option>
                <option value="admin" ${p.base_role === 'admin' ? 'selected' : ''}>Sistem Yöneticisi</option>
              </select>
              <p style="font-size:0.7rem; opacity:0.6; margin-top:0.3rem;">Bu seçim, personelin sisteme girişteki temel yetki grubunu belirler.</p>
            </div>

            <div class="authority-grid">
              ${categories.map(cat => `
                <div class="authority-card">
                  <div class="auth-header">
                    <div class="auth-icon-wrap">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${cat.icon}</svg>
                    </div>
                  </div>
                  <div class="auth-select-wrap">
                    <select class="auth-select modern" data-key="${cat.key}">
                      <option value="">Seçiniz</option>
                      ${cat.options.map(opt => `<option value="${opt.value}" ${permissions[cat.key] === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="permission-column">
          <div class="permission-section">
            <h4 class="section-title-premium">Görünebilir Servis Aşamaları</h4>
            <p style="font-size:0.8rem; opacity:0.6; margin-bottom:1rem;">Pozisyonun görebileceği aşamaları seçin.</p>
            <div class="stages-chip-container">
              ${stages.map(s => `
                <label class="chip-checkbox">
                  <input type="checkbox" class="stage-checkbox" value="${s.name}" ${visibleStages.includes(s.name) ? 'checked' : ''}>
                  <span class="chip-label">
                    <span class="chip-circle"></span>
                    ${s.name}
                  </span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer glass">
      <button class="btn-secondary" onclick="closeModal()">Vazgeç</button>
      <button class="btn-primary" id="savePermissionsBtn" style="min-width:120px;">
        <span class="btn-text">Güncelle</span>
      </button>
    </div>
  `, true);

  // Save Permissions logic
  document.getElementById('savePermissionsBtn').addEventListener('click', async () => {
    const btn = document.getElementById('savePermissionsBtn');
    const OriginalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span>';
    btn.disabled = true;

    const newPermissions = {};
    document.querySelectorAll('.auth-select').forEach(sel => {
      newPermissions[sel.dataset.key] = sel.value;
    });

    const newVisibleStages = [];
    document.querySelectorAll('.stage-checkbox:checked').forEach(cb => {
      newVisibleStages.push(cb.value);
    });

    try {
      const result = await apiPut(`/api/settings/positions/${positionId}`, {
        permissions: newPermissions,
        visible_stages: newVisibleStages,
        base_role: document.getElementById('edit_pos_base_role').value
      });

      if (result.success) {
        btn.innerHTML = 'Başarılı!';
        btn.style.background = '#10B981';
        setTimeout(() => {
          closeModal();
          renderPage('settings');
        }, 1000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      alert('Hata: ' + err.message);
      btn.innerHTML = OriginalText;
      btn.disabled = false;
    }
  });
}
