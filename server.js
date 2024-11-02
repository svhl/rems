const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();
const port = 3000;

// Create MySQL connection
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'rajagiri'
});

connection.connect((err) => {
	if (err) {
		console.error('Error connecting to the database:', err.stack);
		return;
	}
	console.log('Connected to the database.');
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session management
app.use(session({
	secret: 'your-secret-key',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false } // set to true if using HTTPS
}));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Authentication endpoint for students
app.post('/api/stud-login', (req, res) => {
	const { username, password } = req.body;

	// Query to fetch user data from the database
	const sql = 'SELECT * FROM students WHERE uid = ?';
	connection.query(sql, [username], (error, results) => {
		if (error) {
			console.error('Error querying user:', error);
			return res.status(500).json({ error: 'Database query error' });
		}
		if (results.length === 0) {
			return res.status(401).json({ error: 'Invalid username or password' });
		}
		const user = results[0];
		// Directly compare passwords
		if (user.password === password) {
			req.session.user = user.name; // Assuming you want to store the name
			res.status(200).json({ message: 'Login successful' });
		} else {
			res.status(401).json({ error: 'Invalid username or password' });
		}
	});
});

// Authentication endpoint for teachers
app.post('/api/teach-login', (req, res) => {
	const { username, password } = req.body;

	// Query to fetch user data from the database
	const sql = 'SELECT * FROM teachers WHERE uid = ?';
	connection.query(sql, [username], (error, results) => {
		if (error) {
			console.error('Error querying user:', error);
			return res.status(500).json({ error: 'Database query error' });
		}
		if (results.length === 0) {
			return res.status(401).json({ error: 'Invalid username or password' });
		}
		const user = results[0];
		// Directly compare passwords
		if (user.password === password) {
			req.session.user = user.username;
			res.status(200).json({ message: 'Login successful' });
		} else {
			res.status(401).json({ error: 'Invalid username or password' });
		}
	});
});

// Endpoint to check authentication
app.get('/api/check-auth', (req, res) => {
	if (req.session.user) {
		res.status(200).json({ message: 'Authenticated' });
	} else {
		res.status(401).json({ message: 'Not authenticated' });
	}
});

app.get('/api/events', (req, res) => {
	const sql = 'SELECT name, start_date, end_date, start_time, end_time, points, fee, venue, link FROM events';
	connection.query(sql, (error, results) => {
		if (error) {
			console.error('Error fetching events:', error);
			return res.status(500).json({ error: 'Failed to fetch events' });
		}
		res.json(results);
	});
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		res.status(401).json({ message: 'Unauthorized' });
	}
}

// Start the server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});

