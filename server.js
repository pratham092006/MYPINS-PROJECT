const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ✅ Ensure folders exist
const IMG_DIR = path.join(__dirname, 'IMG');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ✅ Serve folders
app.use('/IMG', express.static(IMG_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, '.')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------------- USERS ----------------
const USERS_FILE = path.join(__dirname, 'users.json');
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  let users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists.' });
  }
  users.push({ email, password });
  writeUsers(users);
  res.status(201).json({ message: 'Registration successful', email });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  let users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
  res.json({ message: 'Login successful', email: user.email });
});

// ---------------- PINS ----------------
const PINS_FILE = path.join(__dirname, 'pins.json');

// Default pins
const defaultPins = [
  { id: 1, title: "Modern Living Room", description: "Contemporary design with minimalist approach", imageUrl: "/IMG/ModernLivingRoom.png", category: "design" },
  { id: 2, title: "Healthy Breakfast", description: "Start your day with nutritious meals", imageUrl: "/IMG/Breakfast.png", category: "food" },
  { id: 3, title: "Mountain Escape", description: "Breathtaking views for nature lovers", imageUrl: "/IMG/Mountain.png", category: "travel" },
  { id: 4, title: "Abstract Painting", description: "Colorful modern art piece", imageUrl: "/IMG/Painting.png", category: "art" },
  { id: 5, title: "Portrait Photography", description: "Professional portrait techniques", imageUrl: "/IMG/PortraitPhoto.png", category: "photography" },
  { id: 6, title: "Italian Cuisine", description: "Authentic pasta recipes", imageUrl: "/IMG/ItalianCuisine.png", category: "food" }
];

function readPins() {
  if (!fs.existsSync(PINS_FILE)) {
    fs.writeFileSync(PINS_FILE, JSON.stringify(defaultPins, null, 2));
    return defaultPins;
  }
  let pins = JSON.parse(fs.readFileSync(PINS_FILE, 'utf8'));
  if (!Array.isArray(pins) || pins.length === 0) {
    pins = defaultPins;
    fs.writeFileSync(PINS_FILE, JSON.stringify(pins, null, 2));
  }
  return pins;
}

function writePins(pins) {
  fs.writeFileSync(PINS_FILE, JSON.stringify(pins, null, 2));
}

app.get('/api/pins', (req, res) => {
  res.json(readPins());
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

app.post('/api/pins', upload.single('image'), (req, res) => {
  const { title, description, category } = req.body;
  const file = req.file;
  if (!title || !file) return res.status(400).json({ error: 'Title and image required.' });

  const newPin = {
    id: Date.now(),
    title,
    description,
    category,
    imageUrl: `/uploads/${file.filename}`,
  };
  const pins = readPins();
  pins.unshift(newPin);
  writePins(pins);
  res.status(201).json(newPin);
});

app.delete('/api/pins/:id', (req, res) => {
  const id = Number(req.params.id);
  let pins = readPins();
  const pin = pins.find(p => p.id === id);
  if (!pin) return res.status(404).json({ error: 'Pin not found' });

  if (pin.imageUrl && pin.imageUrl.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS_DIR, path.basename(pin.imageUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  pins = pins.filter(p => p.id !== id);
  writePins(pins);
  res.json({ message: 'Pin deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
