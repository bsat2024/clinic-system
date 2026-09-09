const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DB_FILE = path.join(__dirname, 'clinic_db.json');

let clinicDatabase = {
    staffList: [
        { name: "Yazan Hamaideh", username: "admin", password: "123", role: "admin", allowedTabs: ['dashboard', 'reception', 'examination', 'appointments', 'patients', 'doctors', 'invoices', 'reports', 'staff', 'settings'] },
        { name: "موظف الاستقبال", username: "reception", password: "123", role: "receptionist", allowedTabs: ['dashboard', 'reception', 'appointments', 'patients', 'invoices'] }
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
        let parsed = JSON.parse(savedData);
        if (parsed && parsed.patientsList) {
            clinicDatabase = parsed;
        }
    } catch (e) {
        console.log("خطأ في قراءة ملف قاعدة البيانات.");
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
    maxHttpBufferSize: 50 * 1024 * 1024
});

io.on('connection', (socket) => {
    // إرسال القاعدة الكاملة فور الاتصال
    socket.emit('sync-clinic-data', clinicDatabase);

    // استقبال أي تحديث من أي قسم وبثه لجميع الأجهزة والواجهات
    socket.on('update-clinic-data', (incomingData) => {
        if (incomingData) {
            if (incomingData.patientsList && Array.isArray(incomingData.patientsList)) {
                incomingData.patientsList.forEach(incPat => {
                    let exists = clinicDatabase.patientsList.find(p => 
                        (p.idCard && incPat.idCard && p.idCard.trim() === incPat.idCard.trim()) || 
                        (p.name && incPat.name && p.name.trim().toLowerCase() === incPat.name.trim().toLowerCase())
                    );
                    if (!exists) {
                        clinicDatabase.patientsList.push(incPat);
                    } else {
                        exists.visitsCount = Math.max(exists.visitsCount || 1, incPat.visitsCount || 1);
                        if (incPat.phone) exists.phone = incPat.phone;
                        if (incPat.dob) exists.dob = incPat.dob;
                        if (incPat.conditionsText) exists.conditionsText = incPat.conditionsText;
                        
                        if (incPat.medicalHistory) {
                            if (!exists.medicalHistory) exists.medicalHistory = { labs: [], imaging: [] };
                            incPat.medicalHistory.labs?.forEach(l => {
                                let matchIdx = exists.medicalHistory.labs.findIndex(x => x.title === l.title && x.date === l.date);
                                if (matchIdx === -1) exists.medicalHistory.labs.push(l);
                                else if (l.fileData) exists.medicalHistory.labs[matchIdx] = l;
                            });
                            incPat.medicalHistory.imaging?.forEach(img => {
                                let matchIdx = exists.medicalHistory.imaging.findIndex(x => x.title === img.title && x.date === img.date);
                                if (matchIdx === -1) exists.medicalHistory.imaging.push(img);
                                else if (img.fileData) exists.medicalHistory.imaging[matchIdx] = img;
                            });
                        }
                    }
                });
            }

            if (incomingData.triageQueue) clinicDatabase.triageQueue = incomingData.triageQueue;
            if (incomingData.currentPatientInExam !== undefined) clinicDatabase.currentPatientInExam = incomingData.currentPatientInExam;
            
            if (incomingData.invoicesList && Array.isArray(incomingData.invoicesList)) {
                incomingData.invoicesList.forEach(inv => {
                    if (!clinicDatabase.invoicesList.some(i => i.invNum === inv.invNum)) {
                        clinicDatabase.invoicesList.push(inv);
                    }
                });
            }

            if (incomingData.appointments && Array.isArray(incomingData.appointments)) {
                incomingData.appointments.forEach(app => {
                    if (!clinicDatabase.appointments.some(a => a.name === app.name && a.date === app.date)) {
                        clinicDatabase.appointments.push(app);
                    }
                });
            }

            if (incomingData.doctorsList && Array.isArray(incomingData.doctorsList)) {
                clinicDatabase.doctorsList = incomingData.doctorsList;
            }

            if (incomingData.staffList && Array.isArray(incomingData.staffList)) {
                clinicDatabase.staffList = incomingData.staffList;
            }

            if (incomingData.auditLogs && Array.isArray(incomingData.auditLogs)) {
                clinicDatabase.auditLogs = incomingData.auditLogs;
            }

            saveDatabaseToFile();
            io.emit('sync-clinic-data', clinicDatabase); // مزامنة شاملة لكل الأقسام بالواجهة
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