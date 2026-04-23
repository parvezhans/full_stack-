const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'jobportal_secret_key_2026';

app.use(cors());
app.use(express.json());

// ─── In-Memory Database ───────────────────────────────────────────────────────
let users = [
  {
    id: 1,
    fullName: 'Alice Johnson',
    email: 'alice@example.com',
    password: bcrypt.hashSync('password123', 10),
    experience: 3,
    skills: 'React, Node.js, JavaScript',
    role: 'applicant',
    appliedJobs: []
  }
];

let admins = [
  {
    id: 1,
    email: 'admin@jobportal.com',
    password: bcrypt.hashSync('admin1234', 10),
    name: 'Admin'
  }
];

let jobs = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    company: 'TechCorp Solutions',
    location: 'Bangalore',
    experience: '3-5 years',
    minExp: 3,
    maxExp: 5,
    salary: '₹15-25 LPA',
    type: 'Full-time',
    skills: ['React', 'JavaScript', 'CSS', 'TypeScript'],
    description: 'We are looking for a skilled Frontend Developer to join our team. You will be responsible for building scalable, responsive web applications.',
    postedDate: new Date('2026-04-10').toISOString(),
    category: 'Engineering',
    applicants: 42
  },
  {
    id: 2,
    title: 'Backend Engineer',
    company: 'DataFlow Inc.',
    location: 'Mumbai',
    experience: '2-4 years',
    minExp: 2,
    maxExp: 4,
    salary: '₹12-20 LPA',
    type: 'Full-time',
    skills: ['Node.js', 'MongoDB', 'REST API', 'Docker'],
    description: 'Join our backend team to build high-performance APIs and microservices for our growing platform.',
    postedDate: new Date('2026-04-12').toISOString(),
    category: 'Engineering',
    applicants: 31
  },
  {
    id: 3,
    title: 'UI/UX Designer',
    company: 'Creative Studio',
    location: 'Hyderabad',
    experience: '1-3 years',
    minExp: 1,
    maxExp: 3,
    salary: '₹8-14 LPA',
    type: 'Full-time',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    description: 'Looking for a creative designer to craft beautiful user experiences for web and mobile applications.',
    postedDate: new Date('2026-04-14').toISOString(),
    category: 'Design',
    applicants: 28
  },
  {
    id: 4,
    title: 'Data Scientist',
    company: 'Analytics Hub',
    location: 'Pune',
    experience: '2-5 years',
    minExp: 2,
    maxExp: 5,
    salary: '₹18-30 LPA',
    type: 'Full-time',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    description: 'Drive data-driven decisions by building predictive models and analyzing large datasets.',
    postedDate: new Date('2026-04-15').toISOString(),
    category: 'Data Science',
    applicants: 55
  },
  {
    id: 5,
    title: 'DevOps Engineer',
    company: 'CloudBase',
    location: 'Chennai',
    experience: '3-6 years',
    minExp: 3,
    maxExp: 6,
    salary: '₹20-35 LPA',
    type: 'Full-time',
    skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform'],
    description: 'Manage cloud infrastructure and implement DevOps best practices for our engineering teams.',
    postedDate: new Date('2026-04-16').toISOString(),
    category: 'Engineering',
    applicants: 19
  },
  {
    id: 6,
    title: 'Product Manager',
    company: 'StartupXYZ',
    location: 'Delhi',
    experience: '4-7 years',
    minExp: 4,
    maxExp: 7,
    salary: '₹25-40 LPA',
    type: 'Full-time',
    skills: ['Product Strategy', 'Agile', 'Analytics', 'Communication'],
    description: 'Lead product development from ideation to launch, working closely with engineering and design teams.',
    postedDate: new Date('2026-04-17').toISOString(),
    category: 'Management',
    applicants: 37
  },
  {
    id: 7,
    title: 'Mobile Developer (React Native)',
    company: 'AppWorks',
    location: 'Bangalore',
    experience: '2-4 years',
    minExp: 2,
    maxExp: 4,
    salary: '₹14-22 LPA',
    type: 'Full-time',
    skills: ['React Native', 'JavaScript', 'iOS', 'Android'],
    description: 'Build cross-platform mobile applications used by millions of users worldwide.',
    postedDate: new Date('2026-04-18').toISOString(),
    category: 'Engineering',
    applicants: 23
  },
  {
    id: 8,
    title: 'Content Writer',
    company: 'MediaBlast',
    location: 'Remote',
    experience: '0-2 years',
    minExp: 0,
    maxExp: 2,
    salary: '₹4-8 LPA',
    type: 'Part-time',
    skills: ['Writing', 'SEO', 'Research', 'Editing'],
    description: 'Create engaging content for blogs, social media, and marketing campaigns.',
    postedDate: new Date('2026-04-19').toISOString(),
    category: 'Marketing',
    applicants: 64
  }
];

let nextUserId = 2;
let nextJobId = 9;

// ─── Middleware ───────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password, experience, skills } = req.body;
  if (!fullName || !email || !password || experience === undefined || !skills) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: nextUserId++,
    fullName,
    email,
    password: hashed,
    experience: Number(experience),
    skills,
    role: 'applicant',
    appliedJobs: []
  };
  users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email, role: 'applicant' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, fullName, email, experience, skills } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: 'applicant' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, experience: user.experience, skills: user.skills } });
});

app.post('/api/auth/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = admins.find(a => a.email === email);
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

// ─── Jobs Routes ──────────────────────────────────────────────────────────────
app.get('/api/jobs', (req, res) => {
  const { title, location, minExp, maxExp } = req.query;
  let filtered = [...jobs];
  if (title) filtered = filtered.filter(j => j.title.toLowerCase().includes(title.toLowerCase()) || j.skills.some(s => s.toLowerCase().includes(title.toLowerCase())) || j.category.toLowerCase().includes(title.toLowerCase()));
  if (location) filtered = filtered.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
  if (minExp !== undefined && minExp !== '') filtered = filtered.filter(j => j.maxExp >= Number(minExp));
  if (maxExp !== undefined && maxExp !== '') filtered = filtered.filter(j => j.minExp <= Number(maxExp));
  res.json(filtered);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === Number(req.params.id));
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

app.post('/api/jobs', adminMiddleware, (req, res) => {
  const { title, company, location, experience, minExp, maxExp, salary, type, skills, description, category } = req.body;
  if (!title || !company || !location || !salary || !description) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  const job = {
    id: nextJobId++,
    title, company, location,
    experience: experience || `${minExp}-${maxExp} years`,
    minExp: Number(minExp) || 0,
    maxExp: Number(maxExp) || 5,
    salary, type: type || 'Full-time',
    skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean),
    description,
    postedDate: new Date().toISOString(),
    category: category || 'General',
    applicants: 0
  };
  jobs.push(job);
  res.status(201).json(job);
});

app.put('/api/jobs/:id', adminMiddleware, (req, res) => {
  const idx = jobs.findIndex(j => j.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Job not found' });
  jobs[idx] = { ...jobs[idx], ...req.body, id: jobs[idx].id };
  if (req.body.skills && !Array.isArray(req.body.skills)) {
    jobs[idx].skills = req.body.skills.split(',').map(s => s.trim()).filter(Boolean);
  }
  res.json(jobs[idx]);
});

app.delete('/api/jobs/:id', adminMiddleware, (req, res) => {
  const idx = jobs.findIndex(j => j.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Job not found' });
  jobs.splice(idx, 1);
  res.json({ message: 'Job deleted successfully' });
});

// ─── Apply for job ────────────────────────────────────────────────────────────
app.post('/api/jobs/:id/apply', authMiddleware, (req, res) => {
  const job = jobs.find(j => j.id === Number(req.params.id));
  if (!job) return res.status(404).json({ message: 'Job not found' });
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.appliedJobs.includes(job.id)) {
    return res.status(409).json({ message: 'Already applied to this job' });
  }
  user.appliedJobs.push(job.id);
  job.applicants += 1;
  res.json({ message: 'Application submitted successfully' });
});

app.get('/api/user/applied', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const appliedJobs = jobs.filter(j => user.appliedJobs.includes(j.id));
  res.json(appliedJobs);
});

// ─── Admin Stats ──────────────────────────────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  res.json({
    totalJobs: jobs.length,
    totalUsers: users.length,
    totalApplications: users.reduce((acc, u) => acc + u.appliedJobs.length, 0),
    categories: [...new Set(jobs.map(j => j.category))].length
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Job Portal API running on http://localhost:${PORT}`);
  console.log(`\n📋 Default credentials:`);
  console.log(`   Admin: admin@jobportal.com / admin1234`);
  console.log(`   User:  alice@example.com   / password123\n`);
});
