const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'clinic_db.json');

let clinicDatabase = {
    staffList: [
        { name: "Yazan Hamaideh", username: "admin", password: "123", role: "admin", allowedTabs: ['dashboard', 'reception', 'examination', 'appointments', 'patients', 'doctors', 'prescriptions', 'invoices', 'reports', 'staff', 'settings'] },
        { name: "موظف الاستقبال", username: "reception", password: "123", role: "receptionist", allowedTabs: ['dashboard', 'reception', 'appointments', 'patients', 'invoices', 'prescriptions'] }
    ],
    patientsList: [],
    doctorsList: [
        { name: "د. أحمد", specialty: "طب عام", shift: "8ص - 4م", phone: "0500000000" }
    ],
    appointments: [],
    invoicesList: [],
    triageQueue: [],
    prescriptionsList: [],
    auditLogs: [],
    currentPatientInExam: null
};

if (fs.existsSync(DB_FILE)) {
    try {
        const savedData = fs.readFileSync(DB_FILE, 'utf8');
        clinicDatabase = JSON.parse(savedData);
    } catch (e) {
        console.log("خطأ في قراءة ملف قاعدة البيانات، استخدام الافتراضي.");
    }
}

function saveDatabaseToFile() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(clinicDatabase, null, 2), 'utf8');
    } catch (e) {
        console.log("تعذر حفظ ملف قاعدة البيانات.");
    }
}

app.get('/api/data', (req, res) => {
    res.json(clinicDatabase);
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = clinicDatabase.staffList.find(s => s.username === username && s.password === password);
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
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000
});

io.on('connection', (socket) => {
    // إرسال البيانات فور اتصال أي جهاز (مدير أو استقبال أو طبيب)
    socket.emit('sync-clinic-data', clinicDatabase);

    // استقبال أي تحديث ودمجه وبثه فورا لجميع الأجهزة المتصلة بدون استثناء
    socket.on('update-clinic-data', (incomingData) => {
        if (incomingData) {
            if (incomingData.patientsList) {
                incomingData.patientsList.forEach(incPat => {
                    let exists = clinicDatabase.patientsList.find(p => (p.idCard && p.idCard === incPat.idCard) || p.name === incPat.name);
                    if (!exists) {
                        clinicDatabase.patientsList.push(incPat);
                    } else {
                        exists.visitsCount = Math.max(exists.visitsCount || 1, incPat.visitsCount || 1);
                        if (incPat.medicalHistory) exists.medicalHistory = incPat.medicalHistory;
                    }
                });
            }

            if (incomingData.triageQueue) clinicDatabase.triageQueue = incomingData.triageQueue;
            if (incomingData.currentPatientInExam !== undefined) clinicDatabase.currentPatientInExam = incomingData.currentPatientInExam;
            
            if (incomingData.invoicesList) {
                incomingData.invoicesList.forEach(inv => {
                    if (!clinicDatabase.invoicesList.some(i => i.invNum === inv.invNum)) clinicDatabase.invoicesList.push(inv);
                });
            }

            if (incomingData.appointments) {
                incomingData.appointments.forEach(app => {
                    if (!clinicDatabase.appointments.some(a => a.name === app.name && a.date === app.date)) clinicDatabase.appointments.push(app);
                });
            }

            if (incomingData.auditLogs) clinicDatabase.auditLogs = incomingData.auditLogs;

            saveDatabaseToFile();
            
            // البث العام الشامل لجميع الأطراف
            io.emit('sync-clinic-data', clinicDatabase);
        }
    });

    socket.on('doctor-call-patient', (data) => {
        socket.broadcast.emit('patient-called-broadcast', data);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`سيرفر العيادة يعمل بكفاءة على البورت: ${PORT}`);
});