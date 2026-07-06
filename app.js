const express = require('express');
const mysql = require('mysql2');

const app = express();

// Set up view engine
app.set('view engine', 'ejs');

// Enable static files (css, images, etc. if you add a public folder)
app.use(express.static('public'));

// Enable form processing (needed to read req.body from the addStudent form)
app.use(express.urlencoded({
    extended: false
}));

// Set up MySQL connection
// Update user/password/database to match your own phpMyAdmin / MySQL setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'RP738964$',
    database: 'c237_supermarketapp'
});

connection.connect((error) => {
    if (error) {
        console.log('Error connecting to MySQL:', error.message);
    } else {
        console.log('Connected to MySQL database');
    }
});

// ---------- ROUTE: Display all students ----------
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM student';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving students');
        }
        res.render('index', { student: results });
    });
});

// ---------- ROUTE: Display ONE student by id ----------
app.get('/student/:id', (req, res) => {
    const studentId = req.params.id;
    const sql = 'SELECT * FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving student by ID');
        }
        if (results.length > 0) {
            res.render('student', { student: results[0] });
        } else {
            res.send('Student not found');
        }
    });
});

// ---------- ROUTE: Display the "Add New Student" form ----------
app.get('/addStudent', (req, res) => {
    res.render('addStudent');
});

// ---------- ROUTE: Handle form submission - Add new student into the database ----------
app.post('/addStudent', (req, res) => {
    // Extract student data from the request body
    const { name, dob, contact, image } = req.body;
    const sql = 'INSERT INTO student (name, dob, contact, image) VALUES (?, ?, ?, ?)';

    // Insert the new student into the database
    connection.query(sql, [name, dob, contact, image], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error('Error adding student:', error);
            return res.send('Error adding student');
        } else {
            // Send a success response - redirect back to student list
            res.redirect('/');
        }
    });
});

// ---------- ROUTE: Display the "Edit Student" form ----------
app.get('/student/:id/edit', (req, res) => {
    const studentId = req.params.id;
    const sql = 'SELECT * FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving student for edit');
        }
        if (results.length > 0) {
            res.render('editStudent', { student: results[0] });
        } else {
            res.send('Student not found');
        }
    });
});

// ---------- ROUTE: Handle form submission - Update student in the database ----------
app.post('/student/:id/edit', (req, res) => {
    const studentId = req.params.id;
    const { name, dob, contact, image } = req.body;
    const sql = 'UPDATE student SET name = ?, dob = ?, contact = ?, image = ? WHERE studentId = ?';
    connection.query(sql, [name, dob, contact, image, studentId], (error, results) => {
        if (error) {
            console.error('Error updating student:', error.message);
            return res.send('Error updating student');
        }
        res.redirect('/student/' + studentId);
    });
});

app.post('/student/:id/delete', (req, res) => {
    const studentId = req.params.id;
    const sql = 'DELETE FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (error, results) => {
        if (error) {
            console.error('Error deleting student:', error.message);
            return res.send('Error deleting student');
        }
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
