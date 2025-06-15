const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const app = express();
const port = 3000;
const multer = require("multer");
const upload = multer();

const connection = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "24June2004",
	database: "rajagiri",
});

connection.connect((err) => {
	if (err) {
		console.error("Error connecting to database:", err.stack);
		return;
	}
	console.log("Connected to database successfully");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	session({
		secret: "your-secret-key",
		resave: false,
		saveUninitialized: true,
		// set to true if using https
		cookie: { secure: false },
	})
);
app.use(express.static("public"));

app.post("/api/stud-login", (req, res) => {
	const { username, password } = req.body;

	const sql = "SELECT * FROM students WHERE uid = ?";
	connection.query(sql, [username], (error, results) => {
		if (error) {
			console.error("Error querying database:", error);
			return res.status(500).json({ error: "Error querying database" });
		}

		if (results.length === 0) {
			return res.status(401).json({ error: "Invalid username." });
		}

		const user = results[0];

		if (user.password === password) {
			req.session.user = { uid: user.uid, name: user.name };
			res.sendStatus(200);
		} else {
			res.status(401).json({ error: "Invalid password." });
		}
	});
});

app.post("/api/teach-login", (req, res) => {
	const { username, password } = req.body;

	const sql = "SELECT * FROM teachers WHERE uid = ?";
	connection.query(sql, [username], (error, results) => {
		if (error) {
			console.error("Error querying database:", error);
			return res.status(500).json({ error: "Error querying database" });
		}
		if (results.length === 0) {
			return res.status(401).json({ error: "Invalid username." });
		}
		const user = results[0];

		if (user.password === password) {
			req.session.user = { uid: user.uid, name: user.name };
			res.sendStatus(200);
		} else {
			res.status(401).json({ error: "Invalid password." });
		}
	});
});

app.get("/api/check-auth", (req, res) => {
	if (req.session.user) {
		res.sendStatus(200);
	} else {
		res.sendStatus(401);
	}
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
}

app.get("/api/events", (req, res) => {
	const { filter } = req.query;
	const uid = req.session.user.uid;

	let sql = `SELECT event_id, name, start_date, end_date, start_time, end_time, points, fee, venue, link
			   FROM events
			   WHERE event_id NOT IN (SELECT event_id FROM submissions WHERE uid = ?)
			   AND event_id NOT IN (SELECT event_id FROM myevents WHERE uid = ?)`;

	switch (filter) {
		case "upcoming":
			sql += " AND start_date > CURDATE() ORDER BY start_date ASC;";
			break;
		case "lastWeek":
			sql +=
				" AND (start_date >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK) AND start_date < CURDATE()) ORDER BY start_date ASC;";
			break;
		case "lastMonth":
			sql +=
				" AND (start_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND start_date < CURDATE()) ORDER BY start_date ASC;";
			break;
		case "lastSixMonths":
			sql +=
				" AND (start_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND start_date < CURDATE()) ORDER BY start_date ASC;";
			break;
		default:
			sql += " ORDER BY start_date ASC;";
			break;
	}

	connection.query(sql, [uid, uid], (error, results) => {
		if (error) {
			console.error("Error fetching events:", error);
			return res.status(500);
		}
		res.json(results);
	});
});

app.post("/api/submit", upload.single("certificate"), (req, res) => {
	const { event_id } = req.body;
	const uid = req.session.user.uid;

	// check file type
	// stud_events.html will check if file selected
	const allowedTypes = ["image/jpeg", "image/png"];
	if (!allowedTypes.includes(req.file.mimetype)) {
		return res
			.status(400)
			.json({ error: "Only JPG and PNG files allowed." });
	}

	const certificate = req.file.buffer;

	const sql =
		"INSERT INTO submissions (uid, event_id, certificate) VALUES (?, ?, ?)";
	connection.query(sql, [uid, event_id, certificate], (error, results) => {
		if (error) {
			return res.sendStatus(500);
		}
		res.sendStatus(200);
	});
});

app.get('/api/student-profile', (req, res) => {
console.log('Session UID:', req.session.user.uid);	
  if (!req.session.user || !req.session.user.uid) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const uid = req.session.user.uid;

 const sql = `
  SELECT s.uid, s.name, COALESCE(SUM(e.points), 0) AS points
  FROM students s
  LEFT JOIN myevents me ON me.uid = s.uid
  LEFT JOIN events e ON e.event_id = me.event_id
  WHERE s.uid = ?
  GROUP BY s.uid, s.name
`;


  connection.query(sql, [uid], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = results[0];

    res.json({
      uid: student.uid,
      name: student.name,
      points: student.points
    });
  });
});

app.get("/api/submitted-events", (req, res) => {
	// Check if user UID is stored in session
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const uid = req.session.user.uid;

	// Base query to fetch events that are in submissions for this user
	const sql = `
		SELECT e.event_id, e.name, e.start_date, e.end_date, 
		       e.start_time, e.end_time, e.points, e.fee, 
		       e.venue, e.link, s.certificate 
		FROM events e
		JOIN submissions s ON e.event_id = s.event_id
		WHERE s.uid = ?
		ORDER BY e.start_date DESC;
	`;

	connection.query(sql, [uid], (error, results) => {
		if (error) {
			console.error("Error fetching submitted events:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch submitted events" });
		}

		// Map over results to prepare certificate data
		const eventsWithCertificates = results.map((event) => ({
			...event,
			certificate: event.certificate
				? `data:image/jpeg;base64,${event.certificate.toString(
						"base64"
				  )}`
				: null,
		}));

		res.json(eventsWithCertificates);
	});
});

app.get("/api/approved-events", (req, res) => {
	// Check if user UID is stored in session
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const uid = req.session.user.uid;

	// Base query to fetch events that are in 'myevents' for this user
	const sql = `
	  SELECT e.event_id, e.name, e.start_date, e.end_date, 
			 e.start_time, e.end_time, e.points, e.fee, 
			 e.venue, e.link
	  FROM events e
	  JOIN myevents s ON e.event_id = s.event_id
	  WHERE s.uid = ?
	  ORDER BY e.start_date DESC;
	`;

	connection.query(sql, [uid], (error, results) => {
		if (error) {
			console.error("Error fetching approved events:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch approved events" });
		}

		res.json(results);
	});
});

app.get("/api/pending-events", (req, res) => {
	// Check if user UID is stored in session
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	// SQL query to fetch pending events with student information
	const sql = `
        SELECT e.event_id, e.name, e.start_date, e.end_date, 
               e.start_time, e.end_time, e.points, e.fee, 
               e.venue, e.link, s.certificate, s.uid, st.name AS student_name
        FROM events e
        JOIN submissions s ON e.event_id = s.event_id
        JOIN students st ON s.uid = st.uid
        ORDER BY e.start_date DESC;
    `;

	connection.query(sql, (error, results) => {
		if (error) {
			console.error("Error fetching pending events:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch pending events" });
		}

		// Map over results to prepare certificate data
		const eventsWithCertificates = results.map((event) => ({
			...event,
			certificate: event.certificate
				? `data:image/jpeg;base64,${event.certificate.toString(
						"base64"
				  )}`
				: null,
		}));

		res.json(eventsWithCertificates);
	});
});

// Serve certificate image for viewing
app.get("/api/certificate/:eventId", (req, res) => {
	const { eventId } = req.params;
	const uid = req.session.user.uid; // Get the user's ID from the session

	const sql = `SELECT certificate FROM submissions WHERE event_id = ? AND uid = ?`;
	connection.query(sql, [eventId, uid], (error, results) => {
		if (error) {
			console.error("Error fetching certificate:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch certificate" });
		}

		if (results.length === 0 || !results[0].certificate) {
			return res.status(404).json({ error: "Certificate not found" });
		}

		res.setHeader("Content-Type", "image/jpeg"); // Default to JPEG, adjust if you store the mime type
		res.setHeader("Content-Disposition", "inline");
		res.send(results[0].certificate);
	});
});

// Serve certificate image for viewing
app.get("/api/certificate/:eventId/:studentUid", (req, res) => {
	const { eventId, studentUid } = req.params;

	const sql = `SELECT certificate FROM submissions WHERE event_id = ? AND uid = ?`;
	connection.query(sql, [eventId, studentUid], (error, results) => {
		if (error) {
			console.error("Error fetching certificate:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch certificate" });
		}

		if (results.length === 0 || !results[0].certificate) {
			return res.status(404).json({ error: "Certificate not found" });
		}

		res.setHeader("Content-Type", "image/jpeg"); // Default to JPEG, adjust if you store the mime type
		res.setHeader("Content-Disposition", "inline");
		res.send(results[0].certificate);
	});
});

app.post("/api/approve-event", (req, res) => {
	// Check if the teacher is authenticated
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const { event_id, uid } = req.body; // Get the uid and event_id from the request body

	if (!uid || !event_id) {
		return res.status(400).json({ error: "Invalid event or user data." });
	}

	// Now insert the event into the 'myevents' table without the certificate
	const insertSql = `
        INSERT INTO myevents (uid, event_id)
        SELECT ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM myevents WHERE uid = ? AND event_id = ?
        );
    `;

	connection.query(
		insertSql,
		[uid, event_id, uid, event_id],
		(insertError, insertResults) => {
			if (insertError) {
				console.error("Error inserting into myevents:", insertError);
				return res
					.status(500)
					.json({ error: "Failed to approve event" });
			}

			// After inserting into 'myevents', delete the event from 'submissions'
			const deleteSql = `
            DELETE FROM submissions
            WHERE event_id = ? AND uid = ?;
        `;

			connection.query(
				deleteSql,
				[event_id, uid],
				(deleteError, deleteResults) => {
					if (deleteError) {
						console.error(
							"Error deleting from submissions:",
							deleteError
						);
						return res.status(500).json({
							error: "Failed to remove event from submissions.",
						});
					}

					res.status(200).json({
						message: "Event approved successfully.",
					});
				}
			);
		}
	);
});

app.post("/api/reject-event", (req, res) => {
	// Check if the teacher is authenticated
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}

	const { event_id, uid } = req.body; // Get the uid and event_id from the request body

	if (!uid || !event_id) {
		return res.status(400).json({ error: "Invalid event or user data." });
	}

	const sql = `
        DELETE FROM submissions
        WHERE event_id = ? AND uid = ?;
    `;

	connection.query(sql, [event_id, uid], (error, results) => {
		if (error) {
			console.error("Error rejecting event:", error);
			return res.status(500).json({ error: "Failed to reject event." });
		}

		res.status(200).json({ message: "Event rejected successfully." });
	});
});

app.delete("/api/delete-event", (req, res) => {
	// Check if the teacher is authenticated
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated." });
	}

	const { event_id } = req.body; // Get event_id from the request body

	if (!event_id) {
		return res.status(400).json({ error: "Invalid event data." });
	}

	// SQL query to delete the event from the events table
	const sql = "DELETE FROM events WHERE event_id = ?";

	connection.query(sql, [event_id], (error, results) => {
		if (error) {
			console.error("Error deleting event:", error);
			return res.status(500).json({ error: "Failed to delete event." });
		}

		if (results.affectedRows === 0) {
			return res.status(404).json({ error: "Event not found." });
		}

		res.status(200).json({ message: "Event deleted successfully." });
	});
});

app.post("/api/add-event", (req, res) => {
	const {
		name,
		start_date,
		end_date,
		start_time,
		end_time,
		points,
		fee,
		venue,
		link,
	} = req.body;

	// Validate incoming data
	if (
		!name ||
		!start_date ||
		!end_date ||
		!start_time ||
		!end_time ||
		!points ||
		!fee ||
		!venue ||
		!link
	) {
		return res.status(400).json({ error: "All fields are required." });
	}

	// SQL query to insert data into the events table
	const sql = `
        INSERT INTO events (name, start_date, end_date, start_time, end_time, points, fee, venue, link) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

	connection.query(
		sql,
		[
			name,
			start_date,
			end_date,
			start_time,
			end_time,
			points,
			fee,
			venue,
			link,
		],
		(error, results) => {
			if (error) {
				console.error("Error adding event:", error);
				return res.status(500).json({ error: "Failed to add event." });
			}

			res.status(201).json({ message: "Event added successfully." });
		}
	);
});

app.post("/api/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.sendStatus(500);
		}

		res.sendStatus(200);
	});
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
