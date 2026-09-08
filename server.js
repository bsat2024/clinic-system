const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

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
    auditLogs: []
};

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
    // إرسال البيانات الحالية فور اتصال أي جهاز
    socket.emit('sync-clinic-data', clinicDatabase);

    // استقبال البيانات من أي جهاز ودمجها بذكاء لضمان عدم ضياع أي تعديل
    socket.on('update-clinic-data', (incomingData) => {
        if (incomingData) {
            // دمج قائمة المرضى (منع التكرار بناءً على رقم البطاقة أو الاسم)
            incomingData.patientsList.forEach(incPat => {
                let exists = clinicDatabase.patientsList.find(p => (p.idCard && p.idCard === incPat.idCard) || p.name === incPat.name);
                if (!exists) {
                    clinicDatabase.patientsList.push(incPat);
                } else {
                    // تحديث الملفات الطبية أو الزيارات إذا كانت أحدث
                    exists.visitsCount = Math.max(exists.visitsCount || 1, incPat.visitsCount || 1);
                    if (incPat.medicalHistory) {
                        exists.medicalHistory = incPat.medicalHistory;
                    }
                }
            });

            // دمج قائمة الانتظار
            clinicDatabase.triageQueue = incomingData.triageQueue || clinicDatabase.triageQueue;
            // دمج الفواتير
            incomingData.invoicesList.forEach(inv => {
                if (!clinicDatabase.invoicesList.some(i => i.invNum === inv.invNum)) {
                    clinicDatabase.invoicesList.push(inv);
                }
            });
            // دمج المواعيد
            incomingData.appointments.forEach(app => {
                if (!clinicDatabase.appointments.some(a => a.name === app.name && a.date === app.date)) {
                    clinicDatabase.appointments.push(app);
                }
            });

            clinicDatabase.auditLogs = incomingData.auditLogs || clinicDatabase.auditLogs;

            // بث النسخة المحدثة لكافة الأجهزة المتصلة لحظياً
            io.emit('sync-clinic-data', clinicDatabase);
        }
    });

    socket.on('doctor-call-patient', (data) => {
        socket.broadcast.emit('patient-called-broadcast', data);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`السيرفر يعمل بكفاءة على البورت: ${PORT}`);
});