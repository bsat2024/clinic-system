const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// قاعدة بيانات المستخدمين المركزية على السيرفر
const clinicStaffDatabase = [
    { name: "Yazan Hamaideh", username: "admin", password: "123", role: "admin", allowedTabs: ['dashboard', 'reception', 'examination', 'appointments', 'patients', 'doctors', 'prescriptions', 'invoices', 'reports', 'staff', 'settings'] },
    { name: "موظف الاستقبال", username: "reception", password: "123", role: "receptionist", allowedTabs: ['dashboard', 'reception', 'appointments', 'patients', 'invoices', 'prescriptions'] }
];

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = clinicStaffDatabase.find(s => s.username === username && s.password === password);
    if (user) {
        res.json({ success: true, user });
    } else {
        res.json({ success: false, message: "بيانات الدخول غير صحيحة" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    socket.on('doctor-call-patient', (data) => {
        socket.broadcast.emit('patient-called-broadcast', data);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`سيرفر العيادة يعمل بكفاءة تامة على البورت: ${PORT}`);
});