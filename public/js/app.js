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
  document.getElementById('userAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();

  // Hide Personnel for staff
  if (currentUser.role === 'personel') {
    document.querySelector('.nav-item[data-page="personnel"]')?.style.setProperty('display', 'none');
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
  renderPage('services');
}

// ===== Page Router =====
function renderPage(page) {
  const main = document.getElementById('mainContent');
  switch (page) {
    case 'services': renderServicesPage(main); break;
    case 'customers': renderCustomersPage(main); break;
    case 'personnel': renderPersonnelPage(main); break;
    case 'admin': renderAdminPage(main); break;
  }
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
    'İptal': 'badge-cancelled'
  };
  return `<span class="badge ${map[status] || 'badge-waiting'}">${status || 'Beklemede'}</span>`;
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function apiPut(url, data) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function apiDelete(url) {
  const res = await fetch(url, { method: 'DELETE' });
  return await res.json();
}

// ===== SERVICES PAGE =====
async function renderServicesPage(container) {
  const [services, authServices] = await Promise.all([
    apiGet('/api/services'),
    currentUser.role === 'admin' ? apiGet('/api/admin/authorized-services-list') : Promise.resolve([])
  ]);

  const totalCount = services.length;
  const waitingCount = services.filter(s => s.status === 'Beklemede').length;
  const progressCount = services.filter(s => s.status === 'Devam Ediyor').length;
  const doneCount = services.filter(s => s.status === 'Tamamlandı').length;

  let authServiceFilterHtml = '';
  if (currentUser.role === 'admin') {
    authServiceFilterHtml = `
      <div class="filter-group">
        <select id="companyFilter" class="filter-select">
          <option value="">Tüm Firmalar</option>
          ${authServices.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

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
        ${authServiceFilterHtml}
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
              <th>Durum</th>
              <th>Servis Sahibi</th>
              ${currentUser.role === 'admin' ? '<th>Yetkili Servis</th>' : ''}
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody id="servicesTableBody">
            ${services.map(s => `
              <tr data-id="${s.id}" data-customer="${(s.customer_name || '').toLowerCase()}" data-status="${s.status}" data-company="${s.service_id || ''}">
                <td><small>#${s.id}</small></td>
                <td>${formatDate(s.created_at)}</td>
                <td>${s.customer_name || '-'}</td>
                <td>${[s.device_brand, s.device_model].filter(Boolean).join(' ') || '-'}</td>
                <td>${s.device_fault || '-'}</td>
                <td>${getStatusBadge(s.status)}</td>
                <td>${s.personnel_name || '-'}</td>
                ${currentUser.role === 'admin' ? `<td>${s.authorized_service_name || '-'}</td>` : ''}
                <td>
                  <div style="display:flex;gap:0.25rem;">
                    <select class="status-select" data-id="${s.id}" style="padding:0.3rem;font-size:0.8rem;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--text-primary);">
                      <option value="Beklemede" ${s.status === 'Beklemede' ? 'selected' : ''}>Beklemede</option>
                      <option value="Devam Ediyor" ${s.status === 'Devam Ediyor' ? 'selected' : ''}>Devam Ediyor</option>
                      <option value="Tamamlandı" ${s.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                      <option value="İptal" ${s.status === 'İptal' ? 'selected' : ''}>İptal</option>
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
    const companyFilter = document.getElementById('companyFilter')?.value || '';
    
    document.querySelectorAll('#servicesTableBody tr').forEach(tr => {
      const id = tr.dataset.id;
      const customer = tr.dataset.customer;
      const status = tr.dataset.status;
      const company = tr.dataset.company;
      
      const matchesSearch = !searchTerm || id.includes(searchTerm) || customer.includes(searchTerm) || `#${id}`.includes(searchTerm);
      const matchesStatus = !statusFilter || status === statusFilter;
      const matchesCompany = !companyFilter || company === companyFilter;
      
      tr.style.display = (matchesSearch && matchesStatus && matchesCompany) ? '' : 'none';
    });
  };

  document.getElementById('serviceSearchInput')?.addEventListener('input', filterServices);
  document.getElementById('statusFilter')?.addEventListener('change', filterServices);
  document.getElementById('companyFilter')?.addEventListener('change', filterServices);

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
  let servicesListHtml = '';
  if (currentUser.role === 'admin') {
    const authServices = await apiGet('/api/admin/authorized-services-list');
    servicesListHtml = `
      <div class="form-group">
        <label>Yetkili Servis</label>
        <select id="svc_assigned_service_id">
          <option value="">Seçiniz</option>
          ${authServices.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

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
        ${servicesListHtml}
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
          <input type="text" id="svc_device_brand" placeholder="Marka">
        </div>
        <div class="form-group">
          <label>Cihaz Türü</label>
          <input type="text" id="svc_device_type" placeholder="Tür (ör: Laptop, Telefon)">
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
    warranty_period: document.getElementById('svc_warranty_period').value.trim()
  };

  // Admin: assigned service
  const assignedEl = document.getElementById('svc_assigned_service_id');
  if (assignedEl) {
    data.assigned_service_id = assignedEl.value || null;
  }

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

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'yönetici';
  const isStaff = currentUser.role === 'personel';
  
  let servicesListHtml = '';
  
  if (isAdmin) {
    const authServices = await apiGet('/api/admin/authorized-services-list');
    // ... rest of logic stays same but we refine isAdmin check below
    servicesListHtml = `
      <div class="form-group">
        <label>Yetkili Servis</label>
        <select id="edit_svc_assigned_service_id">
          <option value="">Seçiniz</option>
          ${authServices.map(as => `<option value="${as.id}" ${as.id === s.service_id ? 'selected' : ''}>${as.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

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
        ${servicesListHtml}
        <div class="form-group">
          <label>Durum</label>
          <select id="edit_svc_status">
            <option value="Beklemede" ${s.status === 'Beklemede' ? 'selected' : ''}>Beklemede</option>
            <option value="Devam Ediyor" ${s.status === 'Devam Ediyor' ? 'selected' : ''}>Devam Ediyor</option>
            <option value="Tamamlandı" ${s.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
            <option value="İptal" ${s.status === 'İptal' ? 'selected' : ''}>İptal</option>
          </select>
        </div>

        <div class="form-section-title">Cihaz Bilgileri</div>
        <div class="form-group">
          <label>Cihaz Markası</label>
          <input type="text" id="edit_svc_device_brand" value="${s.device_brand || ''}" ${isStaff ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label>Cihaz Türü</label>
          <input type="text" id="edit_svc_device_type" value="${s.device_type || ''}" ${isStaff ? 'readonly' : ''}>
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
        time_end: document.getElementById('edit_svc_time_end').value
      };
      
      if (isAdmin) {
        data.service_id = document.getElementById('edit_svc_assigned_service_id').value || null;
      }
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
  const [customers, authServices] = await Promise.all([
    apiGet('/api/customers'),
    currentUser.role === 'admin' ? apiGet('/api/admin/authorized-services-list') : Promise.resolve([])
  ]);

  let authServiceFilterHtml = '';
  if (currentUser.role === 'admin') {
    authServiceFilterHtml = `
      <div class="filter-group">
        <select id="custCompanyFilter" class="filter-select">
          <option value="">Tüm Firmalar</option>
          ${authServices.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

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
              ${currentUser.role === 'admin' ? '<th>Yetkili Servis</th>' : ''}
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody id="customersTableBody">
            ${customers.map(c => `
              <tr data-id="${c.id}" data-name="${(c.full_name || '').toLowerCase()}" data-company="${c.service_id || ''}">
                <td><small>#${c.id}</small></td>
                <td>${formatDate(c.created_at)}</td>
                <td>${c.full_name || '-'}</td>
                <td>${c.phone || '-'}</td>
                <td>${[c.city, c.district].filter(Boolean).join(' / ') || '-'}</td>
                <td>${c.address || '-'}</td>
                ${currentUser.role === 'admin' ? `<td>${c.authorized_service_name || '-'}</td>` : ''}
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
    const companyFilter = document.getElementById('custCompanyFilter')?.value || '';
    
    document.querySelectorAll('#customersTableBody tr').forEach(tr => {
      const id = tr.dataset.id;
      const name = tr.dataset.name;
      const company = tr.dataset.company;
      
      const matchesSearch = !q || id.includes(q) || name.includes(q) || `#${id}`.includes(q);
      const matchesCompany = !companyFilter || company === companyFilter;
      
      tr.style.display = (matchesSearch && matchesCompany) ? '' : 'none';
    });
  };

  document.getElementById('customerSearchInput')?.addEventListener('input', filterCustomers);
  document.getElementById('custCompanyFilter')?.addEventListener('change', filterCustomers);

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
  let servicesListHtml = '';
  if (currentUser.role === 'admin') {
    const authServices = await apiGet('/api/admin/authorized-services-list');
    servicesListHtml = `
      <div class="form-group">
        <label>Yetkili Servis</label>
        <select id="cust_service_id">
          <option value="">Seçiniz</option>
          ${authServices.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  openModal(`
    <div class="modal-header">
      <h2>Yeni Müşteri</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        ${servicesListHtml}
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

    if (currentUser.role === 'admin') {
      data.service_id = document.getElementById('cust_service_id').value || null;
    }

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
  const [personnel, authServices] = await Promise.all([
    apiGet('/api/personnel'),
    currentUser.role === 'admin' ? apiGet('/api/admin/authorized-services-list') : Promise.resolve([])
  ]);

  let authServiceFilterHtml = '';
  if (currentUser.role === 'admin') {
    authServiceFilterHtml = `
      <div class="filter-group">
        <select id="persCompanyFilter" class="filter-select">
          <option value="">Tüm Firmalar</option>
          ${authServices.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

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
              <th>Ad Soyad</th>
              <th>Pozisyon</th>
              <th>Başlama Tarihi</th>
              <th>Telefon</th>
              <th>E-posta</th>
              <th>Kullanıcı Adı</th>
              ${currentUser.role === 'admin' ? '<th>Yetkili Servis</th>' : ''}
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody id="personnelTableBody">
            ${personnel.map(p => `
              <tr data-id="${p.id}" data-name="${(p.full_name || '').toLowerCase()}" data-role="${p.role}" data-company="${p.service_id || ''}">
                <td><small>#${p.id}</small></td>
                <td>${p.full_name}</td>
                <td>${p.position || '-'}</td>
                <td>${formatDate(p.start_date)}</td>
                <td>${p.phone || '-'}</td>
                <td>${p.email || '-'}</td>
                <td>${p.username}</td>
                ${currentUser.role === 'admin' ? `<td>${p.authorized_service_name || '-'}</td>` : ''}
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
    const companyFilter = document.getElementById('persCompanyFilter')?.value || '';
    
    document.querySelectorAll('#personnelTableBody tr').forEach(tr => {
      const id = tr.dataset.id;
      const name = tr.dataset.name;
      const role = tr.dataset.role;
      const company = tr.dataset.company;
      
      const matchesSearch = !searchTerm || id.includes(searchTerm) || name.includes(searchTerm) || `#${id}`.includes(searchTerm);
      const matchesRole = !roleFilter || role === roleFilter;
      const matchesCompany = !companyFilter || company === companyFilter;
      
      tr.style.display = (matchesSearch && matchesRole && matchesCompany) ? '' : 'none';
    });
  };

  document.getElementById('personnelSearchInput')?.addEventListener('input', filterPersonnel);
  document.getElementById('roleFilter')?.addEventListener('change', filterPersonnel);
  document.getElementById('persCompanyFilter')?.addEventListener('change', filterPersonnel);

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
  if (currentUser.role === 'admin') {
    const authServices = await apiGet('/api/admin/authorized-services-list');
    servicesListHtml = `
      <div class="form-group">
        <label>Yetkili Servis *</label>
        <select id="pers_service_id" required>
          <option value="">Seçiniz</option>
          ${authServices.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  openModal(`
    <div class="modal-header">
      <h2>Yeni Personel</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
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

  document.getElementById('savePersonnelBtn').addEventListener('click', async () => {
    const errorEl = document.getElementById('pers_error');
    errorEl.style.display = 'none';

    try {
      const data = {
        full_name: document.getElementById('pers_full_name')?.value.trim() || '',
        position: document.getElementById('pers_position')?.value.trim() || '',
        start_date: document.getElementById('pers_start_date')?.value || '',
        phone: document.getElementById('pers_phone')?.value.trim() || '',
        phone2: document.getElementById('pers_phone2')?.value.trim() || '',
        city: document.getElementById('pers_city')?.value.trim() || '',
        district: document.getElementById('pers_district')?.value.trim() || '',
        address: document.getElementById('pers_address')?.value.trim() || '',
        email: document.getElementById('pers_email')?.value.trim() || '',
        id_number: document.getElementById('pers_id_number')?.value.trim() || '',
        username: document.getElementById('pers_username')?.value.trim() || '',
        password: document.getElementById('pers_password')?.value || '',
        role: document.getElementById('pers_role')?.value || 'personel'
      };

      const serviceEl = document.getElementById('pers_service_id');
      if (serviceEl) {
        data.service_id = serviceEl.value || null;
      }

      if (!data.full_name || !data.username || !data.password) {
        errorEl.textContent = 'Ad, kullanıcı adı ve şifre alanları zorunludur';
        errorEl.style.display = 'block';
        return;
      }

      const result = await apiPost('/api/personnel', data);
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

  const authServices = await apiGet('/api/admin/authorized-services-list');

  openModal(`
    <div class="modal-header">
      <h2>Personel Düzenle</h2>
      <button class="btn-icon" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-section-title">Kişisel Bilgiler</div>
        <div class="form-group">
          <label>Yetkili Servis *</label>
          <select id="edit_pers_service_id" required>
            <option value="">Seçiniz</option>
            ${authServices.map(s => `<option value="${s.id}" ${s.id === p.service_id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
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

  document.getElementById('saveEditPersonnelBtn').addEventListener('click', async () => {
    const errorEl = document.getElementById('edit_pers_error');
    errorEl.style.display = 'none';

    try {
      const data = {
        service_id: document.getElementById('edit_pers_service_id')?.value || null,
        full_name: document.getElementById('edit_pers_full_name')?.value.trim() || '',
        position: document.getElementById('edit_pers_position')?.value.trim() || '',
        start_date: document.getElementById('edit_pers_start_date')?.value || '',
        phone: document.getElementById('edit_pers_phone')?.value.trim() || '',
        phone2: document.getElementById('edit_pers_phone2')?.value.trim() || '',
        city: document.getElementById('edit_pers_city')?.value.trim() || '',
        district: document.getElementById('edit_pers_district')?.value.trim() || '',
        address: document.getElementById('edit_pers_address')?.value.trim() || '',
        email: document.getElementById('edit_pers_email')?.value.trim() || '',
        id_number: document.getElementById('edit_pers_id_number')?.value.trim() || '',
        username: document.getElementById('edit_pers_username')?.value.trim() || '',
        password: document.getElementById('edit_pers_password')?.value || '',
        role: document.getElementById('edit_pers_role')?.value || p.role
      };

      if (!data.full_name || !data.username) {
        errorEl.textContent = 'Ad ve kullanıcı adı alanları zorunludur';
        errorEl.style.display = 'block';
        return;
      }

      const result = await apiPut(`/api/personnel/${personnelId}`, data);
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


// ===== ADMIN PAGE =====
async function renderAdminPage(container) {
  if (currentUser.role !== 'admin') {
    container.innerHTML = '<div class="empty-state"><h3>Yetkiniz yok</h3></div>';
    return;
  }

  const authServices = await apiGet('/api/admin/authorized-services-list');

  container.innerHTML = `
    <div class="page-header">
      <h1>Admin Paneli</h1>
    </div>

    <div class="admin-grid">
      <div class="admin-section">
        <h3>Yetkili Servisler</h3>
        <ul class="admin-list" id="adminServicesList">
          ${authServices.length === 0 ? '<li class="admin-list-item" style="color:var(--text-muted);">Henüz yetkili servis yok</li>' : ''}
          ${authServices.map(s => `
            <li class="admin-list-item">
              <span>${s.name}</span>
              <button class="btn-danger btn-sm delete-auth-service-btn" data-id="${s.id}">Sil</button>
            </li>
          `).join('')}
        </ul>
        <div class="admin-add-form">
          <input type="text" id="newAuthServiceName" placeholder="Yetkili servis adı">
          <button class="btn-primary btn-sm" id="addAuthServiceBtn">Ekle</button>
        </div>
      </div>

      <div class="admin-section">
        <h3>Servis Atama</h3>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:1rem;">
          Servisler sayfasından herhangi bir servis kaydını farklı bir yetkili servise atayabilirsiniz.
          Durumu da yine servisler sayfasından değiştirebilirsiniz.
        </p>
        <button class="btn-primary" onclick="document.querySelector('[data-page=services]').click()">
          Servislere Git
        </button>
      </div>
    </div>
  `;

  // Add authorized service
  document.getElementById('addAuthServiceBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newAuthServiceName');
    const name = input.value.trim();
    if (!name) return;

    const result = await apiPost('/api/admin/authorized-services', { name });
    if (result.success) {
      renderAdminPage(container);
    } else {
      alert(result.error || 'Bir hata oluştu');
    }
  });

  // Delete authorized service
  document.querySelectorAll('.delete-auth-service-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Bu yetkili servisi silmek istediğinize emin misiniz?')) {
        await apiDelete(`/api/admin/authorized-services/${btn.dataset.id}`);
        renderAdminPage(container);
      }
    });
  });
}
