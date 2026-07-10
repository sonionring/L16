const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer');

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '-');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const upload = multer({ storage });

const normalizeStudent = (row) => {
    if (!row) return row;
    const studentId = row.studentId ?? row.studentid ?? row.studentID ?? row['studentId'];
    return { ...row, studentId };
};

const normalizeStudents = (rows) => rows.map(normalizeStudent);

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enable static files (css, images, etc. if you add a public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Enable form processing (needed to read req.body from the addStudent form)
app.use(express.json());
app.use(express.urlencoded({
    extended: true
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
    const sql = 'SELECT studentId AS studentId, name, dob, contact, image FROM student';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving students');
        }
        res.render('index', { students: normalizeStudents(results) });
    });
});

// ---------- ROUTE: Display ONE student by id ----------
app.get('/student/:id', (req, res) => {
    const studentId = req.params.id;
    const sql = 'SELECT studentId AS studentId, name, dob, contact, image FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving student by ID');
        }
        if (results.length > 0) {
            res.render('student', { student: normalizeStudent(results[0]) });
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
app.post('/addStudent', upload.single('imageFile'), (req, res) => {
    const { name, dob, contact, image } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : image;
    const sql = 'INSERT INTO student (name, dob, contact, image) VALUES (?, ?, ?, ?)';

    connection.query(sql, [name, dob, contact, imagePath], (error) => {
        if (error) {
            console.error('Error adding student:', error.message);
            return res.send('Error adding student');
        }
        res.redirect('/');
    });
});

// ---------- ROUTE: Display the "Edit Student" form ----------
app.get('/student/:id/edit', (req, res) => {
    const studentId = req.params.id;
    const sql = 'SELECT studentId AS studentId, name, dob, contact, image FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.send('Error retrieving student for edit');
        }
        if (results.length > 0) {
            res.render('editStudent', { student: normalizeStudent(results[0]) });
        } else {
            res.send('Student not found');
        }
    });
});

// ---------- ROUTE: Handle form submission - Update student in the database ----------
app.post('/student/:id/edit', upload.single('imageFile'), (req, res) => {
    const studentId = req.params.id;
    const { name, dob, contact, image, existingImage } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : (image || existingImage || '');
    const sql = 'UPDATE student SET name = ?, dob = ?, contact = ?, image = ? WHERE studentId = ?';

    connection.query(sql, [name, dob, contact, imagePath, studentId], (error) => {
        if (error) {
            console.error('Error updating student:', error.message);
            return res.send('Error updating student');
        }
        res.redirect('/student/' + studentId);
    });
});

const deleteStudent = (req, res) => {
    const studentId = req.body.studentId || req.body.id || req.params.id;
    if (!studentId) {
        return res.status(400).send('Student ID is required');
    }

    const sql = 'DELETE FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (error) => {
        if (error) {
            console.error('Error deleting student:', error.message);
            return res.send('Error deleting student');
        }
        res.redirect('/');
    });
};

app.post('/student/:id/delete', deleteStudent);
app.post('/student/delete/:id', deleteStudent);
app.post('/student/delete', deleteStudent);

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
