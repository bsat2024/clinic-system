let currentLang = localStorage.getItem('clinicLang') || 'ar';
let currentUserRole = 'admin';
let currentUsername = 'admin';
let isSidebarCollapsed = false;
let currentPatientInExam = JSON.parse(localStorage.getItem('currentPatientInExam')) || null;
let currentUploadedFileBase64 = null;
let currentUploadedFileName = "";
let currentPatientInitFileBase64 = null;
let currentPatientInitFileName = "";
let currentPrescriptionItems = [];

let currentAllowedTabs = ['dashboard', 'reception', 'examination', 'appointments', 'patients', 'doctors', 'prescriptions', 'invoices', 'reports', 'staff', 'settings'];

let socket = null;
try {
    socket = io(window.location.origin, { reconnectionAttempts: 1 });
    socket.on('patient-called-broadcast', (data) => {
        triggerNurseNextPatientAlert(data.patientName, data.doctorName);
    });
} catch(e) {}

const translations = {
    ar: {
        pageTitle: "عيادات الأسرة | النظام الطبي الاحترافي",
        loginTitle: "تسجيل الدخول للعيادة",
        loginSubtitle: "نظام إدارة تدفق المرضى والفحص السريري",
        lblUser: "اسم المستخدم",
        lblPass: "كلمة المرور",
        btnLogin: "دخول للنظام",
        welcomeText: "أهلاً بك مجدداً",
        lblCardPatients: "المرضى اليوم",
        lblCardAppts: "المواعيد",
        lblCardRev: "الإيرادات",
        lblCardSatisfaction: "رضا المرضى",
        btnRec: "الاستقبال والتجهيز",
        btnExam: "غرفة الفحص",
        btnInv: "فاتورة جديدة",
        lblUpcomingAppts: "المواعيد القادمة",
        thPatName: "اسم المريض",
        thDocName: "الطبيب المعالج",
        thDateTime: "التاريخ والوقت",
        thStatus: "الحالة",
        thActions: "الإجراءات والتعديل",
        thDob: "تاريخ الميلاد",
        thPhone: "رقم الهاتف",
        thSpec: "التخصص",
        thShift: "الدوام",
        thMeds: "الأدوية",
        thDate: "التاريخ",
        thInvNum: "رقم الفاتورة",
        thService: "الخدمة",
        thAmount: "المبلغ",
        thPaymentStatus: "الدفع",
        recTitle: "مكتب الاستقبال، تسجيل المرضى وقياس العلامات الحيوية",
        recSubtitle: "البحث برقم بطاقة التعريف، تسجيل المرضى الجدد، وقياس العلامات الحيوية",
        lblSelPatient: "اسم المريض الكامل",
        lblAssignDoc: "الطبيب المعالج",
        lblTension: "ضغط الدم",
        lblWeight: "الوزن (kg)",
        lblSugar: "نسبة السكري (g/L)",
        btnSubmitTriage: "تسجيل وإرسال المريض لقائمة انتظار الفحص",
        lblQueueTitle: "قائمة انتظار المرضى عند الطبيب",
        thTurn: "الدور",
        thAssignedDoc: "الطبيب الموجه إليه",
        thVitals: "المؤشرات الحيوية",
        thPatCategory: "صفة الزيارة",
        examTitle: "غرفة الفحص الإكلينيكي وصرف الوصفات",
        lblDiagTitle: "التشخيص الطبي السريري (Diagnosis)",
        lblProcTitle: "الإجراءات الطبية (Procedure)",
        lblPrescTitle: "الوصفة الطبية الموصوفة",
        btnFinishText: "إنهاء الفحص وتخريج المريض",
        lblPatCardInfo: "المريض قيد الفحص حالياً",
        lblMedicalConditions: "المشاكل الصحية المزمنة",
        lblEmergencyOption: "حالة طارئة / أولوية مستعجلة في الدور",
        apptsTabTitle: "إدارة جدول المواعيد",
        btnNewAppt: "موعد جديد",
        btnNewPat: "مريض جديد",
        patsTabTitle: "المرضى المسجلين بالنظام",
        docsTabTitle: "قائمة الأطباء والتخصصات",
        prescTabTitle: "سجل الوصفات الطبية",
        invTabTitle: "الفواتير والتحصيل",
        repTabTitle: "التقارير والإحصائيات الشاملة",
        titlePermissions: "صلاحيات المستخدمين وإدارة الحسابات وكلمات المرور",
        btnNewStaff: "إنشاء حساب موظف جديد",
        colUsersTable: "إدارة وتعديل حسابات المستخدمين",
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
        clinicSubTitle: "Clinical System",
        lblMedRecordHeader: "الملف الصحي التراكمي (الأشعة والتحاليل السابقة للمريض)",
        lblMedRecordSub: "يعرض كافة الفحوصات والتقارير الطبية التي أحضرها المريض سابقاً",
        btnAddNewRecordExam: "إدراج تحليل / أشعة جديدة",
        lblPastLabs: "سجل التحاليل المخبرية السابقة",
        lblPastImaging: "سجل الأشعة والتصوير السابقة",
        modalTitleMedRecord: "إدراج فحص طبي"
    },
    fr: {
        pageTitle: "Clinique Familiale | Système Médical",
        loginTitle: "Connexion au Cabinet",
        loginSubtitle: "Gestion du flux patients et consultation clinique",
        lblUser: "Nom d'utilisateur",
        lblPass: "Mot de passe",
        btnLogin: "Se connecter",
        welcomeText: "Bienvenue à nouveau",
        lblCardPatients: "Patients du jour",
        lblCardAppts: "Rendez-vous",
        lblCardRev: "Revenus",
        lblCardSatisfaction: "Satisfaction",
        btnRec: "Accueil & Triage",
        btnExam: "Salle d'Examen",
        btnPresc: "Ordonnance",
        btnInv: "Nouvelle Facture",
        lblUpcomingAppts: "Prochains Rendez-vous",
        thPatName: "Nom du Patient",
        thDocName: "Médecin Traitant",
        thDateTime: "Date et Heure",
        thStatus: "Statut",
        thActions: "Actions & Édition",
        thDob: "Date de Naissance",
        thPhone: "Téléphone",
        thSpec: "Spécialité",
        thShift: "Horaires",
        thMeds: "Médicaments",
        thDate: "Date",
        thInvNum: "N° Facture",
        thService: "Service Détaillé",
        thAmount: "Montant",
        thPaymentStatus: "Paiement",
        recTitle: "Accueil, Enregistrement des Patients & Constantes",
        recSubtitle: "Recherche par carte d'identité, enregistrement et constantes",
        lblSelPatient: "Nom du Patient",
        lblAssignDoc: "Médecin Traitant",
        lblTension: "Tension Artérielle",
        lblWeight: "Poids (kg)",
        lblSugar: "Glycémie (g/L)",
        btnSubmitTriage: "Valider et envoyer en file d'attente",
        lblQueueTitle: "File d'attente des patients",
        thTurn: "Tour",
        thAssignedDoc: "Médecin",
        thVitals: "Signes Vitaux",
        thPatCategory: "Catégorie",
        examTitle: "Salle de Consultation & Ordonnances",
        lblDiagTitle: "Diagnostic Clinique (Diagnosis)",
        lblProcTitle: "Procédures et Examens (Procedure)",
        lblPrescTitle: "Ordonnance Médicale Prescrite",
        btnFinishText: "Clôturer la consultation et facturer",
        lblPatCardInfo: "Patient en cours d'examen",
        lblMedicalConditions: "Antécédents & Pathologies",
        lblEmergencyOption: "Cas d'urgence / Priorité absolue",
        apptsTabTitle: "Gestion du Calendrier des RDV",
        btnNewAppt: "Nouveau RDV",
        btnNewPat: "Nouveau Patient",
        patsTabTitle: "Patients Enregistrés",
        docsTabTitle: "Médecins & Spécialités",
        prescTabTitle: "Registre des Ordonnances",
        invTabTitle: "Factures & Paiements",
        repTabTitle: "Rapports & Statistiques",
        titlePermissions: "Permissions & Gestion des Comptes",
        btnNewStaff: "Nouvel Utilisateur",
        colPerms: "Interfaces Autorisées",
        colUsers: "Liste des Utilisateurs",
        colUsersTable: "Gestion et édition des comptes",
        settingsTabTitle: "Paramètres du Système",
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
        btnLogout: "Déconnexion",
        optSelDocDefault: "-- Sélectionner le médecin --",
        clinicBrandName: "Clinique Familiale",
        clinicSubTitle: "Clinical System",
        lblMedRecordHeader: "Dossier Médical (Analyses et Radiographies)",
        lblMedRecordSub: "Affiche l'ensemble des examens et comptes-rendus apportés par le patient",
        btnAddNewRecordExam: "Ajouter une Analyse / Radio",
        lblPastLabs: "Analyses de Laboratoire",
        lblPastImaging: "Radiographies & Imagerie",
        modalTitleMedRecord: "Ajouter un Examen Médical"
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

document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    
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
    
    setInterval(() => {
        if (!document.getElementById('appContainer').classList.contains('hidden')) {
            loadTriageQueue();
            updateSidebarBadges();
            loadCurrentExamCard();
            updateLiveBottomActiveBar();
        }
    }, 1500);
});

function logAuditAction(actionText) {
    let logs = JSON.parse(localStorage.getItem('auditLogs')) || [];
    logs.unshift({ user: currentUsername, action: actionText, time: new Date().toLocaleString() });
    if (logs.length > 50) logs.pop();
    localStorage.setItem('auditLogs', JSON.stringify(logs));
    renderAuditLogsTable();
}

function renderAuditLogsTable() {
    let tb = document.getElementById('auditLogTbody');
    if (!tb) return;
    tb.innerHTML = '';
    let logs = JSON.parse(localStorage.getItem('auditLogs')) || [];
    if (logs.length === 0) {
        tb.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-gray-400">لا توجد سجلات نشاط مسجلة</td></tr>`;
        return;
    }
    logs.forEach(l => {
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
        desc = "تجاوزات حرجة في ضغط الدم أو سكر الدم تستدعي تدخلاً عاجلاً!";
        bgClass = "bg-gradient-to-r from-rose-600 to-red-700";
        badgeClass = "bg-white text-rose-700";
    } else if (sys >= 14 || sVal >= 1.4) {
        riskLevel = "تنبيه متوسط";
        desc = "ملاحظة ارتفاع طفيف يستوجب المراقبة الطبية والمتابعة المستمرة.";
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

    const invoices = JSON.parse(localStorage.getItem('invoicesList')) || [];
    let totalRev = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    
    const patients = JSON.parse(localStorage.getItem('patientsList')) || [];
    const totalPatientsCount = patients.length;

    const patCard = document.getElementById('statTotalPatientsCard');
    if (patCard) patCard.innerText = totalPatientsCount;

    const queueData = JSON.parse(localStorage.getItem('triageQueue')) || [];
    const apptsData = JSON.parse(localStorage.getItem('appointments')) || [];
    const apptCard = document.getElementById('statPendingAppts');
    if (apptCard) apptCard.innerText = apptsData.length + queueData.length;

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

    let emergencyCount = queueData.filter(q => q.isEmergency).length;
    let normalCount = totalPatientsCount - emergencyCount > 0 ? totalPatientsCount - emergencyCount : 1;

    casesChartInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['حالات طارئة / حرجة', 'مرضى عاديين / مسجلين', 'قائمة الانتظار'],
            datasets: [{ data: [emergencyCount, normalCount, queueData.length], backgroundColor: ['#e11d48', '#0097b2', '#f59e0b'] }]
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

    const patients = JSON.parse(localStorage.getItem('patientsList')) || [];
    const foundPatient = patients.find(p => (p.idCard || '').trim() === cleanId);

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

    let patients = JSON.parse(localStorage.getItem('patientsList')) || [];
    let patientObj = patients.find(p => (p.idCard || '').trim() === idCard);

    if (!patientObj) {
        patientObj = { 
            name, 
            idCard, 
            phone: phone || '--', 
            dob: "2000-01-01", 
            visitsCount: 1, 
            conditionsText: "مريض جديد", 
            medicalHistory: { labs: [], imaging: [] } 
        };
        patients.push(patientObj);
    } else {
        patientObj.visitsCount = (patientObj.visitsCount || 1) + 1;
        patientObj.conditionsText = "متابع";
    }
    localStorage.setItem('patientsList', JSON.stringify(patients));

    let queue = JSON.parse(localStorage.getItem('triageQueue')) || [];
    queue.push({ id: "Q-" + Date.now(), name, idCard, doctor, bp, weight, sugar, isEmergency, timestamp: Date.now() });
    queue.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0) || a.timestamp - b.timestamp);
    localStorage.setItem('triageQueue', JSON.stringify(queue));
    
    loadTriageQueue();
    loadPatients();
    updateSidebarBadges();
    e.target.reset();
    document.getElementById('patientStatusBadge').className = 'hidden';
    showToast("تم تسجيل المريض وإرساله لقائمة الانتظار بنجاح!");
    logAuditAction(`تسجيل ترياج للمريض: ${name} (ID: ${idCard})`);
}

function loadTriageQueue() {
    const tb = document.getElementById('triageQueueTbody');
    if (!tb) return;
    tb.innerHTML = '';
    let queue = JSON.parse(localStorage.getItem('triageQueue')) || [];
    queue.sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0) || a.timestamp - b.timestamp);
    if (queue.length === 0) {
        tb.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-400 font-bold">لا يوجد مرضى بقائمة الانتظار</td></tr>`;
        populateDoctorQueueQuickDropdown();
        return;
    }
    queue.forEach((item, index) => {
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
    let queue = JSON.parse(localStorage.getItem('triageQueue')) || [];
    let targetIndex = queue.findIndex(q => q.name === patientName);
    if (targetIndex === -1) return;
    let targetPatient = queue[targetIndex];
    queue.splice(targetIndex, 1);
    localStorage.setItem('triageQueue', JSON.stringify(queue));
    loadTriageQueue();
    updateSidebarBadges();

    currentPatientInExam = { name: targetPatient.name, idCard: targetPatient.idCard, doctor: targetPatient.doctor, bp: targetPatient.bp, sugar: targetPatient.sugar, weight: targetPatient.weight, isEmergency: targetPatient.isEmergency, startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    localStorage.setItem('currentPatientInExam', JSON.stringify(currentPatientInExam));

    triggerNurseNextPatientAlert(targetPatient.name, targetPatient.doctor);

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

    let invs = JSON.parse(localStorage.getItem('invoicesList')) || [];
    invs.push({
        invNum: "INV-" + (1000 + invs.length + 1),
        patient: currentPatientInExam.name,
        service: `كشفية ($${consultFee}) + ECG ($${ecgFee}) + محلول ($${ivFee})`,
        amount: totalAmount,
        status: "مدفوع"
    });
    localStorage.setItem('invoicesList', JSON.stringify(invs));

    closeExamPricingModal();
    logAuditAction(`إنهاء فحص وتخريج المريض وإصدار فاتورة: ${currentPatientInExam.name}`);
    
    let queue = JSON.parse(localStorage.getItem('triageQueue')) || [];
    if (queue.length > 0) {
        let nextPatient = queue[0];
        triggerNurseNextPatientAlert(nextPatient.name, nextPatient.doctor);
    }

    currentPatientInExam = null;
    localStorage.removeItem('currentPatientInExam');
    updateLiveBottomActiveBar();
    loadInvoices();
    showToast("تم تخريج المريض وإصدار الفاتورة الشاملة بنجاح!");
}

function populateTriageDoctorDropdown() {
    let d = JSON.parse(localStorage.getItem('doctorsList')) || [];
    let sel = document.getElementById('triageDoctor');
    let aDoc = document.getElementById('aDoc');
    if (sel) { sel.innerHTML = `<option value="">اختر الطبيب</option>`; d.forEach(item => sel.innerHTML += `<option>${item.name}</option>`); }
    if (aDoc) { aDoc.innerHTML = ''; d.forEach(item => aDoc.innerHTML += `<option>${item.name}</option>`); }
}
function populateDoctorQueueQuickDropdown() {
    let q = JSON.parse(localStorage.getItem('triageQueue')) || [];
    const sel = document.getElementById('docQueueQuickSelect');
    if (sel) { sel.innerHTML = `<option value="">-- اختر مريضاً للفحص --</option>`; q.forEach(item => sel.innerHTML += `<option>${item.name}</option>`); }
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

// دالة تسجيل الدخول عبر الاتصال المباشر بالسيرفر السحابي أو المحلي
async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();

    try {
        let response = await fetch(window.location.origin + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        let result = await response.json();

        if (result.success) {
            let found = result.user;
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
    } catch (err) {
        alert("تعذر الاتصال بالسيرفر الرئيسي للعيادة!");
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
    loadPatients();
    loadDoctors();
    loadAppointments();
    loadInvoices();
    loadTriageQueue();
    updateLiveBottomActiveBar();
    populateTriageDoctorDropdown();
    loadClinicSettingsInputs();
    renderAuditLogsTable();
    initDashboardCharts();
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
    const queue = JSON.parse(localStorage.getItem('triageQueue')) || [];
    const bQueue = document.getElementById('badge-queue');
    if (bQueue) bQueue.innerText = queue.length;
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

function addPatientSimpleModal(e) {
    e.preventDefault();
    let idCard = document.getElementById('modalPatID').value.trim();
    let name = document.getElementById('modalPatName').value.trim();
    let dob = document.getElementById('modalPatDob').value;
    let phone = document.getElementById('modalPatPhone').value;

    let p = JSON.parse(localStorage.getItem('patientsList')) || [];
    let existing = p.find(item => (item.idCard || '').trim() === idCard);
    if (existing) {
        alert("رقم بطاقة التعريف مسجل مسبقاً لمريض آخر!");
        return;
    }

    p.push({ name, idCard, dob, phone, visitsCount: 1, conditionsText: "مسجل جديد", medicalHistory: { labs: [], imaging: [] } });
    localStorage.setItem('patientsList', JSON.stringify(p));
    loadPatients();
    closeModal('simple');
    showToast("تم تسجيل المريض بنجاح!");
    logAuditAction(`تسجيل مريض جديد من القائمة: ${name} (ID: ${idCard})`);
}

function loadPatients() {
    let tb = document.getElementById('patientsTbody');
    if (!tb) return;
    tb.innerHTML = '';
    (JSON.parse(localStorage.getItem('patientsList')) || []).forEach((p, i) => {
        let editControls = currentUserRole === 'admin' ? `
            <button id="p-edit-btn-${i}" onclick="enablePatientEdit(${i})" class="bg-blue-50 border text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-pen-to-square"></i> تعديل</button>
            <button id="p-save-btn-${i}" onclick="savePatientEdit(${i})" class="hidden bg-emerald-50 border text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
            <button onclick="deletePatient(${i})" class="text-red-500 font-bold px-1.5"><i class="fa-solid fa-trash"></i></button>
        ` : `<span class="text-xs text-gray-400 font-bold">عرض فقط</span>`;

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
    let p = JSON.parse(localStorage.getItem('patientsList')) || [];
    if (p[i]) {
        p[i].name = document.getElementById(`p-name-${i}`).value;
        p[i].idCard = document.getElementById(`p-idcard-${i}`).value;
        p[i].dob = document.getElementById(`p-dob-${i}`).value;
        p[i].phone = document.getElementById(`p-phone-${i}`).value;
        localStorage.setItem('patientsList', JSON.stringify(p));
        loadPatients();
        showToast("تم الحفظ!");
        logAuditAction(`تعديل بيانات المريض رقم ${i}`);
    }
}

function deletePatient(i) {
    let p = JSON.parse(localStorage.getItem('patientsList')) || [];
    p.splice(i, 1);
    localStorage.setItem('patientsList', JSON.stringify(p));
    loadPatients();
    showToast("تم الحذف");
    logAuditAction("حذف مريض من النظام");
}

function renderStaffManagementTable() {
    let tb = document.getElementById('staffManagementTableBody');
    if (!tb) return;
    tb.innerHTML = '';
    let staff = JSON.parse(localStorage.getItem('staffList')) || [];
    
    staff.forEach((s, i) => {
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
    let staff = JSON.parse(localStorage.getItem('staffList')) || [];
    if (staff[i]) {
        staff[i].name = document.getElementById(`st-name-${i}`).value;
        staff[i].username = document.getElementById(`st-user-${i}`).value;
        staff[i].password = document.getElementById(`st-pass-${i}`).value;
        staff[i].role = document.getElementById(`st-role-${i}`).value;
        localStorage.setItem('staffList', JSON.stringify(staff));
        renderStaffManagementTable();
        showToast("تم حفظ تعديل المستخدم وكلمة المرور بنجاح!");
        logAuditAction(`تعديل بيانات المستخدم: ${staff[i].name}`);
    }
}

function deleteStaffMember(i) {
    let staff = JSON.parse(localStorage.getItem('staffList')) || [];
    if (staff.length <= 1) { alert("لا يمكن حذف المسؤول الأخير!"); return; }
    staff.splice(i, 1);
    localStorage.setItem('staffList', JSON.stringify(staff));
    renderStaffManagementTable();
    showToast("تم الحذف");
    logAuditAction("حذف مستخدم من النظام");
}

function loadDoctors() {
    let tb = document.getElementById('doctorsTbody');
    if (!tb) return;
    tb.innerHTML = '';
    (JSON.parse(localStorage.getItem('doctorsList')) || []).forEach((d, i) => {
        let delBtn = currentUserRole === 'admin' ? `<button onclick="deleteDoctor(${i})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i></button>` : '';
        tb.innerHTML += `<tr><td class="py-3 font-bold">${d.name}</td><td class="py-3 text-gray-500">${d.specialty}</td><td class="py-3 text-gray-500">${d.shift}</td><td class="py-3 text-gray-500">${d.phone}</td><td class="py-3">${delBtn}</td></tr>`;
    });
    populateTriageDoctorDropdown();
}
function deleteDoctor(i) {
    let d = JSON.parse(localStorage.getItem('doctorsList')) || [];
    d.splice(i, 1);
    localStorage.setItem('doctorsList', JSON.stringify(d));
    loadDoctors();
    showToast("تم الحذف");
    logAuditAction("حذف طبيب من النظام");
}

function loadAppointments() {
    let tb1 = document.getElementById('dashAppointmentsTbody');
    let tb2 = document.getElementById('fullAppointmentsTbody');
    if (tb1) tb1.innerHTML = '';
    if (tb2) tb2.innerHTML = '';
    let a = JSON.parse(localStorage.getItem('appointments')) || [];
    a.forEach((item, i) => {
        let delBtn = currentUserRole === 'admin' ? `<button onclick="deleteAppointment(${i})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i></button>` : '';
        let row = `<tr><td class="py-3 font-bold">${item.name}</td><td class="py-3 text-indigo-700">${item.doctor}</td><td class="py-3 text-gray-500">${item.date}</td><td class="py-3"><span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold">${item.status}</span></td><td class="py-3">${delBtn}</td></tr>`;
        if (tb1) tb1.innerHTML += row;
        if (tb2) tb2.innerHTML += row;
    });
}
function deleteAppointment(i) {
    let a = JSON.parse(localStorage.getItem('appointments')) || [];
    a.splice(i, 1);
    localStorage.setItem('appointments', JSON.stringify(a));
    loadAppointments();
    updateSidebarBadges();
    showToast("تم الحذف");
    logAuditAction("حذف موعد");
}

function loadInvoices() {
    let tb = document.getElementById('invoicesTbody');
    if (!tb) return;
    tb.innerHTML = '';
    let invs = JSON.parse(localStorage.getItem('invoicesList')) || [];
    let tot = 0;
    invs.forEach((inv, i) => {
        tot += Number(inv.amount);
        let delBtn = currentUserRole === 'admin' ? `<button onclick="deleteInvoice(${i})" class="text-red-500 font-bold"><i class="fa-solid fa-trash"></i></button>` : '';
        tb.innerHTML += `<tr><td class="p-3.5 font-bold">${inv.invNum}</td><td class="p-3.5">${inv.patient}</td><td class="p-3.5 text-gray-500">${inv.service}</td><td class="p-3.5 font-bold text-[#0097b2]">$${inv.amount}</td><td class="p-3.5 text-emerald-600 font-bold text-xs">${inv.status}</td><td class="p-3.5">${delBtn}</td></tr>`;
    });
    document.getElementById('statTotalRevenue').innerText = `$${tot}`;
}
function deleteInvoice(i) {
    let invs = JSON.parse(localStorage.getItem('invoicesList')) || [];
    invs.splice(i, 1);
    localStorage.setItem('invoicesList', JSON.stringify(invs));
    loadInvoices();
    showToast("تم الحذف");
    logAuditAction("حذف فاتورة مالية");
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
        if (type === 'patient') {
            document.getElementById('form-newPatient').classList.remove('hidden');
        }
        if (type === 'appointment') document.getElementById('form-newAppt').classList.remove('hidden');
        if (type === 'doctor') document.getElementById('form-newDoctor').classList.remove('hidden');
        if (type === 'staff') document.getElementById('form-newStaff').classList.remove('hidden');
    }
}

function closeModal(id) {
    if (id === 'invoice') document.getElementById('modal-invoice').classList.add('hidden');
    else if (id === 'medical-record') document.getElementById('modal-medical-record').classList.add('hidden');
    else document.getElementById('modal-simple').classList.add('hidden');
}

function addDoctor(e) {
    e.preventDefault();
    let d = JSON.parse(localStorage.getItem('doctorsList')) || [];
    d.push({ name: document.getElementById('dName').value, specialty: document.getElementById('dSpec').value, shift: "8ص - 4م", phone: "0500000000" });
    localStorage.setItem('doctorsList', JSON.stringify(d));
    loadDoctors();
    closeModal('simple');
    showToast("تم حفظ الطبيب");
    logAuditAction(`إضافة طبيب جديد: ${document.getElementById('dName').value}`);
}

function addAppointment(e) {
    e.preventDefault();
    let a = JSON.parse(localStorage.getItem('appointments')) || [];
    a.push({ name: document.getElementById('aPat').value, doctor: document.getElementById('aDoc').value, date: document.getElementById('aDate').value, status: "مؤكد" });
    localStorage.setItem('appointments', JSON.stringify(a));
    loadAppointments();
    updateSidebarBadges();
    closeModal('simple');
    showToast("تم حجز الموعد");
    logAuditAction(`حجز موعد للمريض: ${document.getElementById('aPat').value}`);
}

function addStaff(e) {
    e.preventDefault();
    let s = JSON.parse(localStorage.getItem('staffList')) || [];
    s.push({ name: document.getElementById('sName').value, username: document.getElementById('sUser').value, password: document.getElementById('sPass').value, role: document.getElementById('sRole').value, allowedTabs: ['dashboard', 'reception', 'appointments', 'patients', 'invoices', 'prescriptions'] });
    localStorage.setItem('staffList', JSON.stringify(s));
    closeModal('simple');
    renderStaffManagementTable();
    showToast("تم إنشاء الموظف");
    logAuditAction(`إنشاء حساب موظف جديد: ${document.getElementById('sName').value}`);
}

function saveInvoice(e) {
    e.preventDefault();
    let invs = JSON.parse(localStorage.getItem('invoicesList')) || [];
    let patName = document.getElementById('invPatientSelect').value || "مريض عام";
    let fee = parseFloat(document.getElementById('invConsultFee').value) || 30;
    invs.push({ invNum: "INV-" + (1000 + invs.length + 1), patient: patName, service: "كشفية زيارة", amount: fee, status: "مدفوع" });
    localStorage.setItem('invoicesList', JSON.stringify(invs));
    closeModal('invoice');
    loadInvoices();
    showToast("تم إصدار الفاتورة");
    logAuditAction(`إصدار فاتورة للمريض: ${patName}`);
}

function loadClinicSettingsInputs() {
    const stg = JSON.parse(localStorage.getItem('clinicSettings')) || {
        clinicName: "عيادات الأسرة",
        specialty: "طب عام وجراحة",
        phone: "0790950784",
        address: "الدوار السابع الروابي",
        defaultFee: 30,
        taxRate: 0,
        currency: "$",
        workingHours: "08:00 AM - 04:00 PM",
        printSize: "A4",
        soundAlerts: "on"
    };

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
    if (currentUserRole !== 'admin') { alert("تعديل الإعدادات متاح للمسؤول فقط!"); return; }
    const stg = {
        clinicName: document.getElementById('stgClinicName').value,
        specialty: document.getElementById('stgSpecialty').value,
        phone: document.getElementById('stgPhone').value,
        address: document.getElementById('stgAddress').value,
        defaultFee: parseFloat(document.getElementById('stgDefaultFee').value) || 30,
        taxRate: parseFloat(document.getElementById('stgTaxRate').value) || 0,
        currency: document.getElementById('stgCurrency').value,
        workingHours: document.getElementById('stgWorkingHours').value,
        printSize: document.getElementById('stgPrintSize').value,
        soundAlerts: document.getElementById('stgSoundAlerts').value
    };
    localStorage.setItem('clinicSettings', JSON.stringify(stg));
    showToast("تم حفظ إعدادات النظام بنجاح!");
    logAuditAction("تحديث إعدادات النظام العامة");
}

function exportDatabaseBackup() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    let dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "clinic_backup_" + new Date().toISOString().split('T')[0] + ".json");
    dlAnchorElem.click();
    showToast("تم تصدير النسخة الاحتياطية بنجاح");
    logAuditAction("تصدير نسخة احتياطية للنظام");
}

function importDatabaseBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let backupData = JSON.parse(e.target.result);
            for (let key in backupData) {
                localStorage.setItem(key, backupData[key]);
            }
            showToast("تم استرجاع النسخة الاحتياطية بنجاح!");
            logAuditAction("استرجاع نسخة احتياطية للنظام");
            setTimeout(() => location.reload(), 1500);
        } catch(err) {
            alert("ملف النسخة الاحتياطية غير صالح!");
        }
    };
    reader.readAsText(file);
}

function addDrugToTemplateList() {
    let drugName = document.getElementById('prescDrugName').value.trim();
    let doses = document.getElementById('prescDoses').value;
    let time = document.getElementById('prescTime').value;
    let duration = document.getElementById('prescDuration').value.trim() || "5 أيام";

    if (!drugName) {
        alert("يرجى كتابة اسم الدواء أولاً!");
        return;
    }

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
        let lineStr = `- ${item.drugName} | الجرعة: ${item.doses} | الوقت: ${item.time} | المدة: ${item.duration}`;
        formattedTextLines.push(lineStr);

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
    if (!prescText) { alert("يرجى إضافة أدوية للوصفة أولاً!"); return; }
    let patName = currentPatientInExam ? currentPatientInExam.name : "مريض عام";

    let prescriptions = JSON.parse(localStorage.getItem('prescriptionsList')) || [];
    prescriptions.unshift({
        patient: patName,
        doctor: currentPatientInExam ? currentPatientInExam.doctor : currentUsername,
        date: new Date().toLocaleDateString(),
        medications: prescText,
        status: "تم الصرف"
    });
    localStorage.setItem('prescriptionsList', JSON.stringify(prescriptions));
    
    showToast("تم حفظ وصرف الوصفة الطبية بنجاح!");
    logAuditAction(`صرف وصفة طبية منظمة للمريض: ${patName}`);
    
    currentPrescriptionItems = [];
    renderCurrentPrescriptionTable();
}

function printPrescriptionReport() {
    let patName = currentPatientInExam ? currentPatientInExam.name : "غير محدد";
    let diag = document.getElementById('examDiagnosis').value || "غير مدون";
    let proc = document.getElementById('examProcedure').value || "غير مدون";
    let presc = document.getElementById('examPrescriptionText').value || "لا توجد أدوية مدرجة بالوصفة";
    
    let printWindow = window.open('', '_printWindow', 'width=800,height=600');
    printWindow.document.write(`
        <html dir="rtl">
        <head><title>تقرير ووصفة طبية - عيادات الأسرة</title>
        <style>body{font-family:Tahoma;padding:20px;color:#333;} h2{color:#0097b2;border-bottom:2px solid #0097b2;padding-bottom:10px;}</style>
        </head>
        <body onload="window.print();window.close()">
            <h2>عيادات الأسرة الطبية | تقرير فحص المريض ووصفة الأدوية</h2>
            <p><b>اسم المريض:</b> ${patName}</p>
            <p><b>التاريخ:</b> ${new Date().toLocaleDateString()}</p>
            <hr/>
            <p><b>التشخيص الإكلينيكي:</b><br/>${diag}</p>
            <p><b>الإجراءات الطبية:</b><br/>${proc}</p>
            <p><b>الوصفة الطبية (الأدوية الموصوفة وصرفها):</b><br/>${presc.replace(/\n/g, '<br/>')}</p>
            <br/><br/><br/>
            <div style="text-align: left;"><b>ختم وتوقيع الطبيب المعالج</b></div>
        </body>
        </html>
    `);
    printWindow.document.close();
    logAuditAction(`طباعة تقرير الفحص والوصفة للمريض: ${patName}`);
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
function handlePatientInitFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    currentPatientInitFileName = file.name;
    const reader = new FileReader();
    reader.onload = function(e) { currentPatientInitFileBase64 = e.target.result; };
    reader.readAsDataURL(file);
}

function renderPatientMedicalHistoryInExam(patientName) {
    const labsBox = document.getElementById('examPastLabsContainer');
    const imgBox = document.getElementById('examPastImagingContainer');
    if (!labsBox || !imgBox) return;
    labsBox.innerHTML = '';
    imgBox.innerHTML = '';
    const patients = JSON.parse(localStorage.getItem('patientsList')) || [];
    const patient = patients.find(p => p.name.trim().toLowerCase() === (patientName || '').trim().toLowerCase());
    const labs = (patient && patient.medicalHistory && patient.medicalHistory.labs) || [];
    const imaging = (patient && patient.medicalHistory && patient.medicalHistory.imaging) || [];

    if (labs.length === 0) labsBox.innerHTML = `<p class="text-gray-400 text-xs py-2">لا توجد تحاليل</p>`;
    else labs.forEach(l => labsBox.innerHTML += `<div class="p-2.5 rounded-2xl border bg-emerald-50 text-xs shadow-sm"><b class="text-emerald-900">${l.title}</b> (${l.date}): ${l.result} ${l.fileData ? `<a href="${l.fileData}" target="_blank" class="text-blue-600 underline block mt-1"><i class="fa-solid fa-file-arrow-down"></i> ${l.fileName}</a>` : ''}</div>`);

    if (imaging.length === 0) imgBox.innerHTML = `<p class="text-gray-400 text-xs py-2">لا توجد أشعة أو سكانير</p>`;
    else imaging.forEach(img => imgBox.innerHTML += `<div class="p-2.5 rounded-2xl border bg-blue-50 text-xs shadow-sm"><b class="text-blue-900">${img.title}</b> (${img.date}): ${img.result} ${img.fileData ? `<a href="${img.fileData}" target="_blank" class="text-blue-600 underline block mt-1"><i class="fa-solid fa-image"></i> معاينة صورة السكانير/الأشعة</a>` : ''}</div>`);
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

    let patients = JSON.parse(localStorage.getItem('patientsList')) || [];
    let patient = patients.find(p => p.name.trim().toLowerCase() === patName.toLowerCase());
    if (!patient) {
        patient = { name: patName, dob: "2000-01-01", phone: "--", visitsCount: 1, conditionsText: "مسجل", medicalHistory: { labs: [], imaging: [] } };
        patients.push(patient);
    }
    if (!patient.medicalHistory) patient.medicalHistory = { labs: [], imaging: [] };
    const recordObj = { date, title, result, fileData: currentUploadedFileBase64, fileName: currentUploadedFileName };
    if (type === 'lab') patient.medicalHistory.labs.unshift(recordObj);
    else patient.medicalHistory.imaging.unshift(recordObj);

    localStorage.setItem('patientsList', JSON.stringify(patients));
    clearSelectedFile();
    closeModal('medical-record');
    if (currentPatientInExam && currentPatientInExam.name === patName) renderPatientMedicalHistoryInExam(patName);
    showToast("تم الحفظ بنجاح!");
    logAuditAction(`إدراج سجل طبي للمريض: ${patName}`);
}

function resetClinicData() {
    if (currentUserRole !== 'admin') { alert("تصفير بيانات العيادة مخصص للمسؤول فقط!"); return; }
    let conf = confirm("تحذير: هل أنت متأكد من رغبتك في تصفير معطيات العيادة؟");
    if (conf) {
        localStorage.clear();
        showToast("تم التصفير بنجاح!");
        logAuditAction("إعادة ضبط المصنع وتصفير بيانات العيادة");
        setTimeout(() => location.reload(), 1500);
    }
}