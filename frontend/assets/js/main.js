const projectRoot = window.location.pathname.includes('/frontend/')
  ? window.location.pathname.split('/frontend/')[0]
  : '';
const apacheProjectRoot = projectRoot || '/Final-project-Main-System';
const APACHE_API_BASE = `${window.location.protocol}//${window.location.hostname}${apacheProjectRoot}/backend/api`;
const API_BASE = window.location.port === '5500'
  ? APACHE_API_BASE
  : `${window.location.origin}${projectRoot}/backend/api`;

const navItems = [
  { href: 'dashboard.html', label: 'Dashboard', icon: 'layout-dashboard', roles: ['Admin', 'Veterinarian', 'PetOwner'] },
  { href: 'admin-panel.html', label: 'Admin Panel', icon: 'shield-check', roles: ['Admin'] },
  { href: 'manage-vets.html', label: 'Veterinarians', icon: 'stethoscope', roles: ['Admin'] },
  { href: 'pets.html', label: 'Pets', icon: 'paw-print', roles: ['Admin', 'Veterinarian', 'PetOwner'] },
  { href: 'appointments.html', label: 'Appointments', icon: 'calendar-check', roles: ['Admin', 'Veterinarian', 'PetOwner'] },
  { href: 'health-records.html', label: 'Health Records', icon: 'clipboard-plus', roles: ['Admin', 'Veterinarian', 'PetOwner'] },
  { href: 'vaccinations.html', label: 'Vaccinations', icon: 'syringe', roles: ['Admin', 'Veterinarian', 'PetOwner'] },
  { href: 'products.html', label: 'Products', icon: 'package-plus', roles: ['Admin', 'Veterinarian', 'PetOwner'] },
  { href: 'invoices.html', label: 'Invoices', icon: 'receipt-text', roles: ['Admin', 'Veterinarian', 'PetOwner'] },
];

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function money(value) {
  return `LKR ${Number(value || 0).toFixed(2)}`;
}

function mediaUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `${apacheProjectRoot}${url}`;
}

async function apiFetch(path, method = 'GET', body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: {},
  };

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/${path}`, options);
  } catch (error) {
    console.error('Fetch failed before the server returned a response:', error);
    return {
      success: false,
      message: window.location.protocol === 'file:'
        ? `Open the app through XAMPP: http://localhost${apacheProjectRoot}/frontend/login.html`
        : `Network error. Check Apache, CORS, and this URL: ${API_BASE}/${path}`,
    };
  }

  const json = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));

  if (response.status === 401) {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }

  return json;
}

async function uploadImage(file, category, entityId = 0) {
  if (!file || !file.size) return null;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('entity_id', String(entityId));

  const response = await fetch(`${API_BASE}/uploads.php`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = await response.json().catch(() => ({ success: false, message: 'Invalid upload response' }));
  if (!json.success) throw new Error(json.message || 'Image upload failed');
  return json.url;
}

async function loadLookups() {
  const res = await apiFetch('lookups.php');
  return res.success ? res.data : { owners: [], pets: [], vets: [], products: [] };
}

function optionText(parts) {
  return parts.filter(Boolean).join(' - ');
}

function fillSelect(select, items, valueKey, labelBuilder, placeholder) {
  if (!select) return;
  select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.textContent = labelBuilder(item);
    select.appendChild(option);
  });
}

async function syncSession() {
  const res = await apiFetch('auth.php');
  if (!res.success || !res.user) {
    sessionStorage.clear();
    window.location.href = 'login.html';
    return null;
  }

  sessionStorage.setItem('user_id', res.user.user_id);
  sessionStorage.setItem('role', res.user.role);
  sessionStorage.setItem('email', res.user.email || '');
  sessionStorage.setItem('username', res.user.username || '');
  return res.user;
}

function ensureClientRole(allowedRoles = []) {
  const role = sessionStorage.getItem('role');
  if (!role) {
    window.location.href = 'login.html';
    return false;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    window.location.href = 'dashboard.html';
    return false;
  }

  return true;
}

function renderShell(activePage) {
  const role = sessionStorage.getItem('role') || 'Guest';
  const email = sessionStorage.getItem('email') || 'Secure session';
  const sidebar = byId('sidebarNav');
  const userBadge = byId('userBadge');

  if (userBadge) {
    userBadge.innerHTML = `
      <div class="text-xs uppercase tracking-[0.24em] text-teal-300">${escapeHtml(role)}</div>
      <div class="truncate text-sm font-semibold text-white">${escapeHtml(email)}</div>
    `;
  }

  if (!sidebar) return;

  sidebar.innerHTML = navItems
    .filter((item) => item.roles.includes(role))
    .map((item) => {
      const active = item.href === activePage;
      return `
        <a href="${item.href}" class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ${active ? 'bg-white text-slate-950 shadow-lg shadow-indigo-950/10' : 'text-slate-300 hover:bg-white/10 hover:text-white'}">
          <i data-lucide="${item.icon}" class="h-4 w-4 ${active ? 'text-indigo-700' : 'text-teal-300'}"></i>
          <span>${item.label}</span>
        </a>
      `;
    })
    .join('');

  window.lucide?.createIcons();
}

async function bootPage(activePage, allowedRoles = []) {
  const session = await syncSession();
  if (!session) return null;
  if (!ensureClientRole(allowedRoles)) return null;

  renderShell(activePage);
  addLogoutListener();

  const menuButton = byId('sidebarToggle');
  const layout = byId('appLayout');
  if (menuButton && layout) {
    menuButton.addEventListener('click', () => layout.classList.toggle('sidebar-collapsed'));
  }

  return session;
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Signing in...';

  const res = await apiFetch('auth.php', 'POST', {
    action: 'login',
    username: form.username.value.trim(),
    password: form.password.value,
  });

  button.disabled = false;
  button.textContent = 'Sign In';

  if (!res.success) {
    showNotice(res.message || 'Login failed', 'error');
    return;
  }

  sessionStorage.setItem('user_id', res.user_id);
  sessionStorage.setItem('role', res.role);
  sessionStorage.setItem('email', res.email || '');
  sessionStorage.setItem('username', res.username || '');
  window.location.href = 'dashboard.html';
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Creating account...';

  const payload = {
    full_name: form.full_name.value.trim(),
    username: form.username.value.trim(),
    email: form.email.value.trim(),
    phone_number: form.phone_number.value.trim(),
    password: form.password.value,
    address: form.address.value.trim(),
  };

  const res = await apiFetch('register.php', 'POST', payload);

  if (!res.success) {
    showNotice(res.message || 'Registration failed', 'error');
    button.disabled = false;
    button.textContent = 'Create Pet Owner Account';
    return;
  }

  showNotice(res.message || 'Pet owner account created. You can sign in now.', 'success');
  setTimeout(() => { window.location.href = 'login.html'; }, 900);
}

async function handleSetupAdmin(event) {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Creating admin...';

  const res = await apiFetch('setup_admin.php', 'POST', {
    username: form.username.value.trim(),
    email: form.email.value.trim(),
    phone_number: form.phone_number.value.trim(),
    password: form.password.value,
  });

  button.disabled = false;
  button.textContent = 'Create Admin';

  if (!res.success) {
    showNotice(res.message || 'Unable to create admin', 'error');
    return;
  }

  showNotice('Admin account created. You can sign in now.', 'success');
  setTimeout(() => { window.location.href = 'login.html'; }, 900);
}

async function handleLogout() {
  await apiFetch('auth.php', 'POST', { action: 'logout' });
  sessionStorage.clear();
  window.location.href = 'login.html';
}

function addLogoutListener() {
  byId('logoutBtn')?.addEventListener('click', handleLogout);
}

function showNotice(message, type = 'success') {
  const notice = byId('notice');
  if (!notice) {
    alert(message);
    return;
  }

  notice.textContent = message;
  notice.className = `fixed right-5 top-5 z-50 rounded-lg px-4 py-3 text-sm font-semibold shadow-2xl transition-all duration-300 ${type === 'error' ? 'bg-rose-600 text-white' : 'bg-teal-500 text-slate-950'}`;
  notice.classList.remove('hidden');
  setTimeout(() => notice.classList.add('hidden'), 3200);
}

async function initDashboard() {
  const session = await bootPage('dashboard.html');
  if (!session) return;

  const [petsRes, apptsRes, invoicesRes, vetsRes] = await Promise.all([
    apiFetch('pets.php'),
    apiFetch('appointments.php'),
    apiFetch('invoices.php'),
    session.role === 'Admin' ? apiFetch('vets.php') : Promise.resolve({ success: true, data: [] }),
  ]);

  const pets = petsRes.success ? petsRes.data : [];
  const appointments = apptsRes.success ? apptsRes.data : [];
  const invoices = invoicesRes.success ? invoicesRes.data : [];
  const vets = vetsRes.success ? vetsRes.data : [];

  byId('stat-pets').textContent = pets.length;
  byId('stat-appts').textContent = appointments.filter((item) => item.status === 'scheduled').length;
  byId('stat-rev').textContent = money(invoices.reduce((sum, item) => sum + Number(item.total_amount || 0), 0));
  byId('stat-vets').textContent = session.role === 'Admin' ? vets.length : appointments.length;

  const tbody = document.querySelector('#activity-table tbody');
  if (tbody) {
    tbody.innerHTML = appointments.slice(0, 6).map((item) => `
      <tr class="border-b border-slate-200/70">
        <td class="px-4 py-3 font-semibold text-slate-900">${escapeHtml(item.pet_name || 'Unassigned')}</td>
        <td class="px-4 py-3 text-slate-600">${escapeHtml(item.vet_name || 'Pending')}</td>
        <td class="px-4 py-3 text-slate-600">${escapeHtml(item.type)}</td>
        <td class="px-4 py-3"><span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">${escapeHtml(item.status)}</span></td>
      </tr>
    `).join('') || `<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">No appointments are scheduled.</td></tr>`;
  }
}

async function initAdminPanel() {
  const session = await bootPage('admin-panel.html', ['Admin']);
  if (!session) return;

  document.querySelectorAll('[data-admin-add]').forEach((button) => {
    button.addEventListener('click', () => openAdminEditor(button.dataset.adminAdd));
  });
  await loadAdminPanel();
}

let adminPanelData = {
  users: [],
  owners: [],
  vets: [],
  pets: [],
  appointments: [],
  records: [],
  invoices: [],
};

async function loadAdminPanel() {
  const res = await apiFetch('admin.php');
  if (!res.success) {
    showNotice(res.message || 'Unable to load admin panel', 'error');
    return;
  }

  const { stats, users, owners, vets, pets, appointments, records, invoices } = res.data;
  adminPanelData = { users, owners, vets, pets, appointments, records, invoices };
  setText('admin-stat-users', stats.users);
  setText('admin-stat-owners', stats.owners);
  setText('admin-stat-vets', stats.vets);
  setText('admin-stat-pets', stats.pets);
  setText('admin-stat-appts', stats.appointments);
  setText('admin-stat-records', stats.records);
  setText('admin-stat-revenue', money(stats.revenue));

  renderAdminUsers(users);
  renderAdminOwners(owners);
  renderAdminVets(vets);
  renderAdminPets(pets);
  renderAdminAppointments(appointments);
  renderAdminRecords(records);
  renderAdminInvoices(invoices);
  window.lucide?.createIcons();
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function adminEmpty(cols, text) {
  return `<tr><td colspan="${cols}" class="px-4 py-8 text-center text-slate-500">${text}</td></tr>`;
}

function renderAdminUsers(items) {
  const tbody = document.querySelector('#admin-users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map((user) => `
    <tr class="border-b border-slate-200/70 hover:bg-slate-50">
      <td class="px-4 py-3"><div class="font-semibold text-slate-950">${escapeHtml(user.full_name)}</div><div class="text-xs text-slate-500">@${escapeHtml(user.username)}</div></td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(user.email)}</td>
      <td class="px-4 py-3"><span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">${escapeHtml(user.role)}</span></td>
      <td class="px-4 py-3">
        <select data-user-status="${user.user_id}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          ${['active', 'suspended', 'disabled'].map((status) => `<option value="${status}" ${status === user.account_status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </td>
      <td class="px-4 py-3 text-right">${user.role === 'Admin' ? '' : deleteButton('user', user.user_id)}</td>
    </tr>
  `).join('') : adminEmpty(5, 'No users found.');

  tbody.querySelectorAll('[data-user-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      const res = await apiFetch('admin.php', 'POST', { action: 'update_user_status', user_id: Number(select.dataset.userStatus), account_status: select.value });
      showNotice(res.message || (res.success ? 'Updated' : 'Update failed'), res.success ? 'success' : 'error');
      if (!res.success) await loadAdminPanel();
    });
  });
}

function renderAdminOwners(items) {
  const tbody = document.querySelector('#admin-owners-table tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map((owner) => `
    <tr class="border-b border-slate-200/70 hover:bg-slate-50">
      <td class="px-4 py-3 font-semibold text-slate-950">${escapeHtml(owner.full_name)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(owner.email)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(owner.phone_number)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(owner.address)}</td>
      <td class="px-4 py-3 text-right">${adminRowActions('owner', owner.owner_id)}</td>
    </tr>
  `).join('') : adminEmpty(5, 'No pet owners found.');
}

function renderAdminVets(items) {
  const tbody = document.querySelector('#admin-vets-table tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map((vet) => `
    <tr class="border-b border-slate-200/70 hover:bg-slate-50">
      <td class="px-4 py-3 font-semibold text-slate-950">${escapeHtml(vet.full_name)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(vet.email)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(vet.phone_number)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(vet.address)}</td>
      <td class="px-4 py-3 text-right">${adminRowActions('vet', vet.vet_id)}</td>
    </tr>
  `).join('') : adminEmpty(5, 'No veterinarians found.');
}

function renderAdminPets(items) {
  const tbody = document.querySelector('#admin-pets-table tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map((pet) => `
    <tr class="border-b border-slate-200/70 hover:bg-slate-50">
      <td class="px-4 py-3 font-semibold text-slate-950">${escapeHtml(pet.pet_name)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(pet.species)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(pet.breed || 'Not recorded')}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(pet.owner_name)}</td>
      <td class="px-4 py-3 text-right">${adminRowActions('pet', pet.pet_id)}</td>
    </tr>
  `).join('') : adminEmpty(5, 'No pets found.');
}

function renderAdminAppointments(items) {
  const tbody = document.querySelector('#admin-appointments-table tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map((appointment) => `
    <tr class="border-b border-slate-200/70 hover:bg-slate-50">
      <td class="px-4 py-3 font-semibold text-slate-950">${escapeHtml(appointment.pet_name || 'Pet')}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(appointment.vet_name || 'Veterinarian')}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(new Date(appointment.scheduled_date).toLocaleString())}</td>
      <td class="px-4 py-3">
        <select data-appointment-status="${appointment.appointment_id}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          ${['scheduled', 'completed', 'cancelled'].map((status) => `<option value="${status}" ${status === appointment.status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </td>
      <td class="px-4 py-3 text-right">${adminRowActions('appointment', appointment.appointment_id)}</td>
    </tr>
  `).join('') : adminEmpty(5, 'No appointments found.');

  tbody.querySelectorAll('[data-appointment-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      const res = await apiFetch('admin.php', 'POST', { action: 'update_appointment_status', appointment_id: Number(select.dataset.appointmentStatus), status: select.value });
      showNotice(res.message || (res.success ? 'Updated' : 'Update failed'), res.success ? 'success' : 'error');
      if (!res.success) await loadAdminPanel();
    });
  });
}

function renderAdminRecords(items) {
  const tbody = document.querySelector('#admin-records-table tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map((record) => `
    <tr class="border-b border-slate-200/70 hover:bg-slate-50">
      <td class="px-4 py-3 text-slate-600">${escapeHtml(new Date(record.visit_date).toLocaleString())}</td>
      <td class="px-4 py-3 font-semibold text-slate-950">${escapeHtml(record.pet_name || 'Pet')}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(record.vet_name || 'Veterinarian')}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(record.clinical_finding || 'No finding')}</td>
      <td class="px-4 py-3 text-right">${adminRowActions('health_record', record.record_id)}</td>
    </tr>
  `).join('') : adminEmpty(5, 'No health records found.');
}

function renderAdminInvoices(items) {
  const tbody = document.querySelector('#admin-invoices-table tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map((invoice) => `
    <tr class="border-b border-slate-200/70 hover:bg-slate-50">
      <td class="px-4 py-3 font-semibold text-slate-950">INV-${escapeHtml(invoice.invoice_id)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHtml(invoice.pet_name || 'Pet')}</td>
      <td class="px-4 py-3 font-semibold text-slate-950">${money(invoice.total_amount)}</td>
      <td class="px-4 py-3">
        <select data-invoice-status="${invoice.invoice_id}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          ${['pending', 'paid', 'overdue', 'refunded'].map((status) => `<option value="${status}" ${status === invoice.payment_status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </td>
      <td class="px-4 py-3 text-right">${adminRowActions('invoice', invoice.invoice_id)}</td>
    </tr>
  `).join('') : adminEmpty(5, 'No invoices found.');

  tbody.querySelectorAll('[data-invoice-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      const res = await apiFetch('admin.php', 'POST', { action: 'update_invoice_status', invoice_id: Number(select.dataset.invoiceStatus), payment_status: select.value });
      showNotice(res.message || (res.success ? 'Updated' : 'Update failed'), res.success ? 'success' : 'error');
      if (!res.success) await loadAdminPanel();
    });
  });
}

function deleteButton(entity, id) {
  return `<button data-delete-entity="${entity}" data-delete-id="${id}" class="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition-all duration-300 hover:bg-rose-600 hover:text-white"><i data-lucide="trash-2" class="h-3.5 w-3.5"></i> Delete</button>`;
}

function editButton(entity, id) {
  return `<button data-edit-entity="${entity}" data-edit-id="${id}" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-950 hover:text-white"><i data-lucide="pencil" class="h-3.5 w-3.5"></i> Edit</button>`;
}

function adminRowActions(entity, id) {
  return `<div class="flex justify-end gap-2">${editButton(entity, id)}${deleteButton(entity, id)}</div>`;
}

const adminEntityConfig = {
  owner: { label: 'Pet Owner', list: 'owners', id: 'owner_id' },
  vet: { label: 'Veterinarian', list: 'vets', id: 'vet_id' },
  pet: { label: 'Pet', list: 'pets', id: 'pet_id' },
  appointment: { label: 'Appointment', list: 'appointments', id: 'appointment_id' },
  health_record: { label: 'Health Record', list: 'records', id: 'record_id' },
  invoice: { label: 'Invoice', list: 'invoices', id: 'invoice_id' },
};

function adminItem(entity, id) {
  const config = adminEntityConfig[entity];
  return (adminPanelData[config.list] || []).find((item) => Number(item[config.id]) === Number(id)) || null;
}

function dateTimeInput(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

function fieldValue(item, key, fallback = '') {
  return item?.[key] ?? fallback;
}

function adminFields(entity, item, isEdit) {
  if (entity === 'owner' || entity === 'vet') {
    return [
      { name: 'full_name', label: 'Full Name', value: fieldValue(item, 'full_name'), required: true },
      { name: 'username', label: 'Username', value: fieldValue(item, 'username'), required: true },
      { name: 'email', label: 'Email', type: 'email', value: fieldValue(item, 'email'), required: true },
      { name: 'phone_number', label: 'Phone', value: fieldValue(item, 'phone_number'), required: true },
      { name: 'account_status', label: 'Status', type: 'select', value: fieldValue(item, 'account_status', 'active'), options: ['active', 'suspended', 'disabled'], required: true },
      { name: 'password', label: isEdit ? 'New Password' : 'Password', type: 'password', value: '', required: !isEdit, placeholder: isEdit ? 'Leave blank to keep current password' : '' },
      { name: 'address', label: 'Address', type: 'textarea', value: fieldValue(item, 'address'), required: true, wide: true },
    ];
  }

  if (entity === 'pet') {
    return [
      { name: 'owner_id', label: 'Owner', type: 'select', value: String(fieldValue(item, 'owner_id')), options: adminPanelData.owners.map((owner) => ({ value: String(owner.owner_id), label: optionText([owner.full_name, owner.email]) })), required: true },
      { name: 'pet_name', label: 'Pet Name', value: fieldValue(item, 'pet_name'), required: true },
      { name: 'species', label: 'Species', value: fieldValue(item, 'species'), required: true },
      { name: 'breed', label: 'Breed', value: fieldValue(item, 'breed') },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', value: fieldValue(item, 'date_of_birth') },
      { name: 'sex', label: 'Sex', type: 'select', value: fieldValue(item, 'sex', 'Unknown'), options: ['Male', 'Female', 'Unknown'], required: true },
      { name: 'weight', label: 'Weight', type: 'number', step: '0.01', value: fieldValue(item, 'weight') },
      { name: 'microchip_number', label: 'Microchip Number', value: fieldValue(item, 'microchip_number') },
      { name: 'known_allergies', label: 'Known Allergies', type: 'textarea', value: fieldValue(item, 'known_allergies'), wide: true },
    ];
  }

  if (entity === 'appointment') {
    return [
      { name: 'vet_id', label: 'Veterinarian', type: 'select', value: String(fieldValue(item, 'vet_id')), options: adminPanelData.vets.map((vet) => ({ value: String(vet.vet_id), label: optionText([vet.full_name, vet.email]) })), required: true },
      { name: 'pet_id', label: 'Pet', type: 'select', value: String(fieldValue(item, 'pet_id')), options: adminPanelData.pets.map((pet) => ({ value: String(pet.pet_id), label: optionText([pet.pet_name, pet.species, pet.owner_name]) })), required: true },
      { name: 'scheduled_date', label: 'Scheduled Date', type: 'datetime-local', value: dateTimeInput(fieldValue(item, 'scheduled_date')), required: true, wide: true },
      { name: 'type', label: 'Type', value: fieldValue(item, 'type'), required: true },
      { name: 'status', label: 'Status', type: 'select', value: fieldValue(item, 'status', 'scheduled'), options: ['scheduled', 'completed', 'cancelled'], required: true },
      { name: 'fee', label: 'Fee', type: 'number', step: '0.01', value: fieldValue(item, 'fee', 0) },
      { name: 'resone', label: 'Reason', type: 'textarea', value: fieldValue(item, 'resone'), wide: true },
    ];
  }

  if (entity === 'health_record') {
    return [
      { name: 'pet_id', label: 'Pet', type: 'select', value: String(fieldValue(item, 'pet_id')), options: adminPanelData.pets.map((pet) => ({ value: String(pet.pet_id), label: optionText([pet.pet_name, pet.species, pet.owner_name]) })), required: true },
      { name: 'vet_id', label: 'Veterinarian', type: 'select', value: String(fieldValue(item, 'vet_id')), options: adminPanelData.vets.map((vet) => ({ value: String(vet.vet_id), label: optionText([vet.full_name, vet.email]) })), required: true },
      { name: 'appointment_id', label: 'Appointment ID', type: 'number', value: fieldValue(item, 'appointment_id') },
      { name: 'visit_date', label: 'Visit Date', type: 'datetime-local', value: dateTimeInput(fieldValue(item, 'visit_date')) },
      { name: 'clinical_finding', label: 'Clinical Finding', type: 'textarea', value: fieldValue(item, 'clinical_finding'), required: true, wide: true },
      { name: 'diagnosis_code', label: 'Diagnosis Code', value: fieldValue(item, 'diagnosis_code') },
      { name: 'lab_results', label: 'Lab Results', value: fieldValue(item, 'lab_results') },
      { name: 'treatment_plan', label: 'Treatment Plan', type: 'textarea', value: fieldValue(item, 'treatment_plan'), wide: true },
    ];
  }

  return [
    { name: 'appointment_id', label: 'Appointment ID', type: 'number', value: fieldValue(item, 'appointment_id'), required: true },
    { name: 'total_amount', label: 'Total Amount', type: 'number', step: '0.01', value: fieldValue(item, 'total_amount', 0), required: true },
    { name: 'payment_status', label: 'Payment Status', type: 'select', value: fieldValue(item, 'payment_status', 'pending'), options: ['pending', 'paid', 'overdue', 'refunded'], required: true },
    { name: 'payment_method', label: 'Payment Method', value: fieldValue(item, 'payment_method') },
  ];
}

function adminField(field) {
  const baseClass = 'w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500';
  const required = field.required ? 'required' : '';
  const placeholder = field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : '';
  const step = field.step ? `step="${escapeHtml(field.step)}"` : '';
  const value = escapeHtml(field.value ?? '');
  const label = `<span class="mb-1 block text-sm font-semibold text-slate-600">${escapeHtml(field.label)}</span>`;

  if (field.type === 'textarea') {
    return `<label class="block ${field.wide ? 'sm:col-span-2' : ''}">${label}<textarea name="${field.name}" rows="3" ${required} class="${baseClass} resize-none">${value}</textarea></label>`;
  }

  if (field.type === 'select') {
    return `<label class="block ${field.wide ? 'sm:col-span-2' : ''}">${label}<select name="${field.name}" ${required} class="${baseClass}">${field.options.map((option) => {
      const optionValue = typeof option === 'object' ? option.value : option;
      const optionLabel = typeof option === 'object' ? option.label : option;
      return `<option value="${escapeHtml(optionValue)}" ${String(optionValue) === String(field.value) ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>`;
    }).join('')}</select></label>`;
  }

  return `<label class="block ${field.wide ? 'sm:col-span-2' : ''}">${label}<input name="${field.name}" type="${field.type || 'text'}" value="${value}" ${required} ${placeholder} ${step} class="${baseClass}" /></label>`;
}

function openAdminEditor(entity, id = null) {
  const config = adminEntityConfig[entity];
  if (!config) return;

  const isEdit = id !== null;
  const item = isEdit ? adminItem(entity, id) : null;
  const mount = byId('adminModalMount');
  if (!mount) return;

  mount.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <form id="adminCrudForm" class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 text-slate-950 shadow-2xl">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Admin ${isEdit ? 'Update' : 'Add'}</p>
            <h3 class="text-2xl font-semibold">${isEdit ? 'Edit' : 'Add'} ${escapeHtml(config.label)}</h3>
          </div>
          <button type="button" data-close-admin-modal class="rounded-lg border border-slate-200 p-2 transition-all duration-300 hover:bg-slate-100" aria-label="Close">
            <i data-lucide="x" class="h-5 w-5"></i>
          </button>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          ${adminFields(entity, item, isEdit).map(adminField).join('')}
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" data-close-admin-modal class="rounded-lg border border-slate-200 px-5 py-3 font-bold text-slate-700">Cancel</button>
          <button type="submit" class="rounded-lg bg-slate-950 px-5 py-3 font-bold text-white transition-all duration-300 hover:bg-indigo-800">${isEdit ? 'Save Changes' : 'Create'}</button>
        </div>
      </form>
    </div>
  `;

  window.lucide?.createIcons();
  mount.querySelectorAll('[data-close-admin-modal]').forEach((button) => {
    button.addEventListener('click', () => { mount.innerHTML = ''; });
  });
  byId('adminCrudForm')?.addEventListener('submit', (event) => saveAdminEditor(event, entity, id));
}

async function saveAdminEditor(event, entity, id) {
  event.preventDefault();
  const form = event.target;
  const config = adminEntityConfig[entity];
  const payload = { action: `${id === null ? 'create' : 'update'}_${entity}` };

  new FormData(form).forEach((value, key) => {
    payload[key] = typeof value === 'string' ? value.trim() : value;
  });

  if (id !== null) {
    payload[config.id] = id;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Saving...';

  const res = await apiFetch('admin.php', 'POST', payload);
  button.disabled = false;
  button.textContent = id === null ? 'Create' : 'Save Changes';

  if (!res.success) {
    showNotice(res.message || 'Unable to save record', 'error');
    return;
  }

  byId('adminModalMount').innerHTML = '';
  showNotice(res.message || 'Record saved', 'success');
  await loadAdminPanel();
}

document.addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-edit-entity]');
  if (edit) {
    openAdminEditor(edit.dataset.editEntity, Number(edit.dataset.editId));
    return;
  }

  const button = event.target.closest('[data-delete-entity]');
  if (!button) return;

  const entity = button.dataset.deleteEntity;
  const id = Number(button.dataset.deleteId);
  if (!window.confirm('Delete this record? This action cannot be undone.')) return;

  const res = await apiFetch('admin.php', 'POST', { action: 'delete', entity, id });
  showNotice(res.message || (res.success ? 'Deleted' : 'Delete failed'), res.success ? 'success' : 'error');
  if (res.success) await loadAdminPanel();
});

async function initManageVets() {
  const session = await bootPage('manage-vets.html', ['Admin']);
  if (!session) return;

  await loadVetsTable();
  byId('openVetModal')?.addEventListener('click', () => byId('vetModal')?.classList.remove('translate-x-full'));
  byId('closeVetModal')?.addEventListener('click', closeVetModal);
  wireForm('vetForm', handleRegisterVet);
}

function closeVetModal() {
  byId('vetModal')?.classList.add('translate-x-full');
}

async function loadVetsTable() {
  const res = await apiFetch('vets.php');
  const tbody = document.querySelector('#vets-table tbody');
  if (!tbody) return;

  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-rose-600">${escapeHtml(res.message || 'Unable to load veterinarians')}</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data.map((vet) => `
    <tr class="border-b border-slate-200/70 transition-all duration-300 hover:bg-slate-50">
      <td class="px-4 py-4">
        <div class="font-semibold text-slate-950">${escapeHtml(vet.full_name)}</div>
        <div class="text-xs text-slate-500">@${escapeHtml(vet.username)}</div>
      </td>
      <td class="px-4 py-4 text-slate-600">${escapeHtml(vet.email)}</td>
      <td class="px-4 py-4 text-slate-600">${escapeHtml(vet.phone_number)}</td>
      <td class="px-4 py-4 text-slate-600">${escapeHtml(vet.address)}</td>
      <td class="px-4 py-4"><span class="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">${escapeHtml(vet.account_status)}</span></td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No veterinarians registered.</td></tr>`;
}

async function handleRegisterVet(event) {
  event.preventDefault();
  const form = event.target;
  const res = await apiFetch('vets.php', 'POST', {
    full_name: form.full_name.value.trim(),
    username: form.username.value.trim(),
    email: form.email.value.trim(),
    phone_number: form.phone_number.value.trim(),
    address: form.address.value.trim(),
    password: form.password.value,
  });

  if (!res.success) {
    showNotice(res.message || 'Unable to register veterinarian', 'error');
    return;
  }

  form.reset();
  closeVetModal();
  showNotice('Veterinarian registered securely.', 'success');
  await loadVetsTable();
}

async function initPetsPage() {
  const session = await bootPage('pets.html');
  if (!session) return;
  if (session.role === 'Veterinarian') {
    byId('openPetModal')?.classList.add('hidden');
  }
  const lookups = await loadLookups();
  fillSelect(
    document.querySelector('#addPetForm [name="owner_id"]'),
    lookups.owners || [],
    'owner_id',
    (owner) => optionText([owner.full_name, owner.email || owner.phone_number]),
    session.role === 'Admin' ? 'Select owner' : 'Your owner profile'
  );
  if (session.role !== 'Admin') {
    document.querySelector('#addPetForm [data-owner-field]')?.classList.add('hidden');
  }
  await loadPetsTable();
  byId('openPetModal')?.addEventListener('click', () => byId('addPetModal')?.showModal());
  wireForm('addPetForm', handleAddPet);
}

async function loadPetsTable() {
  const res = await apiFetch('pets.php');
  const tbody = document.querySelector('#pets-table tbody');
  if (!tbody) return;

  tbody.innerHTML = res.success && res.data.length
    ? res.data.map((pet) => `
      <tr class="border-b border-slate-200/70 hover:bg-slate-50">
        <td class="px-4 py-4">
          <div class="flex items-center gap-3">
            ${pet.photo_url ? `<img src="${escapeHtml(mediaUrl(pet.photo_url))}" alt="" class="h-11 w-11 rounded-lg object-cover" />` : '<div class="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><i data-lucide="paw-print" class="h-5 w-5"></i></div>'}
            <span class="font-semibold text-slate-950">${escapeHtml(pet.pet_name)}</span>
          </div>
        </td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(pet.species)}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(pet.breed || 'Not recorded')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(pet.owner_name || 'Owner profile')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(pet.microchip_number || 'No chip')}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">${escapeHtml(res.message || 'No pets found.')}</td></tr>`;
  window.lucide?.createIcons();
}

async function handleAddPet(event) {
  event.preventDefault();
  const form = event.target;
  let photoUrl = null;
  try {
    photoUrl = await uploadImage(form.photo?.files?.[0], 'pets');
  } catch (error) {
    showNotice(error.message, 'error');
    return;
  }
  const body = {
    owner_id: Number(form.owner_id?.value || 0),
    pet_name: form.pet_name.value.trim(),
    species: form.species.value.trim(),
    breed: form.breed.value.trim() || null,
    date_of_birth: form.date_of_birth.value || null,
    sex: form.sex.value,
    weight: form.weight.value ? Number(form.weight.value) : null,
    microchip_number: form.microchip_number.value.trim() || null,
    known_allergies: form.known_allergies.value.trim() || null,
    photo_url: photoUrl,
  };

  const res = await apiFetch('pets.php', 'POST', body);
  if (!res.success) {
    showNotice(res.message || 'Unable to add pet', 'error');
    return;
  }

  form.reset();
  byId('addPetModal')?.close();
  showNotice('Pet profile added.', 'success');
  await loadPetsTable();
  window.lucide?.createIcons();
}

async function initAppointmentsPage() {
  const session = await bootPage('appointments.html');
  if (!session) return;
  if (session.role === 'Veterinarian') {
    byId('openApptModal')?.classList.add('hidden');
  }
  const lookups = await loadLookups();
  fillSelect(document.querySelector('#addApptForm [name="vet_id"]'), lookups.vets || [], 'vet_id', (vet) => optionText([vet.full_name, vet.email]), 'Select veterinarian');
  fillSelect(document.querySelector('#addApptForm [name="pet_id"]'), lookups.pets || [], 'pet_id', (pet) => optionText([pet.pet_name, pet.species, pet.owner_name]), 'Select pet');
  await loadAppointmentsTable();
  byId('openApptModal')?.addEventListener('click', () => byId('addApptModal')?.showModal());
  wireForm('addApptForm', handleAddAppointment);
}

async function loadAppointmentsTable() {
  const res = await apiFetch('appointments.php');
  const tbody = document.querySelector('#appointments-table tbody');
  if (!tbody) return;

  tbody.innerHTML = res.success && res.data.length
    ? res.data.map((appt) => `
      <tr class="border-b border-slate-200/70 hover:bg-slate-50">
        <td class="px-4 py-4 font-semibold text-slate-950">${escapeHtml(appt.pet_name || 'Pet')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(appt.vet_name || 'Veterinarian')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(new Date(appt.scheduled_date).toLocaleString())}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(appt.type)}</td>
        <td class="px-4 py-4"><span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">${escapeHtml(appt.status)}</span></td>
        <td class="px-4 py-4 text-right">${appointmentActions(appt)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">${escapeHtml(res.message || 'No appointments scheduled.')}</td></tr>`;
}

function appointmentActions(appt) {
  const role = sessionStorage.getItem('role');
  if (role === 'Veterinarian' || role === 'Admin') {
    return `
      <select data-appt-status="${appt.appointment_id}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        ${['scheduled', 'completed', 'cancelled'].map((status) => `<option value="${status}" ${status === appt.status ? 'selected' : ''}>${status}</option>`).join('')}
      </select>
    `;
  }

  if (role === 'PetOwner' && appt.status === 'scheduled') {
    return `<button data-cancel-appt="${appt.appointment_id}" class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition-all duration-300 hover:bg-rose-600 hover:text-white">Cancel</button>`;
  }

  return '';
}

async function handleAddAppointment(event) {
  event.preventDefault();
  const form = event.target;
  const res = await apiFetch('appointments.php', 'POST', {
    vet_id: Number(form.vet_id.value),
    pet_id: Number(form.pet_id.value),
    scheduled_date: form.scheduled_date.value,
    type: form.type.value.trim(),
    resone: form.resone.value.trim() || null,
    fee: form.fee.value ? Number(form.fee.value) : 0,
  });

  if (!res.success) {
    showNotice(res.message || 'Unable to book appointment', 'error');
    return;
  }

  form.reset();
  byId('addApptModal')?.close();
  showNotice('Appointment booked.', 'success');
  await loadAppointmentsTable();
}

async function initHealthRecordsPage() {
  const session = await bootPage('health-records.html');
  if (!session) return;
  const lookups = await loadLookups();
  fillSelect(byId('filterPetId'), lookups.pets || [], 'pet_id', (pet) => optionText([pet.pet_name, pet.species, pet.owner_name]), 'Select pet');
  fillSelect(document.querySelector('#addHealthForm [name="pet_id"]'), lookups.pets || [], 'pet_id', (pet) => optionText([pet.pet_name, pet.species, pet.owner_name]), 'Select pet');
  fillSelect(document.querySelector('#addHealthForm [name="vet_id"]'), lookups.vets || [], 'vet_id', (vet) => optionText([vet.full_name, vet.email]), 'Select veterinarian');
  if (session.role === 'PetOwner') {
    byId('openHealthModal')?.classList.add('hidden');
  } else if (session.role === 'Veterinarian') {
    const vetField = document.querySelector('#addHealthForm [name="vet_id"]');
    if (vetField) {
      vetField.required = false;
      vetField.closest('label')?.classList.add('hidden');
    }
  }
  byId('openHealthModal')?.addEventListener('click', () => byId('addHealthModal')?.showModal());
  byId('filterBtn')?.addEventListener('click', () => {
    const petId = byId('filterPetId')?.value;
    if (petId) loadHealthRecords(petId);
  });
  wireForm('addHealthForm', handleAddHealthRecord);
}

async function loadHealthRecords(petId) {
  const res = await apiFetch(`health_records.php?pet_id=${encodeURIComponent(petId)}`);
  const tbody = document.querySelector('#health-table tbody');
  if (!tbody) return;

  tbody.innerHTML = res.success && res.data.length
    ? res.data.map((record) => `
      <tr class="border-b border-slate-200/70 hover:bg-slate-50">
        <td class="px-4 py-4 text-slate-600">${escapeHtml(new Date(record.visit_date).toLocaleString())}</td>
        <td class="px-4 py-4 font-semibold text-slate-950">${escapeHtml(record.pet_name || 'Pet')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.vet_name || 'Veterinarian')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.clinical_finding)}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.treatment_plan || 'Monitoring')}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">${escapeHtml(res.message || 'No health records found for this pet.')}</td></tr>`;
}

async function handleAddHealthRecord(event) {
  event.preventDefault();
  const form = event.target;
  const body = {
    pet_id: Number(form.pet_id.value),
    vet_id: Number(form.vet_id.value),
    appointment_id: form.appointment_id.value ? Number(form.appointment_id.value) : null,
    visit_date: form.visit_date.value || null,
    clinical_finding: form.clinical_finding.value.trim(),
    diagnosis_code: form.diagnosis_code.value.trim() || null,
    treatment_plan: form.treatment_plan.value.trim() || null,
    lab_results: form.lab_results.value.trim() || null,
  };

  const res = await apiFetch('health_records.php', 'POST', body);
  if (!res.success) {
    showNotice(res.message || 'Unable to add health record', 'error');
    return;
  }

  form.reset();
  byId('addHealthModal')?.close();
  showNotice('Health record added.', 'success');
  await loadHealthRecords(body.pet_id);
}

let vaccinationsState = {
  records: [],
  lookups: { pets: [], vets: [], products: [] },
  search: '',
  status: 'all',
  petId: '',
};

async function initVaccinationsPage() {
  const session = await bootPage('vaccinations.html', ['Admin', 'Veterinarian', 'PetOwner']);
  if (!session) return;

  vaccinationsState.lookups = await loadLookups();
  fillSelect(byId('vaccinationPetFilter'), vaccinationsState.lookups.pets || [], 'pet_id', (pet) => optionText([pet.pet_name, pet.species, pet.owner_name]), 'All pets');
  fillSelect(document.querySelector('#addVaccinationForm [name="pet_id"]'), vaccinationsState.lookups.pets || [], 'pet_id', (pet) => optionText([pet.pet_name, pet.species, pet.owner_name]), 'Select pet');
  fillSelect(document.querySelector('#addVaccinationForm [name="adminstered_vet_id"]'), vaccinationsState.lookups.vets || [], 'vet_id', (vet) => optionText([vet.full_name, vet.email]), 'Select veterinarian');
  fillSelect(document.querySelector('#addVaccinationForm [name="product_id"]'), vaccinationsState.lookups.products || [], 'product_id', (product) => optionText([product.product_name, product.manufacturer, product.batch_number]), 'No product used');

  if (session.role === 'PetOwner') {
    byId('openVaccinationModal')?.classList.add('hidden');
  } else if (session.role === 'Veterinarian') {
    const vetField = document.querySelector('#addVaccinationForm [name="adminstered_vet_id"]');
    vetField?.closest('label')?.classList.add('hidden');
    if (vetField) vetField.required = false;
  }

  byId('openVaccinationModal')?.addEventListener('click', () => byId('addVaccinationModal')?.showModal());
  byId('vaccinationPetFilter')?.addEventListener('change', (event) => {
    vaccinationsState.petId = event.target.value;
    renderVaccinationsPage();
  });
  byId('vaccinationStatusFilter')?.addEventListener('change', (event) => {
    vaccinationsState.status = event.target.value;
    renderVaccinationsPage();
  });
  byId('vaccinationSearch')?.addEventListener('input', (event) => {
    vaccinationsState.search = event.target.value.trim().toLowerCase();
    renderVaccinationsPage();
  });
  wireForm('addVaccinationForm', handleAddVaccination);
  await loadVaccinationsTable();
}

async function loadVaccinationsTable(petId = '') {
  const query = petId ? `?pet_id=${encodeURIComponent(petId)}` : '';
  const res = await apiFetch(`vaccinations.php${query}`);
  vaccinationsState.records = res.success ? (res.data || []) : [];
  if (!res.success) showNotice(res.message || 'Unable to load vaccinations', 'error');
  renderVaccinationsPage();
}

function vaccinationStatus(record) {
  const key = record.due_status || 'current';
  const labels = { overdue: 'Overdue', due_soon: 'Due soon', current: 'Current' };
  const classes = {
    overdue: 'bg-rose-50 text-rose-700 ring-rose-100',
    due_soon: 'bg-amber-50 text-amber-700 ring-amber-100',
    current: 'bg-teal-50 text-teal-700 ring-teal-100',
  };
  return { key, label: labels[key] || 'Current', className: classes[key] || classes.current };
}

function renderVaccinationsPage() {
  const filtered = vaccinationsState.records.filter((record) => {
    const status = vaccinationStatus(record).key;
    const matchesPet = !vaccinationsState.petId || Number(record.pet_id) === Number(vaccinationsState.petId);
    const matchesStatus = vaccinationsState.status === 'all' || status === vaccinationsState.status;
    const haystack = [record.vaccine_name, record.pet_name, record.vet_name, record.product_name].join(' ').toLowerCase();
    return matchesPet && matchesStatus && (!vaccinationsState.search || haystack.includes(vaccinationsState.search));
  });

  const stats = vaccinationsState.records.reduce((acc, record) => {
    acc.total += 1;
    acc[vaccinationStatus(record).key] += 1;
    return acc;
  }, { total: 0, overdue: 0, due_soon: 0, current: 0 });

  setText('vacc-stat-total', stats.total);
  setText('vacc-stat-overdue', stats.overdue);
  setText('vacc-stat-due-soon', stats.due_soon);
  setText('vacc-stat-current', stats.current);

  const tbody = document.querySelector('#vaccinations-table tbody');
  if (!tbody) return;
  tbody.innerHTML = filtered.length ? filtered.map((record) => {
    const status = vaccinationStatus(record);
    return `
      <tr class="border-b border-slate-200/70 hover:bg-slate-50">
        <td class="px-4 py-4 font-semibold text-slate-950">${escapeHtml(record.pet_name || 'Pet')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.vaccine_name)}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.product_name || record.batch_number || 'Not linked')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.date ? new Date(`${record.date}T00:00:00`).toLocaleDateString() : 'Not set')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.next_due_date ? new Date(`${record.next_due_date}T00:00:00`).toLocaleDateString() : 'Not set')}</td>
        <td class="px-4 py-4"><span class="rounded-full px-3 py-1 text-xs font-bold ring-1 ${status.className}">${status.label}</span></td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.vet_name || 'Clinic')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(record.reaction_noted || 'No reaction noted')}</td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="8" class="px-4 py-8 text-center text-slate-500">No vaccination records found.</td></tr>`;
}

async function handleAddVaccination(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    pet_id: Number(form.pet_id.value),
    adminstered_vet_id: form.adminstered_vet_id.value ? Number(form.adminstered_vet_id.value) : null,
    vaccine_name: form.vaccine_name.value.trim(),
    product_id: form.product_id.value ? Number(form.product_id.value) : null,
    batch_number: form.batch_number.value.trim() || null,
    date: form.date.value,
    next_due_date: form.next_due_date.value || null,
    reaction_noted: form.reaction_noted.value.trim() || null,
    notes: form.notes.value.trim() || null,
  };

  const res = await apiFetch('vaccinations.php', 'POST', payload);
  if (!res.success) {
    showNotice(res.message || 'Unable to add vaccination', 'error');
    return;
  }

  form.reset();
  byId('addVaccinationModal')?.close();
  showNotice('Vaccination record added.', 'success');
  await loadVaccinationsTable();
}

async function initInvoicesPage() {
  const session = await bootPage('invoices.html');
  if (!session) return;
  if (session.role !== 'Admin') {
    byId('openInvoiceModal')?.classList.add('hidden');
  }
  await loadInvoicesTable();
  byId('openInvoiceModal')?.addEventListener('click', () => byId('addInvoiceModal')?.showModal());
  wireForm('addInvoiceForm', handleAddInvoice);
  wireForm('paymentForm', handleInvoicePayment);
  byId('closePaymentModal')?.addEventListener('click', () => byId('paymentModal')?.close());
}

async function loadInvoicesTable() {
  const res = await apiFetch('invoices.php');
  const tbody = document.querySelector('#invoices-table tbody');
  if (!tbody) return;

  tbody.innerHTML = res.success && res.data.length
    ? res.data.map((invoice) => `
      <tr class="border-b border-slate-200/70 hover:bg-slate-50">
        <td class="px-4 py-4">
          <div class="font-semibold text-slate-950">INV-${escapeHtml(invoice.invoice_id)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(invoice.payment_reference || 'No receipt yet')}</div>
        </td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(invoice.pet_name || 'Pet')}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(invoice.scheduled_date ? new Date(invoice.scheduled_date).toLocaleString() : `#${invoice.appointment_id}`)}</td>
        <td class="px-4 py-4 font-semibold text-slate-950">${money(invoice.total_amount)}</td>
        <td class="px-4 py-4">${invoiceStatusBadge(invoice.payment_status)}</td>
        <td class="px-4 py-4 text-right">${invoiceActions(invoice)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">${escapeHtml(res.message || 'No invoices found.')}</td></tr>`;

  window.lucide?.createIcons();
}

function invoiceActions(invoice) {
  const role = sessionStorage.getItem('role');
  if (role === 'PetOwner' && ['pending', 'overdue'].includes(invoice.payment_status)) {
    return `<button data-pay-invoice="${invoice.invoice_id}" data-pay-amount="${Number(invoice.total_amount || 0)}" class="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white transition-all duration-300 hover:bg-slate-950"><i data-lucide="credit-card" class="h-4 w-4"></i> Pay Online</button>`;
  }

  return '';
}

function invoiceStatusBadge(status) {
  const classes = {
    paid: 'bg-teal-50 text-teal-700 ring-teal-100',
    pending: 'bg-amber-50 text-amber-700 ring-amber-100',
    overdue: 'bg-rose-50 text-rose-700 ring-rose-100',
    refunded: 'bg-slate-100 text-slate-700 ring-slate-200',
  };
  return `<span class="rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${classes[status] || classes.pending}">${escapeHtml(status || 'pending')}</span>`;
}

function openPaymentModal(invoiceId, amount) {
  const modal = byId('paymentModal');
  const form = byId('paymentForm');
  if (!modal || !form) return;

  form.reset();
  form.invoice_id.value = invoiceId;
  byId('paymentAmount').textContent = money(amount);
  modal.showModal();
}

async function handleInvoicePayment(event) {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  const payload = {
    action: 'pay_invoice',
    invoice_id: Number(form.invoice_id.value),
    payment_method: form.payment_method.value,
    cardholder_name: form.cardholder_name.value.trim(),
    card_number: form.card_number.value.replace(/\s+/g, ''),
    expiry: form.expiry.value.trim(),
    cvv: form.cvv.value.trim(),
  };

  button.disabled = true;
  button.textContent = 'Processing...';
  const res = await apiFetch('invoices.php', 'POST', payload);
  button.disabled = false;
  button.textContent = 'Pay Securely';

  if (!res.success) {
    showNotice(res.message || 'Payment failed', 'error');
    return;
  }

  byId('paymentModal')?.close();
  showNotice(res.message || `Payment successful. Receipt ${res.reference || ''}`, 'success');
  await loadInvoicesTable();
}

let productsState = {
  items: [],
  filtered: [],
  orders: [],
  filter: 'all',
  search: '',
  role: '',
  selectedProduct: null,
};

async function initProductsPage() {
  const session = await bootPage('products.html', ['Admin', 'Veterinarian', 'PetOwner']);
  if (!session) return;

  productsState.role = session.role;
  if (session.role === 'Admin') {
    setText('productAccessNote', 'Admin inventory controls');
    byId('productAccessNote')?.classList.remove('hidden');
  } else if (session.role === 'Veterinarian') {
    byId('openProductModal')?.classList.add('hidden');
    setText('productAccessNote', 'Read-only clinical access');
    byId('productAccessNote')?.classList.remove('hidden');
  } else {
    byId('openProductModal')?.classList.add('hidden');
    setText('productAccessNote', 'Online delivery and pickup');
    byId('productAccessNote')?.classList.remove('hidden');
  }

  byId('openProductModal')?.addEventListener('click', () => openProductModal());
  byId('productSearch')?.addEventListener('input', (event) => {
    productsState.search = event.target.value.trim().toLowerCase();
    applyProductFilters();
  });
  document.querySelectorAll('[data-product-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      productsState.filter = button.dataset.productFilter;
      applyProductFilters();
    });
  });
  wireForm('productForm', handleSaveProduct);
  wireForm('productOrderForm', handleProductOrder);
  byId('productOrderForm')?.quantity?.addEventListener('input', updateProductOrderTotal);
  byId('productOrderForm')?.delivery_method?.addEventListener('change', updateProductOrderTotal);
  byId('refreshProductOrders')?.addEventListener('click', loadProductOrders);

  await loadProducts();
  if (session.role === 'Admin' || session.role === 'PetOwner') {
    byId('productOrdersPanel')?.classList.remove('hidden');
    setText('productOrdersTitle', session.role === 'Admin' ? 'Customer Product Orders' : 'My Product Orders');
    await loadProductOrders();
  }
}

async function loadProducts() {
  const res = await apiFetch('products.php');
  if (!res.success) {
    showNotice(res.message || 'Unable to load products', 'error');
    productsState.items = [];
    productsState.filtered = [];
    renderProducts();
    updateProductStats();
    return;
  }

  productsState.items = res.data || [];
  applyProductFilters();
}

async function loadProductOrders() {
  const panel = byId('productOrdersPanel');
  if (!panel || productsState.role === 'Veterinarian') return;

  const res = await apiFetch('product_orders.php');
  productsState.orders = res.success ? (res.data || []) : [];
  if (!res.success) {
    showNotice(res.message || 'Unable to load product orders', 'error');
  }
  renderProductOrders();
}

function productStatus(product) {
  const stock = Number(product.stock_quantity || 0);
  const expiry = product.expiry_date ? new Date(`${product.expiry_date}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry && expiry < today) return { key: 'expired', label: 'Expired', className: 'bg-rose-50 text-rose-700 ring-rose-200' };
  if (stock < 5) return { key: 'low', label: 'Low stock', className: 'bg-amber-50 text-amber-700 ring-amber-200' };
  return { key: 'ready', label: 'Ready', className: 'bg-teal-50 text-teal-700 ring-teal-200' };
}

function applyProductFilters() {
  const { items, search, filter } = productsState;
  productsState.filtered = items.filter((product) => {
    const status = productStatus(product).key;
    const matchesSearch = !search
      || String(product.product_name || '').toLowerCase().includes(search)
      || String(product.manufacturer || '').toLowerCase().includes(search)
      || String(product.batch_number || '').toLowerCase().includes(search);
    const matchesFilter = filter === 'all' || status === filter;
    return matchesSearch && matchesFilter;
  });

  renderProductFilterButtons();
  renderProducts();
  updateProductStats();
}

function renderProductFilterButtons() {
  document.querySelectorAll('[data-product-filter]').forEach((button) => {
    const active = button.dataset.productFilter === productsState.filter;
    button.className = `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all duration-300 ${active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'}`;
  });
}

function updateProductStats() {
  const stats = productsState.items.reduce((acc, product) => {
    const status = productStatus(product).key;
    const stock = Number(product.stock_quantity || 0);
    const price = Number(product.price || 0);
    acc.total += 1;
    acc.value += stock * price;
    if (status === 'low') acc.low += 1;
    if (status === 'expired') acc.expired += 1;
    return acc;
  }, { total: 0, low: 0, expired: 0, value: 0 });

  setText('product-stat-total', stats.total);
  setText('product-stat-low', stats.low);
  setText('product-stat-expired', stats.expired);
  setText('product-stat-value', money(stats.value));
}

function renderProducts() {
  const grid = byId('productsGrid');
  if (!grid) return;

  if (!productsState.filtered.length) {
    grid.innerHTML = `
      <div class="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><i data-lucide="package-search" class="h-6 w-6"></i></div>
        <h3 class="mt-4 text-lg font-semibold text-slate-950">No products found</h3>
        <p class="mt-1 text-sm text-slate-500">Try a different search or inventory filter.</p>
      </div>
    `;
    window.lucide?.createIcons();
    return;
  }

  grid.innerHTML = productsState.filtered.map((product) => {
    const status = productStatus(product);
    const stock = Number(product.stock_quantity || 0);
    const price = Number(product.price || 0);
    const canManage = productsState.role === 'Admin';
    const canOrder = productsState.role === 'PetOwner' && status.key !== 'expired' && stock > 0;
    const prescriptionBadge = Number(product.requires_prescription || 0) === 1
      ? '<span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">Prescription required</span>'
      : '';
    const imageUrl = mediaUrl(product.primary_photo);
    return `
      <article class="flex min-h-[320px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <div class="h-40 overflow-hidden rounded-t-lg bg-slate-100">
          ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.product_name)}" class="h-full w-full object-cover" />` : '<div class="flex h-full items-center justify-center text-slate-400"><i data-lucide="image-plus" class="h-9 w-9"></i></div>'}
        </div>
        <div class="border-b border-slate-100 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">${escapeHtml(product.manufacturer || 'Manufacturer')}</p>
              <h3 class="mt-2 text-xl font-semibold leading-tight text-slate-950">${escapeHtml(product.product_name)}</h3>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-2">
              <span class="rounded-full px-3 py-1 text-xs font-bold ring-1 ${status.className}">${status.label}</span>
              ${prescriptionBadge}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 p-5 text-sm">
          ${productMetric('Stock', `${stock} units`, stock < 5 ? 'text-amber-700' : 'text-slate-950')}
          ${productMetric('Unit Price', money(price), 'text-slate-950')}
          ${productMetric('Batch', product.batch_number || 'Not set', 'text-slate-700')}
          ${productMetric('Expiry', product.expiry_date ? new Date(`${product.expiry_date}T00:00:00`).toLocaleDateString() : 'Not set', status.key === 'expired' ? 'text-rose-700' : 'text-slate-700')}
        </div>
        <div class="mx-5 min-h-[68px] rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          ${escapeHtml(product.description || 'No storage notes or usage details recorded yet.')}
        </div>
        <div class="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 p-5">
          <div class="text-sm">
            <p class="text-slate-500">Inventory value</p>
            <p class="font-semibold text-slate-950">${money(stock * price)}</p>
          </div>
          ${canManage ? `
            <div class="flex gap-2">
              <button type="button" data-edit-product="${product.product_id}" class="rounded-lg border border-slate-200 p-2 text-slate-600 transition-all duration-300 hover:border-indigo-300 hover:text-indigo-700" aria-label="Edit product"><i data-lucide="pencil" class="h-4 w-4"></i></button>
              <button type="button" data-delete-product="${product.product_id}" class="rounded-lg border border-rose-200 p-2 text-rose-700 transition-all duration-300 hover:bg-rose-600 hover:text-white" aria-label="Delete product"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
            </div>
          ` : canOrder ? `
            <button type="button" data-order-product="${product.product_id}" class="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-slate-950">
              <i data-lucide="truck" class="h-4 w-4"></i> Order
            </button>
          ` : '<span class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">Read only</span>'}
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => openProductModal(Number(button.dataset.editProduct)));
  });
  grid.querySelectorAll('[data-delete-product]').forEach((button) => {
    button.addEventListener('click', () => deleteProduct(Number(button.dataset.deleteProduct)));
  });
  grid.querySelectorAll('[data-order-product]').forEach((button) => {
    button.addEventListener('click', () => openProductOrderModal(Number(button.dataset.orderProduct)));
  });
  window.lucide?.createIcons();
}

function productMetric(label, value, valueClass) {
  return `
    <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">${escapeHtml(label)}</p>
      <p class="mt-1 font-semibold ${valueClass}">${escapeHtml(value)}</p>
    </div>
  `;
}

function openProductModal(productId = null) {
  if (productsState.role !== 'Admin') return;
  const modal = byId('productModal');
  const form = byId('productForm');
  if (!modal || !form) return;

  form.reset();
  const product = productId ? productsState.items.find((item) => Number(item.product_id) === productId) : null;
  byId('productModalTitle').textContent = product ? 'Edit Vaccination Product' : 'Add Vaccination Product';
  form.product_id.value = product?.product_id || '';
  form.product_name.value = product?.product_name || '';
  form.manufacturer.value = product?.manufacturer || '';
  form.batch_number.value = product?.batch_number || '';
  form.expiry_date.value = product?.expiry_date || '';
  form.stock_quantity.value = product?.stock_quantity ?? 0;
  form.price.value = product?.price ?? '';
  form.description.value = product?.description || '';
  form.is_customer_visible.checked = product ? Number(product.is_customer_visible || 0) === 1 : true;
  form.delivery_available.checked = product ? Number(product.delivery_available || 0) === 1 : true;
  form.requires_prescription.checked = product ? Number(product.requires_prescription || 0) === 1 : false;
  modal.showModal();
}

async function handleSaveProduct(event) {
  event.preventDefault();
  const form = event.target;
  const productId = form.product_id.value ? Number(form.product_id.value) : null;
  let photoUrl = null;
  try {
    photoUrl = await uploadImage(form.photo?.files?.[0], 'products', productId || 0);
  } catch (error) {
    showNotice(error.message, 'error');
    return;
  }
  const payload = {
    product_name: form.product_name.value.trim(),
    manufacturer: form.manufacturer.value.trim(),
    batch_number: form.batch_number.value.trim() || null,
    expiry_date: form.expiry_date.value || null,
    stock_quantity: Number(form.stock_quantity.value || 0),
    price: form.price.value ? Number(form.price.value) : null,
    description: form.description.value.trim() || null,
    is_customer_visible: form.is_customer_visible.checked ? 1 : 0,
    delivery_available: form.delivery_available.checked ? 1 : 0,
    requires_prescription: form.requires_prescription.checked ? 1 : 0,
  };
  if (photoUrl) payload.photo_url = photoUrl;

  if (productId) payload.product_id = productId;

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Saving...';
  const res = await apiFetch('products.php', productId ? 'PUT' : 'POST', payload);
  button.disabled = false;
  button.textContent = 'Save Product';

  if (!res.success) {
    showNotice(res.message || 'Unable to save product', 'error');
    return;
  }

  byId('productModal')?.close();
  showNotice(res.message || 'Product saved', 'success');
  await loadProducts();
}

async function deleteProduct(productId) {
  if (productsState.role !== 'Admin') return;
  if (!window.confirm('Delete this product? This action cannot be undone.')) return;

  const res = await apiFetch('products.php', 'DELETE', { product_id: productId });
  showNotice(res.message || (res.success ? 'Product deleted' : 'Delete failed'), res.success ? 'success' : 'error');
  if (res.success) await loadProducts();
}

function openProductOrderModal(productId) {
  if (productsState.role !== 'PetOwner') return;
  const product = productsState.items.find((item) => Number(item.product_id) === productId);
  const modal = byId('productOrderModal');
  const form = byId('productOrderForm');
  if (!product || !modal || !form) return;

  productsState.selectedProduct = product;
  form.reset();
  form.product_id.value = product.product_id;
  form.quantity.value = 1;
  form.delivery_method.value = Number(product.delivery_available || 0) === 1 ? 'delivery' : 'pickup';
  byId('orderProductName').textContent = product.product_name;
  byId('orderProductPrice').textContent = money(product.price || 0);
  byId('orderProductStock').textContent = `${product.stock_quantity || 0} available`;
  form.quantity.max = String(Math.max(1, Number(product.stock_quantity || 1)));
  updateProductOrderTotal();
  modal.showModal();
}

function updateProductOrderTotal() {
  const form = byId('productOrderForm');
  const product = productsState.selectedProduct;
  if (!form || !product) return;
  const quantity = Math.max(1, Number(form.quantity.value || 1));
  const deliveryFee = form.delivery_method.value === 'delivery' ? 5 : 0;
  const total = (Number(product.price || 0) * quantity) + deliveryFee;
  setText('orderTotal', money(total));
}

async function handleProductOrder(event) {
  event.preventDefault();
  const form = event.target;
  const deliveryMethod = form.delivery_method.value;
  const payload = {
    product_id: Number(form.product_id.value),
    quantity: Number(form.quantity.value || 1),
    delivery_method: deliveryMethod,
    delivery_address: form.delivery_address.value.trim(),
    contact_phone: form.contact_phone.value.trim(),
    requested_delivery_date: form.requested_delivery_date.value || null,
    notes: form.notes.value.trim() || null,
  };

  if (deliveryMethod === 'pickup') {
    payload.delivery_address = '';
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Placing order...';
  const res = await apiFetch('product_orders.php', 'POST', payload);
  button.disabled = false;
  button.textContent = 'Place Order';

  if (!res.success) {
    showNotice(res.message || 'Unable to place order', 'error');
    return;
  }

  byId('productOrderModal')?.close();
  showNotice(res.message || 'Order placed', 'success');
  await loadProducts();
  await loadProductOrders();
}

function renderProductOrders() {
  const tbody = document.querySelector('#product-orders-table tbody');
  if (!tbody) return;

  tbody.innerHTML = productsState.orders.length
    ? productsState.orders.map((order) => `
      <tr class="border-b border-slate-200/70 hover:bg-slate-50">
        <td class="px-4 py-4">
          <div class="font-semibold text-slate-950">ORD-${escapeHtml(order.order_id)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(order.customer_name || 'Customer')}</div>
        </td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(order.items_summary || 'Product order')}</td>
        <td class="px-4 py-4 text-slate-600">
          <div class="font-semibold capitalize text-slate-950">${escapeHtml(order.delivery_method || 'delivery')}</div>
          <div class="max-w-xs truncate text-xs">${escapeHtml(order.delivery_address || 'Clinic pickup')}</div>
        </td>
        <td class="px-4 py-4 font-semibold text-slate-950">${money(order.total_amount)}</td>
        <td class="px-4 py-4">${productOrderStatusControl(order)}</td>
        <td class="px-4 py-4 text-slate-600">${escapeHtml(new Date(order.created_at).toLocaleString())}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No product orders yet.</td></tr>`;

  tbody.querySelectorAll('[data-product-order-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      const res = await apiFetch('product_orders.php', 'POST', {
        order_id: Number(select.dataset.productOrderStatus),
        status: select.value,
      });
      showNotice(res.message || (res.success ? 'Order updated' : 'Update failed'), res.success ? 'success' : 'error');
      await loadProductOrders();
    });
  });
}

function productOrderStatusControl(order) {
  const statuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (productsState.role === 'Admin') {
    return `
      <select data-product-order-status="${order.order_id}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        ${statuses.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status.replaceAll('_', ' ')}</option>`).join('')}
      </select>
    `;
  }

  return `<span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">${escapeHtml(String(order.status || 'pending').replaceAll('_', ' '))}</span>`;
}

async function handleAddInvoice(event) {
  event.preventDefault();
  const form = event.target;
  const res = await apiFetch('invoices.php', 'POST', {
    appointment_id: Number(form.appointment_id.value),
    total_amount: Number(form.total_amount.value),
    payment_status: form.payment_status.value,
    payment_method: form.payment_method.value.trim() || null,
  });

  if (!res.success) {
    showNotice(res.message || 'Unable to create invoice', 'error');
    return;
  }

  form.reset();
  byId('addInvoiceModal')?.close();
  showNotice('Invoice created.', 'success');
  await loadInvoicesTable();
}

function wireForm(id, handler) {
  byId(id)?.addEventListener('submit', handler);
}

document.addEventListener('change', async (event) => {
  const statusSelect = event.target.closest('[data-appt-status]');
  if (!statusSelect) return;

  const res = await apiFetch('appointments.php', 'POST', {
    action: 'update_status',
    appointment_id: Number(statusSelect.dataset.apptStatus),
    status: statusSelect.value,
  });
  showNotice(res.message || (res.success ? 'Appointment updated' : 'Update failed'), res.success ? 'success' : 'error');
  await loadAppointmentsTable();
});

document.addEventListener('click', async (event) => {
  const cancelButton = event.target.closest('[data-cancel-appt]');
  if (cancelButton) {
    const res = await apiFetch('appointments.php', 'POST', {
      action: 'update_status',
      appointment_id: Number(cancelButton.dataset.cancelAppt),
      status: 'cancelled',
    });
    showNotice(res.message || (res.success ? 'Appointment cancelled' : 'Unable to cancel'), res.success ? 'success' : 'error');
    await loadAppointmentsTable();
    return;
  }

  const payButton = event.target.closest('[data-pay-invoice]');
  if (payButton) {
    openPaymentModal(Number(payButton.dataset.payInvoice), Number(payButton.dataset.payAmount || 0));
  }
});

export {
  handleLogin,
  handleRegister,
  handleSetupAdmin,
  handleLogout,
  initDashboard,
  initAdminPanel,
  initManageVets,
  initPetsPage,
  initAppointmentsPage,
  initHealthRecordsPage,
  initVaccinationsPage,
  initProductsPage,
  initInvoicesPage,
  loadPetsTable,
  handleAddPet,
  loadAppointmentsTable,
  handleAddAppointment,
  loadHealthRecords,
  handleAddHealthRecord,
  loadVaccinationsTable,
  handleAddVaccination,
  loadInvoicesTable,
  handleAddInvoice,
  wireForm,
  addLogoutListener,
};
