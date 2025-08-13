// ===== DOM Elements =====
const signupBtn = document.getElementById('signupBtn');
const signupModal = document.getElementById('signupModal');
const closeSignupModal = document.getElementById('closeSignupModal');
const signupForm = document.getElementById('signupForm');

const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginForm = document.getElementById('loginForm');

const createBtn = document.getElementById('createBtn');
const createModal = document.getElementById('createModal');
const closeCreateModal = document.getElementById('closeCreateModal');
const createPinForm = document.getElementById('createPinForm');

const pinsContainer = document.getElementById('pinsContainer');
const explorePinsContainer = document.getElementById('explorePinsContainer');
const navLinks = document.querySelectorAll('.nav-link');
const categories = document.querySelectorAll('.category');
const searchInput = document.getElementById('searchInput');

const imageUploadContainer = document.getElementById('imageUploadContainer');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');

let uploadedImage = null;
let currentUser = null;
let pinsData = [];
const API_URL = "http://localhost:3001/api";

// ===== LOAD SESSION =====
window.addEventListener('load', async () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    loginBtn.textContent = "Log out";
    createBtn.style.display = 'inline-block';
  }
  await loadPinsFromServer();
});

// ===== LOAD PINS FROM SERVER =====
async function loadPinsFromServer() {
  try {
    const res = await fetch(`${API_URL}/pins`);
    pinsData = await res.json();
    renderAllPins();
  } catch (err) {
    console.error('Failed to load pins:', err);
  }
}

// ===== RENDER PINS =====
function renderPins(pins, container) {
  if (!container) return;
  container.innerHTML = '';
  pins.forEach(pin => {
    const pinElement = document.createElement('div');
    pinElement.className = 'pin';
    pinElement.innerHTML = `
      <img src="${pin.imageUrl}" alt="${pin.title}" class="pin-image" />
      <div class="pin-info">
        <h3 class="pin-title">${pin.title}</h3>
        <p class="pin-desc">${pin.description || ''}</p>
        ${currentUser ? `<button class="delete-btn" data-id="${pin.id}">
          <i class="fas fa-trash"></i> Delete
        </button>` : ''}
      </div>
    `;
    container.appendChild(pinElement);
  });

  // Delete buttons
  const deleteButtons = container.querySelectorAll('.delete-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('Delete this pin?')) {
        await deletePin(id);
      }
    });
  });
}

function renderAllPins() {
  renderPins(pinsData, pinsContainer);
  renderPins(pinsData, explorePinsContainer);
}

// ===== DELETE PIN =====
async function deletePin(id) {
  try {
    const res = await fetch(`${API_URL}/pins/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await loadPinsFromServer();
  } catch (err) {
    alert(err.message);
  }
}

// ===== IMAGE UPLOAD PREVIEW =====
imageUploadContainer.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    uploadedImage = file; // store file object for FormData
    imagePreview.src = evt.target.result;
    imagePreview.style.display = 'block';
    imageUploadContainer.querySelector('i').style.display = 'none';
    imageUploadContainer.querySelector('p').style.display = 'none';
  };
  reader.readAsDataURL(file);
});

// ===== CREATE PIN =====
createBtn.addEventListener('click', () => {
  if (!currentUser) return loginModal.classList.add('active');
  createModal.classList.add('active');
});
closeCreateModal.addEventListener('click', resetCreateModal);

function resetCreateModal() {
  createModal.classList.remove('active');
  createPinForm.reset();
  uploadedImage = null;
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  imageUploadContainer.querySelector('i').style.display = 'block';
  imageUploadContainer.querySelector('p').style.display = 'block';
}

createPinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('pinTitle').value.trim();
  const description = document.getElementById('pinDescription').value.trim();
  const category = document.getElementById('pinCategory').value;

  if (!title || !uploadedImage) return alert('Title and image are required');

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('category', category);
  formData.append('image', uploadedImage);

  try {
    const res = await fetch(`${API_URL}/pins`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to create pin');
    await loadPinsFromServer();
    resetCreateModal();
    document.querySelector('[data-page="home"]').click();
  } catch (err) {
    alert(err.message);
  }
});

// ===== NAVIGATION =====
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    if (link.dataset.page === 'home') {
      document.getElementById('homePage').style.display = 'block';
      document.getElementById('explorePage').style.display = 'none';
      renderPins(pinsData, pinsContainer);
    } else {
      document.getElementById('homePage').style.display = 'none';
      document.getElementById('explorePage').style.display = 'block';
      renderPins(pinsData, explorePinsContainer);
    }
  });
});

// ===== CATEGORY FILTER =====
categories.forEach(cat => {
  cat.addEventListener('click', () => {
    categories.forEach(c => c.classList.remove('active'));
    cat.classList.add('active');
    const catName = cat.dataset.category;
    if (catName === 'all') return renderPins(pinsData, explorePinsContainer);
    const filtered = pinsData.filter(p => p.category === catName);
    renderPins(filtered, explorePinsContainer);
  });
});

// ===== SEARCH =====
searchInput.addEventListener('input', e => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = pinsData.filter(pin =>
    pin.title.toLowerCase().includes(query) ||
    (pin.description && pin.description.toLowerCase().includes(query)) ||
    pin.category.toLowerCase().includes(query)
  );
  const activePage = document.querySelector('.page-content:not([style*="display: none"])').id;
  if (activePage === 'homePage') {
    renderPins(filtered, pinsContainer);
  } else {
    renderPins(filtered, explorePinsContainer);
  }
});

// ===== SIGNUP =====
signupBtn.addEventListener('click', () => signupModal.classList.add('active'));
closeSignupModal.addEventListener('click', () => signupModal.classList.remove('active'));

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    alert('Registration successful! You can now log in.');
    signupModal.classList.remove('active');
    signupForm.reset();
  } catch (err) {
    alert(err.message);
  }
});

// ===== LOGIN =====
loginBtn.addEventListener('click', () => {
  if (currentUser) {
    localStorage.removeItem('currentUser');
    currentUser = null;
    loginBtn.textContent = "Log in";
    createBtn.style.display = 'none';
  } else {
    loginModal.classList.add('active');
  }
});
closeLoginModal.addEventListener('click', () => loginModal.classList.remove('active'));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    currentUser = { email: data.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    loginBtn.textContent = "Log out";
    createBtn.style.display = 'inline-block';
    loginModal.classList.remove('active');
    loginForm.reset();
  } catch (err) {
    alert(err.message);
  }
});
