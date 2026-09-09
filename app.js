let currentLang = localStorage.getItem('clinicLang') || 'ar';
let currentUserRole = 'admin';
let currentUsername = 'admin';
let isSidebarCollapsed = false;
let currentPatientInExam = JSON.parse(localStorage.getItem('currentPatientInExam')) || null;
let currentUploadedFileBase64 = null;
let currentUploadedFileName = "";
let currentPrescriptionItems = [];

let currentPatientInitFileBase64 = null;
let currentPatientInitFileName = "";
let extraFileBase64 = null;
let extraFileName = "";
let selectedPatientForExtraFile = "";

let currentAllowedTabs = ['dashboard', 'reception', 'examination', 'appointments', 'patients', 'doctors', 'prescriptions', 'invoices', 'reports', 'staff', 'settings'];

let db = JSON.parse(localStorage.getItem('clinicOfflineDB')) || {
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

let socket = null;
try {
    socket = io(window.location.origin, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        let indicator = document.getElementById('networkStatusIndicator');
        if(indicator) {
            indicator.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span> متزامن (Live Cloud)`;
            indicator.className = "text-[11px] font-black px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-2 shadow-sm";
        }
        // إرسال البيانات المحلية فور الاتصال لدمجها بالسيرفر
        socket.emit('update-clinic-data', db);
    });

    socket.on('disconnect', () => {
        let indicator = document.getElementById('networkStatusIndicator');
        if(indicator) {
            indicator.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> يعمل محلياً (Offline)`;
            indicator.className = "text-[11px] font-black px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-2 shadow-sm";
        }
    });
    
    socket.on('sync-clinic-data', (serverData) => {
        if (serverData && serverData.patientsList) {
            // دمج ذكي محلياً يمنع الكتابة الفوقية ومسح البيانات
            serverData.patientsList.forEach(sPat => {
                let localPat = db.patientsList.find(p => (p.idCard && p.idCard === sPat.idCard) || p.name === sPat.name);
                if (!localPat) {
                    db.patientsList.push(sPat);
                } else if (sPat.medicalHistory) {
                    localPat.medicalHistory = sPat.medicalHistory;
                }
            });
            db.triageQueue = serverData.triageQueue || db.triageQueue;
            serverData.invoicesList.forEach(inv => {
                if (!db.invoicesList.some(i => i.invNum === inv.invNum)) db.invoicesList.push(inv);
            });
            serverData.appointments.forEach(app => {
                if (!db.appointments.some(a => a.name === app.name && a.date === app.date)) db.appointments.push(app);
            });

            localStorage.setItem('clinicOfflineDB', JSON.stringify(db));
            refreshAllUIs();
        }
    });

    socket.on('patient-called-broadcast', (data) => {
        triggerNurseNextPatientAlert(data.patientName, data.doctorName);
    });
} catch(e) {}

async function fetchServerDataInitial() {
    try {
        let res = await fetch(window.location.origin + '/api/data');
        if (res.ok) {
            let serverData = await res.json();
            if (serverData && serverData.patientsList) {
                db = serverData;
                localStorage.setItem('clinicOfflineDB', JSON.stringify(db));
                refreshAllUIs();
            }
        }
    } catch(err) {
        console.log("العمل بالوضع المحلي");
    }
}

function saveAndSync() {
    localStorage.setItem('clinicOfflineDB', JSON.stringify(db));
    
    if (socket && socket.connected) {
        socket.emit('update-clinic-data', db);
        showToast("✓ تم الحفظ والمزامنة السحابية بنجاح");
    } else {
        showToast("⚠️ يعمل بدون إنترنت: تم الحفظ محلياً على الجهاز بأمان");
    }
    refreshAllUIs();
}

window.addEventListener('online', () => {
    showToast("✓ عاد الاتصال بالإنترنت! جاري دمج ومزامنة البيانات...");
    if (socket) {
        if (!socket.connected) socket.connect();
        socket.emit('update-clinic-data', db);
    }
});

function refreshAllUIs() {
    loadTriageQueue();
    loadPatients();
    loadDoctors();
    loadAppointments();
    loadInvoices();
    updateSidebarBadges();
    renderAuditLogsTable();
    if (document.getElementById('tab-dashboard') && !document.getElementById('tab-dashboard').classList.contains('hidden')) {
        initDashboardCharts();
    }
}

const translations = {
    ar: {
        pageTitle: "عيادات الأسرة | النظام الطبي الاحترافي",
        loginTitle: "تسجيل الدخول للعيادة",
        loginSubtitle: "نظام إدارة تدفق المرضى والفحص السريري",
        lblUser: "اسم المستخدم",
        lblPass: "كلمة المرور",
        btnLogin: "دخول للنظام",
        lblCardPatients: "المرضى اليوم",
        lblCardAppts: "المواعيد",
        lblCardRev: "الإيرادات",
        lblCardSatisfaction: "رضا المرضى",
        btnRec: "الاستقبال والتجهيز",
        btnExam: "غرفة الفحص",
        btnInv: "فاتورة جديدة",
        recTitle: "مكتب الاستقبال، تسجيل المرضى وقياس العلامات الحيوية",
        lblSelPatient: "اسم المريض الكامل",
        lblAssignDoc: "الطبيب المعالج",
        lblTension: "ضغط الدم",
        lblWeight: "الوزن (kg)",
        lblSugar: "نسبة السكري (g/L)",
        btnSubmitTriage: "تسجيل وإرسال المريض لقائمة انتظار الفحص",
        lblQueueTitle: "قائمة انتظار المرضى عند الطبيب",
        examTitle: "غرفة الفحص الإكلينيكي وصرف الوصفات",
        btnFinishText: "إنهاء الفحص وتخريج المريض",
        apptsTabTitle: "إدارة جدول المواعيد",
        patsTabTitle: "المرضى المسجلين بالنظام",
        docsTabTitle: "قائمة الأطباء والتخصصات",
        invTabTitle: "الفواتير والتحصيل",
        titlePermissions: "صلاحيات المستخدمين وإدارة الحسابات وكلمات المرور",
        settingsTabTitle: "إعدادات النظام والعيادة",
        navDash: "لوحة القيادة",
        navRec: "الاستقبال والترياج",
        navExam: "غرفة الفحص",
        navAppts: "المواعيد",
        navPats: "المرضى",
        navDocs: "الأطباء",
        navPresc: "الوصفات",
        navInvoices: "الفواتير",
        navReports: "التقارير",
        navStaff: "المستخدمين",
        navSettings: "الإعدادات",
        btnLogout: "تسجيل الخروج",
        optSelDocDefault: "-- اختر الطبيب المعالج --",
        clinicBrandName: "عيادات الأسرة",
        clinicSubTitle: "Clinical System"
    },
    fr: {
        pageTitle: "Clinique Familiale | Système Médical",
        loginTitle: "Connexion au Cabinet",
        loginSubtitle: "Gestion du flux patients et consultation clinique",
        lblUser: "Nom d'utilisateur",
        lblPass: "Mot de passe",
        btnLogin: "Se connecter",
        navDash: "Tableau de Bord",
        navRec: "Accueil & Triage",
        navExam: "Salle d'Examen",
        navAppts: "Rendez-vous",
        navPats: "Patients",
        navDocs: "Médecins",
        navPresc: "Ordonnances",
        navInvs: "Facturation",
        navReps: "Rapports",
        navStaff: "Utilisateurs",
        navSettings: "Paramètres",
        btnLogout: "Déconnexion"
    }
};

const allAvailableViews = [
    { id: 'dashboard', ar: 'لوحة القيادة', fr: 'Tableau de Bord', icon: 'fa-house-chimney text-lg' },
    { id: 'reception', ar: 'الاستقبال والترياج', fr: 'Accueil & Triage', icon: 'fa-clipboard-user text-lg', badgeKey: 'queue' },
    { id: 'examination', ar: 'غرفة الفحص', fr: 'Salle d\'Examen', icon: 'fa-stethoscope text-lg' },
    { id: 'appointments', ar: 'المواعيد', fr: 'Rendez-vous', icon: 'fa-calendar-check text-lg', badgeKey: 'appts' },
    { id: 'patients', ar: 'المرضى', fr: 'Patients', icon: 'fa-user-injured text-lg' },
    { id: 'doctors', ar: 'الأطباء', fr: 'Médecins', icon: 'fa-user-doctor text-lg' },
    { id: 'prescriptions', ar: 'الوصفات الطبية', fr: 'Ordonnances', icon: 'fa-prescription-bottle-medical text-lg' },
    { id: 'invoices', ar: 'الفواتير والتحصيل', fr: 'Facturation', icon: 'fa-file-invoice-dollar text-lg' },
    { id: 'reports', ar: 'التقارير والإحصائيات', fr: 'Rapports', icon: 'fa-chart-pie text-lg' },
    { id: 'staff', ar: 'صلاحيات المستخدمين', fr: 'Permissions', icon: 'fa-users-gear text-lg' },
    { id: 'settings', ar: 'إعدادات النظام', fr: 'Paramètres', icon: 'fa-gear text-lg' }
];

document.addEventListener("DOMContentLoaded", async () => {
    await fetchServerDataInitial();
    applyLanguage();
    
    const diagInput = document.getElementById('examDiagnosis');
    const procInput = document.getElementById('examProcedure');
    if (diagInput) {
        diagInput.value = localStorage.getItem('tempExamDiagnosis') || '';
        diagInput.addEventListener('input', () => { localStorage.setItem('tempExamDiagnosis', diagInput.value); });
    }
    if (procInput) {
        procInput.value = localStorage.getItem('tempExamProcedure') || '';
        procInput.addEventListener('input', () => { localStorage.setItem('tempExamProcedure', procInput.value); });
    }
    
    const savedSession = JSON.parse(localStorage.getItem('clinicSession'));
    if (savedSession) {
        currentUserRole = savedSession.role;
        currentUsername = savedSession.username;
        currentAllowedTabs = savedSession.allowedTabs || allAvailableViews.map(v => v.id);
        showApp();
    } else {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error:', err));
    });
}

function logAuditAction(actionText) {
    db.auditLogs.unshift({ user: currentUsername, action: actionText, time: new Date().toLocaleString() });
    if (db.auditLogs.length > 50) db.auditLogs.pop();
    saveAndSync();
}

function renderAuditLogsTable() {
    let tb = document.getElementById('auditLogTbody');
    if (!tb) return;
    tb.innerHTML = '';
    if (db.auditLogs.length === 0) {
        tb.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-gray-400">لا توجد سجلات نشاط مسجلة</td></tr>`;
        return;
    }
    db.auditLogs.forEach(l => {
        tb.innerHTML += `<tr><td class="p-3 font-bold text-[#0097b2]">${l.user}</td><td class="p-3">${l.action}</td><td class="p-3 text-gray-500">${l.time}</td></tr>`;
    });
}

function updateExamRiskIndicator(bp, sugar) {
    const card = document.getElementById('aiRiskCard');
    const text = document.getElementById('aiRiskText');
    const badge = document.getElementById('aiRiskBadge');
    if (!card) return;

    let riskLevel = "آمن";
    let desc = "المؤشرات الحيوية ضمن المعدلات الطبيعية الآمنة.";
    let bgClass = "bg-gradient-to-r from-teal-600 to-[#0097b2]";
    let badgeClass = "bg-white text-teal-700";

    let sys = 120;
    if (bp && bp.includes('/')) {
        sys = parseFloat(bp.split('/')[0]) || 120;
        if (sys > 40) sys = sys / 10;
    }
    let sVal = parseFloat(sugar) || 1.10;
    if (sVal > 40) sVal = sVal / 100;

    if (sys >= 16 || sVal >= 2.0) {
        riskLevel = "خطر مرتفع!";
        desc = "تجاوزات حرجة في ضغط الدم أو سكر الدم!";
        bgClass = "bg-gradient-to-r from-rose-600 to-red-700";
        badgeClass = "bg-white text-rose-700";
    } else if (sys >= 14 || sVal >= 1.4) {
        riskLevel = "تنبيه متوسط";
        desc = "ملاحظة ارتفاع طفيف يستوجب المراقبة الطبية.";
        bgClass = "bg-gradient-to-r from-amber-500 to-orange-600";
        badgeClass = "bg-white text-amber-700";
    }

    card.className = `${bgClass} text-white p-4 rounded-2xl shadow-md flex items-center justify-between transition-all`;
    text.innerText = desc;
    badge.innerText = riskLevel;
    badge.className = `${badgeClass} px-3 py-1 rounded-xl text-xs font-black`;
}

let revChartInstance = null;
let casesChartInstance = null;
function initDashboardCharts() {
    const ctx1 = document.getElementById('revenueChart');
    const ctx2 = document.getElementById('casesChart');
    if (!ctx1 || !ctx2) return;

    let totalRev = db.invoicesList.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const totalPatientsCount = db.patientsList.length;

    const patCard = document.getElementById('statTotalPatientsCard');
    if (patCard) patCard.innerText = totalPatientsCount;

    const apptCard = document.getElementById('statPendingAppts');
    if (apptCard) apptCard.innerText = db.appointments.length + db.triageQueue.length;

    if (revChartInstance) revChartInstance.destroy();
    if (casesChartInstance) casesChartInstance.destroy();

    revChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['إجمالي الإيرادات المسجلة', 'المتوقع', 'المحصل الفعلي'],
            datasets: [{ label: 'الإيرادات ($)', data: [totalRev, totalRev * 1.2, totalRev], borderColor: '#0097b2', backgroundColor: 'rgba(0,151,178,0.1)', tension: 0.3, fill: true }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    let emergencyCount = db.triageQueue.filter(q => q.isEmergency).length;
    let normalCount = totalPatientsCount - emergencyCount > 0 ? totalPatientsCount - emergencyCount : 1;

    casesChartInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['حالات طارئة / حرجة', 'مرضى عاديين / مسجلين', 'قائمة الانتظار'],
            datasets: [{ data: [emergencyCount, normalCount, db.triageQueue.length], backgroundColor: ['#e11d48', '#0097b2', '#f59e0b'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function checkPatientByIdCard(idCardNumber) {
    const cleanId = idCardNumber.trim();
    const badge = document.getElementById('patientStatusBadge');
    const nameInput = document.getElementById('triagePatientNameInput');
    const phoneInput = document.getElementById('triagePatientPhoneInput');

    if (!cleanId) {
        badge.className = 'hidden';
        nameInput.value = '';
        phoneInput.value = '';
        return;
    }

    const foundPatient = db.patientsList.find(p => (p.idCard || '').trim() === cleanId);
    badge.classList.remove('hidden');
    if (foundPatient) {
        nameInput.value = foundPatient.name;
        phoneInput.value = foundPatient.phone || '';
        badge.innerText = `✓ مريض قديم مسجل (${foundPatient.visitsCount || 1} زيارات)`;
        badge.className = 'px-4 py-2 rounded-2xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300';
    } else {
        nameInput.value = '';
        phoneInput.value = '';
        badge.innerText = `★ مريض جديد (سيتم تسجيله تلقائياً)`;
        badge.className = 'px-4 py-2 rounded-2xl text-xs font-black bg-blue-50 text-[#0097b2] border border-cyan-300';
    }
}

function checkLiveVitalsWarning() {
    const bp = document.getElementById('triageBP').value.trim();
    const sugar = parseFloat(document.getElementById('triageSugar').value.trim());
    const banner = document.getElementById('globalVitalsAlertBanner');
    const emergencyCheckbox = document.getElementById('triageEmergencyCheck');
    let isCritical = false;

    if (bp.includes('/')) {
        let parts = bp.split('/');
        let sys = parseFloat(parts[0]);
        let dia = parseFloat(parts[1]);
        if (sys > 40) sys = sys / 10;
        if (dia > 30) dia = dia / 10;
        if (sys >= 17 || dia >= 11 || sys < 9 || dia < 6) isCritical = true;
    }

    if (!isNaN(sugar)) {
        let val = sugar > 40 ? sugar / 100 : sugar;
        if (val >= 2.50 || val < 0.70) isCritical = true;
    }

    if (isCritical) {
        banner.classList.remove('hidden');
        emergencyCheckbox.checked = true;
        playEmergencyBeep();
    } else {
        banner.classList.add('hidden');
    }
}

function handleTriageSubmit(e) {
    e.preventDefault();
    const idCard = document.getElementById('triagePatientIDInput').value.trim();
    const name = document.getElementById('triagePatientNameInput').value.trim();
    const phone = document.getElementById('triagePatientPhoneInput').value.trim();
    const doctor = document.getElementById('triageDoctor').value;
    const bp = document.getElementById('triageBP').value.trim();
    const weight = document.getElementById('triageWeight').value.trim();
    const sugar = document.getElementById('triageSugar').value.trim();
    const isEmergency = document.getElementById('triageEmergencyCheck').checked;

    let patientObj = db.patientsList.find(p => (p.idCard || '').trim() === idCard);
    if (!patientObj) {
        patientObj = { name, idCard, phone: phone || '--', dob: "2000-01-01", visitsCount: 1, conditionsText: "مريض جديد", medicalHistory: { labs: [], imaging: [] } };
        db.patientsList.push(patientObj);
    } else {
        patientObj.visitsCount = (patientObj.visitsCount || 1) + 1;
        patientObj.conditionsText = "متابع";
    }

    db.triageQueue.push({ id: "Q-" + Date.now(), name, idCard, doctor, bp, weight, sugar, isEmergency, timestamp: Date.now() });
    db.triageQueue.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0) || a.timestamp - b.timestamp);

    saveAndSync();
    e.target.reset();
    document.getElementById('patientStatusBadge').className = 'hidden';
    showToast("تم تسجيل المريض وإرساله لقائمة الانتظار بنجاح!");
    logAuditAction(`تسجيل ترياج للمريض: ${name} (ID: ${idCard})`);
}

function loadTriageQueue() {
    const tb = document.getElementById('triageQueueTbody');
    if (!tb) return;
    tb.innerHTML = '';
    db.triageQueue.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0) || a.timestamp - b.timestamp);
    if (db.triageQueue.length === 0) {
        tb.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-400 font-bold">لا يوجد مرضى بقائمة الانتظار</td></tr>`;
        populateDoctorQueueQuickDropdown();
        return;
    }
    db.triageQueue.forEach((item, index) => {
        const isEmerg = item.isEmergency;
        const rowClass = isEmerg ? 'bg-rose-50/60 emergency-row-glow' : 'hover:bg-gray-50';
        tb.innerHTML += `
            <tr class="${rowClass}">
                <td class="p-3.5 font-bold text-[#0097b2]">#${index + 1}</td>
                <td class="p-3.5 font-black text-gray-800">${item.name}</td>
                <td class="p-3.5 text-gray-600 font-bold">${item.idCard || '--'}</td>
                <td class="p-3.5"><span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800">مسجل</span></td>
                <td class="p-3.5 text-indigo-700 font-bold">${item.doctor}</td>
                <td class="p-3.5 font-bold text-gray-700">${item.bp} | ${item.sugar} g/L</td>
                <td class="p-3.5">${isEmerg ? '<span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-600 text-white animate-pulse">طارئة</span>' : 'عادي'}</td>
                <td class="p-3.5"><button onclick="doctorCallPatient('${item.name}')" class="bg-[#0097b2] text-white px-4 py-2 rounded-2xl text-xs font-black shadow"><i class="fa-solid fa-bell"></i> استدعاء وفحص</button></td>
            </tr>
        `;
    });
    populateDoctorQueueQuickDropdown();
}

function doctorCallPatient(patientName) {
    let targetIndex = db.triageQueue.findIndex(q => q.name === patientName);
    if (targetIndex === -1) return;
    let targetPatient = db.triageQueue[targetIndex];
    db.triageQueue.splice(targetIndex, 1);
    
    currentPatientInExam = { name: targetPatient.name, idCard: targetPatient.idCard, doctor: targetPatient.doctor, bp: targetPatient.bp, sugar: targetPatient.sugar, weight: targetPatient.weight, isEmergency: targetPatient.isEmergency, startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    localStorage.setItem('currentPatientInExam', JSON.stringify(currentPatientInExam));

    saveAndSync();
    triggerNurseNextPatientAlert(targetPatient.name, targetPatient.doctor);
    if (socket && socket.connected) socket.emit('doctor-call-patient', { patientName: targetPatient.name, doctorName: targetPatient.doctor });

    switchTab('examination');
    loadCurrentExamCard();
    updateLiveBottomActiveBar();
    showToast(`تم استدعاء ${targetPatient.name} للفحص!`);
    logAuditAction(`استدعاء المريض للفحص: ${targetPatient.name}`);
}

function triggerNurseNextPatientAlert(patientName, doctorName) {
    document.getElementById('nurseAlertPatientName').innerText = patientName;
    document.getElementById('nurseAlertDoctorName').innerText = doctorName;
    document.getElementById('nurseNextPatientAlertModal').classList.remove('hidden');
    playEmergencyBeep();
}

function dismissNurseNextPatientAlert() { 
    document.getElementById('nurseNextPatientAlertModal').classList.add('hidden'); 
}

function playEmergencyBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
}

function doctorCallPatientFromDropdown(name) { if (name) doctorCallPatient(name); }

function loadCurrentExamCard() {
    if (!currentPatientInExam) {
        document.getElementById('examPatName').innerText = "لا يوجد مريض بالفحص";
        document.getElementById('examPatBP').innerText = "--";
        document.getElementById('examPatSugar').innerText = "--";
        renderPatientMedicalHistoryInExam(null);
        return;
    }
    document.getElementById('examPatName').innerText = currentPatientInExam.name;
    document.getElementById('examPatBP').innerText = currentPatientInExam.bp;
    document.getElementById('examPatSugar').innerText = currentPatientInExam.sugar + " g/L";
    updateExamRiskIndicator(currentPatientInExam.bp, currentPatientInExam.sugar);
    renderPatientMedicalHistoryInExam(currentPatientInExam.name);
}

function updateLiveBottomActiveBar() {
    const textEl = document.getElementById('liveActivePatientText');
    const docEl = document.getElementById('liveActiveDoctorText');
    const timerEl = document.getElementById('liveActiveTimerText');

    if (currentPatientInExam) {
        textEl.innerHTML = `المريض في الدور حالياً: <span class="text-[#0097b2] font-black text-sm">${currentPatientInExam.name}</span>`;
        docEl.innerText = `عند: ` + currentPatientInExam.doctor;
        timerEl.innerText = `منذ: ` + currentPatientInExam.startedAt;
        docEl.classList.remove('hidden');
        timerEl.classList.remove('hidden');
    } else {
        textEl.innerText = "لا يوجد مريض بالفحص حالياً (العيادة شاغرة)";
        docEl.classList.add('hidden');
        timerEl.classList.add('hidden');
    }
}

function openExamPricingModal() {
    if (!currentPatientInExam) { alert("لا يوجد مريض قيد الفحص!"); return; }
    document.getElementById('examPricingModal').classList.remove('hidden');
}
function closeExamPricingModal() { document.getElementById('examPricingModal').classList.add('hidden'); }

function confirmFinishExamination(e) {
    e.preventDefault();
    let consultFee = parseFloat(document.getElementById('modalConsultFee').value) || 30;
    let ecgFee = parseFloat(document.getElementById('modalEcgFee').value) || 0;
    let ivFee = parseFloat(document.getElementById('modalIvFee').value) || 0;
    let totalAmount = consultFee + ecgFee + ivFee;

    const dischargedPatientName = currentPatientInExam ? currentPatientInExam.name : "مريض";

    db.invoicesList.push({
        invNum: "INV-" + (1000 + db.invoicesList.length + 1),
        patient: dischargedPatientName,
        service: `كشفية ($${consultFee}) + ECG ($${ecgFee}) + محلول ($${ivFee})`,
        amount: totalAmount,
        status: "مدفوع"
    });

    closeExamPricingModal();
    logAuditAction(`إنهاء فحص وتخريج المريض وإصدار فاتورة: ${dischargedPatientName}`);
    
    // تفريغ حقول غرفة الفحص الإكلينيكي والوصفات الطبية بالكامل
    document.getElementById('examDiagnosis').value = '';
    document.getElementById('examProcedure').value = '';
    document.getElementById('examPrescriptionText').value = '';
    localStorage.removeItem('tempExamDiagnosis');
    localStorage.removeItem('tempExamProcedure');
    currentPrescriptionItems = [];
    renderCurrentPrescriptionTable();

    if (db.triageQueue.length > 0) {
        let nextPatient = db.triageQueue[0];
        triggerNurseNextPatientAlert(nextPatient.name, nextPatient.doctor);
    }

    // تصفير المريض الحالي بالفحص في كلا الطرفين وعلى الذاكرة المحلية
    currentPatientInExam = null;
    localStorage.removeItem('currentPatientInExam');

    // حفظ وبث التحديث الفوري للسيرفر وكافة الأجهزة المتصلة لتتطابق حالة العيادة وغرفة الفحص
    saveAndSync();
    
    loadCurrentExamCard();
    updateLiveBottomActiveBar(); // تحديث شريط حالة العيادة السفلي ليصبح شاغراً فوراً
    showToast("تم تخريج المريض وتفريغ العيادة وغرفة الفحص بنجاح!");
}
function populateTriageDoctorDropdown() {
    let sel = document.getElementById('triageDoctor');
    let aDoc = document.getElementById('aDoc');
    if (sel) { sel.innerHTML = `<option value="">اختر الطبيب</option>`; db.doctorsList.forEach(item => sel.innerHTML += `<option>${item.name}</option>`); }
    if (aDoc) { aDoc.innerHTML = ''; db.doctorsList.forEach(item => aDoc.innerHTML += `<option>${item.name}</option>`); }
}
function populateDoctorQueueQuickDropdown() {
    const sel = document.getElementById('docQueueQuickSelect');
    if (sel) { sel.innerHTML = `<option value="">-- اختر مريضاً للفحص --</option>`; db.triageQueue.forEach(item => sel.innerHTML += `<option>${item.name}</option>`); }
}

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'fr' : 'ar';
    localStorage.setItem('clinicLang', currentLang);
    applyLanguage();
    showToast(currentLang === 'ar' ? "تم التحويل إلى العربية" : "Passé au Français");
}

function applyLanguage() {
    const t = translations[currentLang];
    const root = document.getElementById('htmlRoot');
    if (!t) return;
    root.setAttribute('lang', currentLang);
    root.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

    for (let id in t) {
        let el = document.getElementById(id);
        if (el) el.innerText = t[id];
    }
    buildSidebarMenu();
    loadTriageQueue();
    updateLiveBottomActiveBar();
    if (currentPatientInExam) renderPatientMedicalHistoryInExam(currentPatientInExam.name);
}

async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();

    let found = db.staffList.find(s => s.username === u && s.password === p);
    if (found) {
        currentUserRole = found.role;
        currentUsername = found.name;
        currentAllowedTabs = found.allowedTabs || allAvailableViews.map(v => v.id);
        
        localStorage.setItem('clinicSession', JSON.stringify({ username: currentUsername, role: currentUserRole, allowedTabs: currentAllowedTabs }));
        
        showApp();
        showToast(`مرحباً بك ${found.name}!`);
        logAuditAction(`تسجيل دخول الموظف: ${found.name}`);
    } else {
        alert("بيانات الدخول غير صحيحة! تأكد من اسم المستخدم وكلمة المرور.");
    }
}

function handleLogout() {
    localStorage.removeItem('clinicSession');
    logAuditAction("تسجيل الخروج من النظام");
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('userHeaderName').innerText = currentUsername;
    document.getElementById('userHeaderRole').innerText = currentUserRole;

    buildSidebarMenu();
    switchTab(currentAllowedTabs[0] || 'dashboard');
    refreshAllUIs();
    populateTriageDoctorDropdown();
    loadClinicSettingsInputs();
}

function buildSidebarMenu() {
    const nav = document.getElementById('sidebarNavMenu');
    if (!nav) return;
    let html = '';
    currentAllowedTabs.forEach(tabId => {
        let view = allAvailableViews.find(v => v.id === tabId);
        if (view) {
            let label = currentLang === 'ar' ? view.ar : view.fr;
            let badgeHtml = view.badgeKey === 'queue' ? `<span id="badge-queue" class="badge-count bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full mr-auto">0</span>` : '';
            html += `
                <button onclick="switchTab('${view.id}')" title="${label}" class="w-full flex items-center gap-3.5 px-4 py-3 text-gray-600 hover:bg-[#e0f2fe] hover:text-[#0097b2] rounded-2xl font-bold text-sm transition active:scale-95">
                    <i class="fa-solid ${view.icon} text-[#0097b2] w-6 text-center text-lg flex-shrink-0"></i>
                    <span class="sidebar-text-group truncate">${label}</span>
                    ${badgeHtml}
                </button>
            `;
        }
    });
    nav.innerHTML = html;
    updateSidebarBadges();
}

function updateSidebarBadges() {
    const bQueue = document.getElementById('badge-queue');
    if (bQueue) bQueue.innerText = db.triageQueue.length;
}

function switchTab(tabId) {
    if (!currentAllowedTabs.includes(tabId) && currentUserRole !== 'admin') {
        alert("عذراً، لا تمتلك صلاحية الوصول إلى هذه الواجهة!");
        return;
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    let target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.remove('hidden');
    if (tabId === 'staff') renderStaffManagementTable();
    if (tabId === 'settings') loadClinicSettingsInputs();
    if (tabId === 'reports') renderAuditLogsTable();
    if (tabId === 'dashboard') initDashboardCharts();
}

function toggleSidebar() {
    isSidebarCollapsed = !isSidebarCollapsed;
    const sidebar = document.getElementById('mainSidebar');
    if (isSidebarCollapsed) sidebar.classList.add('sidebar-collapsed');
    else sidebar.classList.remove('sidebar-collapsed');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMessage').innerText = msg;
    t.classList.remove('opacity-0', 'pointer-events-none');
    setTimeout(() => t.classList.add('opacity-0', 'pointer-events-none'), 3000);
}

// دوال إدارة ورفع الملفات الطبية
function handlePatientInitFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    currentPatientInitFileName = file.name;
    const reader = new FileReader();
    reader.onload = function(e) { currentPatientInitFileBase64 = e.target.result; };
    reader.readAsDataURL(file);
    document.getElementById('patInitFileLabel').innerText = `✓ تم اختيار: ${file.name}`;
}

function addPatientSimpleModal(e) {
    e.preventDefault();
    let idCard = document.getElementById('modalPatID').value.trim();
    let name = document.getElementById('modalPatName').value.trim();
    let dob = document.getElementById('modalPatDob').value;
    let phone = document.getElementById('modalPatPhone').value;
    let initType = document.getElementById('modalPatInitFileType').value;
    let initTitle = document.getElementById('modalPatInitFileTitle').value.trim();

    let existing = db.patientsList.find(item => (item.idCard || '').trim() === idCard);
    if (existing) {
        alert("رقم بطاقة التعريف مسجل مسبقاً لمريض آخر!");
        return;
    }

    let newPatientObj = {
        name, idCard, dob, phone,
        visitsCount: 1,
        conditionsText: "مسجل جديد",
        medicalHistory: { labs: [], imaging: [] }
    };

    if (currentPatientInitFileBase64 && initTitle) {
        let recordObj = {
            date: new Date().toISOString().split('T')[0],
            title: initTitle,
            result: "ملف مرفق عند التسجيل الأولي",
            fileData: currentPatientInitFileBase64,
            fileName: currentPatientInitFileName
        };
        if (initType === 'lab') newPatientObj.medicalHistory.labs.push(recordObj);
        else newPatientObj.medicalHistory.imaging.push(recordObj);
    }

    db.patientsList.push(newPatientObj);
    saveAndSync();
    closeModal('simple');
    
    currentPatientInitFileBase64 = null;
    currentPatientInitFileName = "";
    document.getElementById('patInitFileLabel').innerText = "إرفاق تحليل أو صورة أشعة أولية (اختياري)";

    showToast("تم تسجيل المريض وملفه الطبي بنجاح!");
    logAuditAction(`تسجيل مريض جديد: ${name}`);
}

function openAddExtraFileModal(patientName) {
    selectedPatientForExtraFile = patientName;
    document.getElementById('extraFilePatientName').value = patientName;
    document.getElementById('extraFileTitle').value = '';
    document.getElementById('extraFileResult').value = '';
    extraFileBase64 = null;
    extraFileName = "";
    document.getElementById('extraFilePreviewName').innerText = "اضغط لاختيار الملف الطبي";
    document.getElementById('modal-add-patient-file').classList.remove('hidden');
}

function handleExtraFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    extraFileName = file.name;
    const reader = new FileReader();
    reader.onload = function(e) { extraFileBase64 = e.target.result; };
    reader.readAsDataURL(file);
    document.getElementById('extraFilePreviewName').innerText = `✓ تم اختيار: ${file.name}`;
}

function saveExtraPatientFile(e) {
    e.preventDefault();
    const type = document.getElementById('extraFileType').value;
    const title = document.getElementById('extraFileTitle').value.trim();
    const result = document.getElementById('extraFileResult').value.trim() || "مرفق طبي إضافي";

    let patient = db.patientsList.find(p => p.name.trim().toLowerCase() === selectedPatientForExtraFile.toLowerCase());
    if (patient) {
        if (!patient.medicalHistory) patient.medicalHistory = { labs: [], imaging: [] };
        let recordObj = {
            date: new Date().toISOString().split('T')[0],
            title, result,
            fileData: extraFileBase64,
            fileName: extraFileName
        };
        if (type === 'lab') patient.medicalHistory.labs.unshift(recordObj);
        else patient.medicalHistory.imaging.unshift(recordObj);

        saveAndSync();
        closeModal('add-patient-file');
        showToast("تم إرفاق الملف الطبي بنجاح للمريض!");
        logAuditAction(`إضافة ملف طبي (${title}) للمريض: ${selectedPatientForExtraFile}`);
    }
}

function loadPatients() {
    let tb = document.getElementById('patientsTbody');
    if (!tb) return;
    tb.innerHTML = '';
    db.patientsList.forEach((p, i) => {
        let editControls = currentUserRole === 'admin' ? `
            <button onclick="openAddExtraFileModal('${p.name}')" class="bg-cyan-50 border text-[#0097b2] px-2 py-1.5 rounded-xl text-xs font-bold" title="إضافة تحليل أو أشعة"><i class="fa-solid fa-file-medical"></i> + ملف</button>
            <button id="p-edit-btn-${i}" onclick="enablePatientEdit(${i})" class="bg-blue-50 border text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-pen-to-square"></i> تعديل</button>
            <button id="p-save-btn-${i}" onclick="savePatientEdit(${i})" class="hidden bg-emerald-50 border text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
            <button onclick="deletePatient(${i})" class="text-red-500 font-bold px-1.5"><i class="fa-solid fa-trash"></i></button>
        ` : `<button onclick="openAddExtraFileModal('${p.name}')" class="bg-cyan-50 border text-[#0097b2] px-2 py-1.5 rounded-xl text-xs font-bold" title="إضافة تحليل أو أشعة"><i class="fa-solid fa-file-medical"></i> + ملف</button>`;

        tb.innerHTML += `
            <tr id="pat-row-${i}">
                <td class="py-3 font-bold"><input type="text" id="p-name-${i}" value="${p.name}" class="border rounded-xl px-2 py-1.5 text-sm bg-gray-50 w-36" disabled></td>
                <td class="py-3 text-gray-600 font-bold"><input type="text" id="p-idcard-${i}" value="${p.idCard || '--'}" class="border rounded-xl px-2 py-1.5 text-xs bg-gray-50 w-28" disabled></td>
                <td class="py-3 text-gray-500"><input type="date" id="p-dob-${i}" value="${p.dob}" class="border rounded-xl px-2 py-1.5 text-xs bg-gray-50" disabled></td>
                <td class="py-3 text-gray-500"><input type="text" id="p-phone-${i}" value="${p.phone}" class="border rounded-xl px-2 py-1.5 text-xs bg-gray-50 w-28" disabled></td>
                <td class="py-3"><span class="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl text-xs font-bold">${p.conditionsText || 'مسجل'}</span></td>
                <td class="py-3 text-cyan-700 font-bold text-xs"><i class="fa-solid fa-folder"></i> ${((p.medicalHistory?.labs?.length || 0) + (p.medicalHistory?.imaging?.length || 0))} ملفات</td>
                <td class="py-3 flex items-center gap-2">${editControls}</td>
            </tr>
        `;
    });
}

function enablePatientEdit(i) {
    if (currentUserRole !== 'admin') { alert("للمسؤول فقط!"); return; }
    document.getElementById(`p-name-${i}`).removeAttribute('disabled');
    document.getElementById(`p-idcard-${i}`).removeAttribute('disabled');
    document.getElementById(`p-dob-${i}`).removeAttribute('disabled');
    document.getElementById(`p-phone-${i}`).removeAttribute('disabled');
    document.getElementById(`p-edit-btn-${i}`).classList.add('hidden');
    document.getElementById(`p-save-btn-${i}`).classList.remove('hidden');
}

function savePatientEdit(i) {
    if (db.patientsList[i]) {
        db.patientsList[i].name = document.getElementById(`p-name-${i}`).value;
        db.patientsList[i].idCard = document.getElementById(`p-idcard-${i}`).value;
        db.patientsList[i].dob = document.getElementById(`p-dob-${i}`).value;
        db.patientsList[i].phone = document.getElementById(`p-phone-${i}`).value;
        saveAndSync();
        showToast("تم الحفظ!");
        logAuditAction(`تعديل بيانات مريض رقم ${i}`);
    }
}

function deletePatient(i) {
    db.patientsList.splice(i, 1);
    saveAndSync();
    showToast("تم الحذف");
    logAuditAction("حذف مريض");
}

function renderStaffManagementTable() {
    let tb = document.getElementById('staffManagementTableBody');
    if (!tb) return;
    tb.innerHTML = '';
    db.staffList.forEach((s, i) => {
        let editControls = currentUserRole === 'admin' ? `
            <button id="st-edit-btn-${i}" onclick="enableStaffMemberEdit(${i})" class="bg-blue-50 border text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-pen"></i> تعديل</button>
            <button id="st-save-btn-${i}" onclick="saveStaffMemberEdit(${i})" class="hidden bg-emerald-50 border text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
            <button onclick="deleteStaffMember(${i})" class="text-red-500 font-bold px-1.5"><i class="fa-solid fa-trash"></i></button>
        ` : `<span class="text-xs text-gray-400">للمسؤول فقط</span>`;

        tb.innerHTML += `
            <tr>
                <td class="p-3 font-bold"><input type="text" id="st-name-${i}" value="${s.name}" class="border rounded-xl px-2 py-1.5 text-xs bg-gray-50 w-32" disabled></td>
                <td class="p-3"><input type="text" id="st-user-${i}" value="${s.username}" class="border rounded-xl px-2 py-1.5 text-xs bg-gray-50 w-24" disabled></td>
                <td class="p-3"><input type="text" id="st-pass-${i}" value="${s.password}" class="border rounded-xl px-2 py-1.5 text-xs bg-gray-50 w-24" disabled></td>
                <td class="p-3">
                    <select id="st-role-${i}" class="border rounded-xl px-2 py-1.5 text-xs bg-gray-50" disabled>
                        <option value="admin" ${s.role==='admin'?'selected':''}>مدير</option>
                        <option value="doctor" ${s.role==='doctor'?'selected':''}>طبيب</option>
                        <option value="receptionist" ${s.role==='receptionist'?'selected':''}>استقبال</option>
                    </select>
                </td>
                <td class="p-3 flex items-center gap-2">${editControls}</td>
            </tr>
        `;
    });
}

function enableStaffMemberEdit(i) {
    if (currentUserRole !== 'admin') { alert("للمسؤول فقط!"); return; }
    document.getElementById(`st-name-${i}`).removeAttribute('disabled');
    document.getElementById(`st-user-${i}`).removeAttribute('disabled');
    document.getElementById(`st-pass-${i}`).removeAttribute('disabled');
    document.getElementById(`st-role-${i}`).removeAttribute('disabled');
    document.getElementById(`st-edit-btn-${i}`).classList.add('hidden');
    document.getElementById(`st-save-btn-${i}`).classList.remove('hidden');
}

function saveStaffMemberEdit(i) {
    if (db.staffList[i]) {
        db.staffList[i].name = document.getElementById(`st-name-${i}`).value;
        db.staffList[i].username = document.getElementById(`st-user-${i}`).value;
        db.staffList[i].password = document.getElementById(`st-pass-${i}`).value;
        db.staffList[i].role = document.getElementById(`st-role-${i}`).value;
        saveAndSync();
        showToast("تم الحفظ بنجاح!");
        logAuditAction(`تعديل بيانات المستخدم: ${db.staffList[i].name}`);
    }
}

function deleteStaffMember(i) {
    if (db.staffList.length <= 1) { alert("لا يمكن حذف المسؤول الأخير!"); return; }
    db.staffList.splice(i, 1);
    saveAndSync();
    showToast("تم الحذف");
    logAuditAction("حذف مستخدم");
}

function loadDoctors() {
    let tb = document.getElementById('doctorsTbody');
    if (!tb) return;
    tb.innerHTML = '';
    db.doctorsList.forEach((d, i) => {
        let delBtn = currentUserRole === 'admin' ? `<button onclick="deleteDoctor(${i})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i></button>` : '';
        tb.innerHTML += `<tr><td class="py-3 font-bold">${d.name}</td><td class="py-3 text-gray-500">${d.specialty}</td><td class="py-3 text-gray-500">${d.shift}</td><td class="py-3 text-gray-500">${d.phone}</td><td class="py-3">${delBtn}</td></tr>`;
    });
    populateTriageDoctorDropdown();
}
function deleteDoctor(i) {
    db.doctorsList.splice(i, 1);
    saveAndSync();
    showToast("تم الحذف");
    logAuditAction("حذف طبيب");
}

function loadAppointments() {
    let tb2 = document.getElementById('fullAppointmentsTbody');
    if (tb2) tb2.innerHTML = '';
    db.appointments.forEach((item, i) => {
        let delBtn = currentUserRole === 'admin' ? `<button onclick="deleteAppointment(${i})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i></button>` : '';
        let row = `<tr><td class="py-3 font-bold">${item.name}</td><td class="py-3 text-indigo-700">${item.doctor}</td><td class="py-3 text-gray-500">${item.date}</td><td class="py-3"><span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold">${item.status}</span></td><td class="py-3">${delBtn}</td></tr>`;
        if (tb2) tb2.innerHTML += row;
    });
}
function deleteAppointment(i) {
    db.appointments.splice(i, 1);
    saveAndSync();
    showToast("تم الحذف");
    logAuditAction("حذف موعد");
}

function loadInvoices() {
    let tb = document.getElementById('invoicesTbody');
    if (!tb) return;
    tb.innerHTML = '';
    let tot = 0;
    db.invoicesList.forEach((inv, i) => {
        tot += Number(inv.amount);
        let delBtn = currentUserRole === 'admin' ? `<button onclick="deleteInvoice(${i})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i></button>` : '';
        tb.innerHTML += `<tr><td class="p-3.5 font-bold">${inv.invNum}</td><td class="p-3.5">${inv.patient}</td><td class="p-3.5 text-gray-500">${inv.service}</td><td class="p-3.5 font-bold text-[#0097b2]">$${inv.amount}</td><td class="p-3.5 text-emerald-600 font-bold text-xs">${inv.status}</td><td class="p-3.5">${delBtn}</td></tr>`;
    });
    document.getElementById('statTotalRevenue').innerText = `$${tot}`;
}
function deleteInvoice(i) {
    db.invoicesList.splice(i, 1);
    saveAndSync();
    showToast("تم الحذف");
    logAuditAction("حذف فاتورة");
}

function searchTable() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    document.querySelectorAll('.tab-content:not(.hidden) tbody tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(input) ? "" : "none");
}

function openModal(type) {
    document.querySelectorAll('#modal-invoice, #modal-simple').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.simple-form').forEach(el => el.classList.add('hidden'));
    if (type === 'invoice') {
        document.getElementById('modal-invoice').classList.remove('hidden');
    } else {
        document.getElementById('modal-simple').classList.remove('hidden');
        if (type === 'patient') document.getElementById('form-newPatient').classList.remove('hidden');
        if (type === 'appointment') document.getElementById('form-newAppt').classList.remove('hidden');
        if (type === 'doctor') document.getElementById('form-newDoctor').classList.remove('hidden');
        if (type === 'staff') document.getElementById('form-newStaff').classList.remove('hidden');
    }
}

function closeModal(id) {
    if (id === 'invoice') document.getElementById('modal-invoice').classList.add('hidden');
    else if (id === 'medical-record') document.getElementById('modal-medical-record').classList.add('hidden');
    else if (id === 'add-patient-file') document.getElementById('modal-add-patient-file').classList.add('hidden');
    else document.getElementById('modal-simple').classList.add('hidden');
}

function addDoctor(e) {
    e.preventDefault();
    db.doctorsList.push({ name: document.getElementById('dName').value, specialty: document.getElementById('dSpec').value, shift: "8ص - 4م", phone: "0500000000" });
    saveAndSync();
    closeModal('simple');
    showToast("تم حفظ الطبيب");
    logAuditAction(`إضافة طبيب: ${document.getElementById('dName').value}`);
}

function addAppointment(e) {
    e.preventDefault();
    db.appointments.push({ name: document.getElementById('aPat').value, doctor: document.getElementById('aDoc').value, date: document.getElementById('aDate').value, status: "مؤكد" });
    saveAndSync();
    closeModal('simple');
    showToast("تم حجز الموعد");
    logAuditAction(`حجز موعد: ${document.getElementById('aPat').value}`);
}

function addStaff(e) {
    e.preventDefault();
    db.staffList.push({ name: document.getElementById('sName').value, username: document.getElementById('sUser').value, password: document.getElementById('sPass').value, role: document.getElementById('sRole').value, allowedTabs: ['dashboard', 'reception', 'appointments', 'patients', 'invoices', 'prescriptions'] });
    saveAndSync();
    closeModal('simple');
    showToast("تم إنشاء الموظف");
    logAuditAction(`إنشاء موظف: ${document.getElementById('sName').value}`);
}

function saveInvoice(e) {
    e.preventDefault();
    let patName = document.getElementById('invPatientSelect').value || "مريض عام";
    let fee = parseFloat(document.getElementById('invConsultFee').value) || 30;
    db.invoicesList.push({ invNum: "INV-" + (1000 + db.invoicesList.length + 1), patient: patName, service: "كشفية زيارة", amount: fee, status: "مدفوع" });
    saveAndSync();
    closeModal('invoice');
    showToast("تم إصدار الفاتورة");
    logAuditAction(`إصدار فاتورة للمريض: ${patName}`);
}

function loadClinicSettingsInputs() {
    const stg = { clinicName: "عيادات الأسرة", specialty: "طب عام وجراحة", phone: "0790950784", address: "الروابي", defaultFee: 30, taxRate: 0, currency: "$", workingHours: "08:00 AM - 04:00 PM", printSize: "A4", soundAlerts: "on" };
    if (document.getElementById('stgClinicName')) document.getElementById('stgClinicName').value = stg.clinicName || '';
    if (document.getElementById('stgSpecialty')) document.getElementById('stgSpecialty').value = stg.specialty || '';
    if (document.getElementById('stgPhone')) document.getElementById('stgPhone').value = stg.phone || '';
    if (document.getElementById('stgAddress')) document.getElementById('stgAddress').value = stg.address || '';
    if (document.getElementById('stgDefaultFee')) document.getElementById('stgDefaultFee').value = stg.defaultFee || 30;
    if (document.getElementById('stgTaxRate')) document.getElementById('stgTaxRate').value = stg.taxRate || 0;
    if (document.getElementById('stgCurrency')) document.getElementById('stgCurrency').value = stg.currency || '$';
    if (document.getElementById('stgWorkingHours')) document.getElementById('stgWorkingHours').value = stg.workingHours || '';
    if (document.getElementById('stgPrintSize')) document.getElementById('stgPrintSize').value = stg.printSize || 'A4';
    if (document.getElementById('stgSoundAlerts')) document.getElementById('stgSoundAlerts').value = stg.soundAlerts || 'on';
}

function saveClinicSettings(e) {
    e.preventDefault();
    if (currentUserRole !== 'admin') { alert("للمسؤول فقط!"); return; }
    showToast("تم حفظ الإعدادات بنجاح!");
    logAuditAction("تحديث إعدادات النظام");
}

function exportDatabaseBackup() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    let dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "clinic_backup_" + new Date().toISOString().split('T')[0] + ".json");
    dlAnchorElem.click();
    showToast("تم تصدير النسخة الاحتياطية");
}

function importDatabaseBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            db = JSON.parse(e.target.result);
            saveAndSync();
            showToast("تم استرجاع النسخة الاحتياطية بنجاح!");
        } catch(err) {
            alert("الملف غير صالح!");
        }
    };
    reader.readAsText(file);
}

function addDrugToTemplateList() {
    let drugName = document.getElementById('prescDrugName').value.trim();
    let doses = document.getElementById('prescDoses').value;
    let time = document.getElementById('prescTime').value;
    let duration = document.getElementById('prescDuration').value.trim() || "5 أيام";
    if (!drugName) { alert("أدخل اسم الدواء أولاً!"); return; }
    currentPrescriptionItems.push({ drugName, doses, time, duration });
    document.getElementById('prescDrugName').value = '';
    document.getElementById('prescDuration').value = '';
    renderCurrentPrescriptionTable();
}

function renderCurrentPrescriptionTable() {
    let tb = document.getElementById('currentPrescriptionTableBody');
    let hiddenText = document.getElementById('examPrescriptionText');
    if (!tb) return;
    if (currentPrescriptionItems.length === 0) {
        tb.innerHTML = `<tr><td colspan="5" class="p-3 text-center text-gray-400">لم يتم إضافة أدوية للوصفة بعد</td></tr>`;
        hiddenText.value = "";
        return;
    }
    tb.innerHTML = '';
    let formattedTextLines = [];
    currentPrescriptionItems.forEach((item, index) => {
        formattedTextLines.push(`- ${item.drugName} | الجرعة: ${item.doses} | الوقت: ${item.time} | المدة: ${item.duration}`);
        tb.innerHTML += `
            <tr>
                <td class="p-2.5 font-bold text-purple-950">${item.drugName}</td>
                <td class="p-2.5">${item.doses}</td>
                <td class="p-2.5">${item.time}</td>
                <td class="p-2.5">${item.duration}</td>
                <td class="p-2.5 text-center"><button type="button" onclick="removeDrugFromTemplate(${index})" class="text-rose-500 font-bold"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
    hiddenText.value = formattedTextLines.join('\n');
}

function removeDrugFromTemplate(index) {
    currentPrescriptionItems.splice(index, 1);
    renderCurrentPrescriptionTable();
}

function saveAndDispensePrescription() {
    let prescText = document.getElementById('examPrescriptionText').value.trim();
    if (!prescText) { alert("أضف أدوية للوصفة أولاً!"); return; }
    let patName = currentPatientInExam ? currentPatientInExam.name : "مريض عام";

    db.prescriptionsList.unshift({
        patient: patName,
        doctor: currentPatientInExam ? currentPatientInExam.doctor : currentUsername,
        date: new Date().toLocaleDateString(),
        medications: prescText,
        status: "تم الصرف"
    });
    saveAndSync();
    showToast("تم صرف الوصفة الطبية بنجاح!");
    logAuditAction(`صرف وصفة للمريض: ${patName}`);
    currentPrescriptionItems = [];
    renderCurrentPrescriptionTable();
}

function printPrescriptionReport() {
    let patName = currentPatientInExam ? currentPatientInExam.name : "غير محدد";
    let diag = document.getElementById('examDiagnosis').value || "غير مدون";
    let proc = document.getElementById('examProcedure').value || "غير مدون";
    let presc = document.getElementById('examPrescriptionText').value || "لا توجد أدوية";
    
    let printWindow = window.open('', '_printWindow', 'width=800,height=600');
    printWindow.document.write(`
        <html dir="rtl">
        <head><title>تقرير ووصفة طبية</title>
        <style>body{font-family:Tahoma;padding:20px;color:#333;} h2{color:#0097b2;border-bottom:2px solid #0097b2;padding-bottom:10px;}</style>
        </head>
        <body onload="window.print();window.close()">
            <h2>عيادات الأسرة الطبية | تقرير الفحص والوصفة</h2>
            <p><b>اسم المريض:</b> ${patName}</p>
            <p><b>التاريخ:</b> ${new Date().toLocaleDateString()}</p>
            <hr/>
            <p><b>التشخيص:</b><br/>${diag}</p>
            <p><b>الإجراءات:</b><br/>${proc}</p>
            <p><b>الوصفة الطبية:</b><br/>${presc.replace(/\n/g, '<br/>')}</p>
            <br/><br/>
            <div style="text-align: left;"><b>ختم الطبيب المعالج</b></div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    currentUploadedFileName = file.name;
    const reader = new FileReader();
    reader.onload = function(e) { currentUploadedFileBase64 = e.target.result; };
    reader.readAsDataURL(file);
    document.getElementById('filePreviewName').innerText = file.name;
    document.getElementById('filePreviewContainer').classList.remove('hidden');
}
function clearSelectedFile() {
    currentUploadedFileBase64 = null;
    currentUploadedFileName = "";
    document.getElementById('medFileInput').value = "";
    document.getElementById('filePreviewContainer').classList.add('hidden');
}

function renderPatientMedicalHistoryInExam(patientName) {
    const labsBox = document.getElementById('examPastLabsContainer');
    const imgBox = document.getElementById('examPastImagingContainer');
    if (!labsBox || !imgBox) return;
    labsBox.innerHTML = '';
    imgBox.innerHTML = '';
    const patient = db.patientsList.find(p => p.name.trim().toLowerCase() === (patientName || '').trim().toLowerCase());
    const labs = (patient && patient.medicalHistory && patient.medicalHistory.labs) || [];
    const imaging = (patient && patient.medicalHistory && patient.medicalHistory.imaging) || [];

    if (labs.length === 0) labsBox.innerHTML = `<p class="text-gray-400 text-xs py-2">لا توجد تحاليل مسجلة</p>`;
    else labs.forEach(l => {
        let fileBtn = l.fileData ? `<a href="${l.fileData}" download="${l.fileName || 'lab-file'}" target="_blank" class="text-blue-600 font-bold underline block mt-1"><i class="fa-solid fa-download"></i> معاينة / تحميل الملف (${l.fileName || 'مرفق'})</a>` : '';
        labsBox.innerHTML += `<div class="p-2.5 rounded-2xl border bg-emerald-50 text-xs shadow-sm"><b class="text-emerald-900">${l.title}</b> (${l.date})<p class="text-gray-600 mt-0.5">${l.result}</p>${fileBtn}</div>`;
    });

    if (imaging.length === 0) imgBox.innerHTML = `<p class="text-gray-400 text-xs py-2">لا توجد صور أشعة مسجلة</p>`;
    else imaging.forEach(img => {
        let fileBtn = img.fileData ? `<a href="${img.fileData}" download="${img.fileName || 'imaging-file'}" target="_blank" class="text-blue-600 font-bold underline block mt-1"><i class="fa-solid fa-download"></i> معاينة / تحميل صورة الأشعة</a>` : '';
        imgBox.innerHTML += `<div class="p-2.5 rounded-2xl border bg-blue-50 text-xs shadow-sm"><b class="text-blue-900">${img.title}</b> (${img.date})<p class="text-gray-600 mt-0.5">${img.result}</p>${fileBtn}</div>`;
    });
}

function openAddMedicalRecordModal() {
    let patName = currentPatientInExam ? currentPatientInExam.name : "";
    if (!patName) { alert("اختر مريضاً أولاً!"); return; }
    document.getElementById('medRecPatientName').value = patName;
    document.getElementById('medRecDate').value = new Date().toISOString().split('T')[0];
    clearSelectedFile();
    document.getElementById('modal-medical-record').classList.remove('hidden');
}

function savePatientMedicalRecordWithFile(e) {
    e.preventDefault();
    const patName = document.getElementById('medRecPatientName').value.trim();
    const type = document.getElementById('medRecType').value;
    const date = document.getElementById('medRecDate').value;
    const title = document.getElementById('medRecTitle').value.trim();
    const result = document.getElementById('medRecResult').value.trim();

    let patient = db.patientsList.find(p => p.name.trim().toLowerCase() === patName.toLowerCase());
    if (patient) {
        if (!patient.medicalHistory) patient.medicalHistory = { labs: [], imaging: [] };
        const recordObj = { date, title, result, fileData: currentUploadedFileBase64, fileName: currentUploadedFileName };
        if (type === 'lab') patient.medicalHistory.labs.unshift(recordObj);
        else patient.medicalHistory.imaging.unshift(recordObj);
        saveAndSync();
        closeModal('medical-record');
        if (currentPatientInExam && currentPatientInExam.name === patName) renderPatientMedicalHistoryInExam(patName);
        showToast("تم الحفظ بنجاح!");
    }
}

function resetClinicData() {
    if (currentUserRole !== 'admin') { alert("للمسؤول فقط!"); return; }
    let conf = confirm("تحذير: هل أنت متأكد من مسح وتصفير معطيات العيادة؟");
    if (conf) {
        db.patientsList = [];
        db.appointments = [];
        db.invoicesList = [];
        db.triageQueue = [];
        db.prescriptionsList = [];
        saveAndSync();
        showToast("تم التصفير بنجاح!");
    }
}
