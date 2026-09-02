/* ==========================================================================
   Cloud-Based Hostel Complaint Management System - Core Application Logic
   ========================================================================== */

// Storage Key for LocalStorage / Cloud Storage Simulation
const STORAGE_KEY = 'cloud_hostel_complaints_v1';
let currentRole = 'student'; // Default role: 'student' or 'warden'

// Chart.js Instances
let typeChartInstance = null;
let priorityChartInstance = null;
let statusChartInstance = null;

// Initial Viva Sample Complaints Dataset
const SAMPLE_COMPLAINTS = [
    {
        id: "HSTL-1001",
        studentName: "Rahul Sharma (STU-2024-042)",
        roomNumber: "Hostel Block A - Room 204",
        complaintType: "Electrical",
        description: "Ceiling fan is vibrating heavily and making grinding noise. Danger of falling down.",
        date: "2026-08-28",
        priority: "High",
        status: "In Progress",
        createdAt: "2026-08-28T09:30:00.000Z"
    },
    {
        id: "HSTL-1002",
        studentName: "Ananya Roy (STU-2024-118)",
        roomNumber: "Girls Hostel B - Room 108",
        complaintType: "Plumbing",
        description: "Bathroom sink faucet is leaking water continuously leading to water blockage in floor drain.",
        date: "2026-08-29",
        priority: "Medium",
        status: "Submitted",
        createdAt: "2026-08-29T11:15:00.000Z"
    },
    {
        id: "HSTL-1003",
        studentName: "Vikramaditya K. (STU-2023-509)",
        roomNumber: "Hostel Block C - Room 312",
        complaintType: "Room Maintenance",
        description: "Study table wooden leg broken and closet door latch is jammed.",
        date: "2026-08-25",
        priority: "Low",
        status: "Resolved",
        createdAt: "2026-08-25T14:20:00.000Z"
    },
    {
        id: "HSTL-1004",
        studentName: "Sneha Patel (STU-2024-007)",
        roomNumber: "Girls Hostel A - Room 402",
        complaintType: "Cleanliness",
        description: "Corridor trash bin not emptied for 2 days. Bad odor spreading near room door.",
        date: "2026-08-30",
        priority: "Medium",
        status: "In Progress",
        createdAt: "2026-08-30T08:00:00.000Z"
    },
    {
        id: "HSTL-1005",
        studentName: "Mohammad Kaif (STU-2024-210)",
        roomNumber: "Hostel Block B - Room 115",
        complaintType: "Electrical",
        description: "Sparking observed in main power socket near bed. Potential short circuit risk!",
        date: "2026-09-01",
        priority: "Critical",
        status: "Submitted",
        createdAt: "2026-09-01T16:45:00.000Z"
    },
    {
        id: "HSTL-1006",
        studentName: "Priya Sundaram (STU-2023-334)",
        roomNumber: "Girls Hostel B - Room 210",
        complaintType: "Other",
        description: "Wi-Fi access point in 2nd floor corridor disconnected since morning.",
        date: "2026-08-22",
        priority: "Low",
        status: "Closed",
        createdAt: "2026-08-22T10:10:00.000Z"
    }
];

// ==========================================
// Initialization & Local Cloud Storage Sync
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Set default date picker to today
    document.getElementById('complaintDate').valueAsDate = new Date();

    // Check if complaints exist in Local Cloud Storage; if not, populate sample dataset
    if (!localStorage.getItem(STORAGE_KEY)) {
        saveComplaintsToCloud(SAMPLE_COMPLAINTS);
        addCloudLog("Initial Viva Sample Dataset loaded into Cloud Database storage.", "success");
    } else {
        addCloudLog("Synchronized with active Cloud Database storage.", "info");
    }

    // Render Initial Views
    renderAllModules();
});

function getComplaintsFromCloud() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error reading Cloud storage:", e);
        return [];
    }
}

function saveComplaintsToCloud(complaints) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    } catch (e) {
        console.error("Error writing to Cloud storage:", e);
    }
}

function resetToSampleData() {
    saveComplaintsToCloud(SAMPLE_COMPLAINTS);
    renderAllModules();
    showToast("Reset to sample dataset successfully for Viva demonstration!", "success");
    addCloudLog("Cloud Storage reset to default Viva sample dataset by user request.", "warn");
}

function renderAllModules() {
    renderStudentComplaints();
    renderManagementTable();
    renderDashboard();
}

// ==========================================
// Role Switcher & Navigation
// ==========================================

function switchRole(role) {
    currentRole = role;
    const studentBtn = document.getElementById('role-student-btn');
    const wardenBtn = document.getElementById('role-warden-btn');
    const infoBar = document.getElementById('role-info-bar');
    const bannerText = document.getElementById('role-banner-text');

    if (role === 'student') {
        studentBtn.classList.add('active');
        wardenBtn.classList.remove('active');
        infoBar.className = 'role-info-bar student-mode';
        bannerText.innerHTML = `<i class="fa-solid fa-user-graduate"></i> <strong>Student Mode Active:</strong> You can submit new hostel complaints and track submitted issues.`;
        showToast("Switched to Student Mode", "info");
        addCloudLog("User role changed to STUDENT. Read/Write limited to personal complaints.", "info");
    } else {
        wardenBtn.classList.add('active');
        studentBtn.classList.remove('active');
        infoBar.className = 'role-info-bar warden-mode';
        bannerText.innerHTML = `<i class="fa-solid fa-user-tie"></i> <strong>Warden / Admin Mode Active:</strong> Full administrative privileges enabled. You can update complaint statuses and analyze reports.`;
        showToast("Switched to Warden / Admin Mode", "warning");
        addCloudLog("User role changed to WARDEN/ADMIN. Elevated write permissions granted.", "warn");
    }

    // Re-render table and student views to update controls based on role
    renderManagementTable();
}

function switchTab(targetId) {
    // Nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        if (tab.dataset.target === targetId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Modules
    document.querySelectorAll('.module-section').forEach(sec => {
        if (sec.id === targetId) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });

    // Re-trigger chart render if navigating to dashboard
    if (targetId === 'module-dashboard') {
        renderDashboard();
    }
}

// ==========================================
// MODULE 1: Student Complaint Submission
// ==========================================

function handleFormSubmit(event) {
    event.preventDefault();

    const studentName = document.getElementById('studentName').value.trim();
    const roomNumber = document.getElementById('roomNumber').value.trim();
    const complaintType = document.getElementById('complaintType').value;
    const priority = document.getElementById('priority').value;
    const date = document.getElementById('complaintDate').value;
    const description = document.getElementById('description').value.trim();

    if (!studentName || !roomNumber || !complaintType || !priority || !date || !description) {
        showToast("Please fill in all required fields!", "danger");
        return;
    }

    // Generate unique Ticket ID
    const newId = `HSTL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComplaint = {
        id: newId,
        studentName,
        roomNumber,
        complaintType,
        description,
        date,
        priority,
        status: "Submitted", // Default required status
        createdAt: new Date().toISOString()
    };

    const complaints = getComplaintsFromCloud();
    complaints.unshift(newComplaint); // Add at top
    saveComplaintsToCloud(complaints);

    // Reset Form
    document.getElementById('complaint-form').reset();
    document.getElementById('complaintDate').valueAsDate = new Date();

    // Log Cloud Activity
    addCloudLog(`POST /api/complaints -> Created Ticket ${newId} [${complaintType} - ${priority} Priority]`, "success");

    // Re-render
    renderAllModules();
    showToast(`Complaint ${newId} submitted successfully to Cloud DB!`, "success");
}

function renderStudentComplaints() {
    const listContainer = document.getElementById('student-complaints-list');
    const searchVal = document.getElementById('student-search').value.toLowerCase();
    const countBadge = document.getElementById('student-count-badge');

    const complaints = getComplaintsFromCloud();
    const filtered = complaints.filter(c => 
        c.studentName.toLowerCase().includes(searchVal) ||
        c.roomNumber.toLowerCase().includes(searchVal) ||
        c.description.toLowerCase().includes(searchVal) ||
        c.id.toLowerCase().includes(searchVal)
    );

    countBadge.textContent = `${filtered.length} Complaints`;

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
                <p>No complaints found matching criteria.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filtered.map(c => `
        <div class="complaint-item-card">
            <div class="item-top-row">
                <span class="item-id">${c.id}</span>
                <span class="badge badge-status-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>
            </div>
            <div class="item-student">${escapeHtml(c.studentName)}</div>
            <div class="item-room"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.roomNumber)}</div>
            <div class="item-description">${escapeHtml(c.description)}</div>
            <div class="item-bottom-row">
                <span><i class="fa-solid fa-tag"></i> ${c.complaintType}</span>
                <span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority} Priority</span>
                <span><i class="fa-regular fa-calendar"></i> ${c.date}</span>
            </div>
        </div>
    `).join('');
}

// ==========================================
// MODULE 2: Complaint Management (Warden View)
// ==========================================

function renderManagementTable() {
    const tbody = document.getElementById('management-table-body');
    const searchVal = document.getElementById('filter-search').value.toLowerCase();
    const typeVal = document.getElementById('filter-type').value;
    const priorityVal = document.getElementById('filter-priority').value;
    const statusVal = document.getElementById('filter-status').value;
    const countSpan = document.getElementById('management-count');

    let complaints = getComplaintsFromCloud();

    // Filters
    complaints = complaints.filter(c => {
        const matchesSearch = c.studentName.toLowerCase().includes(searchVal) ||
                              c.roomNumber.toLowerCase().includes(searchVal) ||
                              c.description.toLowerCase().includes(searchVal) ||
                              c.id.toLowerCase().includes(searchVal);
        const matchesType = typeVal === 'ALL' || c.complaintType === typeVal;
        const matchesPriority = priorityVal === 'ALL' || c.priority === priorityVal;
        const matchesStatus = statusVal === 'ALL' || c.status === statusVal;

        return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });

    countSpan.textContent = complaints.length;

    if (complaints.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    No complaint records found matching current filters.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = complaints.map(c => {
        const isWarden = currentRole === 'warden';
        return `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td>${c.date}</td>
                <td><strong>${escapeHtml(c.studentName)}</strong></td>
                <td>${escapeHtml(c.roomNumber)}</td>
                <td><span class="badge badge-info">${c.complaintType}</span></td>
                <td><span class="badge badge-priority-${c.priority.toLowerCase()}">${c.priority}</span></td>
                <td style="max-width: 250px; font-size: 0.82rem;">${escapeHtml(c.description)}</td>
                <td><span class="badge badge-status-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span></td>
                <td>
                    ${isWarden ? `
                        <select class="status-select-sm" onchange="updateComplaintStatus('${c.id}', this.value)">
                            <option value="Submitted" ${c.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                            <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                            <option value="Closed" ${c.status === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    ` : `
                        <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">
                            <i class="fa-solid fa-lock"></i> Switch to Warden to Edit
                        </span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function updateComplaintStatus(id, newStatus) {
    if (currentRole !== 'warden') {
        showToast("Permission Denied: Only Warden/Admin can update complaint status!", "danger");
        renderManagementTable();
        return;
    }

    let complaints = getComplaintsFromCloud();
    const index = complaints.findIndex(c => c.id === id);

    if (index !== -1) {
        const oldStatus = complaints[index].status;
        complaints[index].status = newStatus;
        saveComplaintsToCloud(complaints);

        addCloudLog(`PATCH /api/complaints/${id} -> Status changed from '${oldStatus}' to '${newStatus}'`, "warn");
        showToast(`Ticket ${id} status updated to '${newStatus}'!`, "success");

        renderAllModules();
    }
}

function resetFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-type').value = 'ALL';
    document.getElementById('filter-priority').value = 'ALL';
    document.getElementById('filter-status').value = 'ALL';
    renderManagementTable();
    showToast("Filters cleared", "info");
}

function exportDataToJSON() {
    const data = getComplaintsFromCloud();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Hostel_Complaints_Cloud_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    showToast("Exported cloud dataset to JSON file!", "success");
    addCloudLog("Exported full Cloud Database snapshot to client device.", "info");
}

// ==========================================
// MODULE 3: Dashboard & Analytics Charts
// ==========================================

function renderDashboard() {
    const complaints = getComplaintsFromCloud();

    // 1. Calculate Summary Metrics
    const total = complaints.length;
    const submitted = complaints.filter(c => c.status === 'Submitted').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const closed = complaints.filter(c => c.status === 'Closed').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-submitted').textContent = submitted;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-resolved').textContent = resolved;
    document.getElementById('stat-closed').textContent = closed;

    // 2. Aggregate Data by Complaint Type
    const typeCounts = {
        'Electrical': 0,
        'Plumbing': 0,
        'Room Maintenance': 0,
        'Cleanliness': 0,
        'Other': 0
    };
    complaints.forEach(c => {
        if (typeCounts[c.complaintType] !== undefined) {
            typeCounts[c.complaintType]++;
        } else {
            typeCounts['Other']++;
        }
    });

    // 3. Aggregate Data by Priority
    const priorityCounts = {
        'Low': 0,
        'Medium': 0,
        'High': 0,
        'Critical': 0
    };
    complaints.forEach(c => {
        if (priorityCounts[c.priority] !== undefined) {
            priorityCounts[c.priority]++;
        }
    });

    // Render / Update Chart.js instances
    renderTypeChart(typeCounts);
    renderPriorityChart(priorityCounts);
    renderStatusChart(submitted, progress, resolved, closed);
}

function renderTypeChart(typeCounts) {
    const ctx = document.getElementById('typeChart').getContext('2d');

    if (typeChartInstance) {
        typeChartInstance.destroy();
    }

    typeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(typeCounts),
            datasets: [{
                data: Object.values(typeCounts),
                backgroundColor: [
                    '#6366f1', // Electrical - Indigo
                    '#06b6d4', // Plumbing - Cyan
                    '#f59e0b', // Room Maint - Amber
                    '#10b981', // Cleanliness - Emerald
                    '#94a3b8'  // Other - Slate
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Inter', size: 12 } }
                }
            }
        }
    });
}

function renderPriorityChart(priorityCounts) {
    const ctx = document.getElementById('priorityChart').getContext('2d');

    if (priorityChartInstance) {
        priorityChartInstance.destroy();
    }

    priorityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(priorityCounts),
            datasets: [{
                label: 'Number of Complaints',
                data: Object.values(priorityCounts),
                backgroundColor: [
                    '#38bdf8', // Low - Sky
                    '#818cf8', // Medium - Indigo light
                    '#fb923c', // High - Orange
                    '#f87171'  // Critical - Red
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderStatusChart(submitted, progress, resolved, closed) {
    const ctx = document.getElementById('statusChart').getContext('2d');

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    statusChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Submitted', 'In Progress', 'Resolved', 'Closed'],
            datasets: [{
                label: 'Complaints in Lifecycle',
                data: [submitted, progress, resolved, closed],
                backgroundColor: [
                    '#818cf8', // Submitted
                    '#fbbf24', // In Progress
                    '#34d399', // Resolved
                    '#94a3b8'  // Closed
                ],
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal Bar Chart
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ==========================================
// MODULE 4: Cloud Transaction Simulator
// ==========================================

function addCloudLog(msg, type = 'info') {
    const terminal = document.getElementById('cloud-log-stream');
    if (!terminal) return;

    const timeStr = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    let colorClass = 'log-info';
    if (type === 'success') colorClass = 'log-success';
    if (type === 'warn') colorClass = 'log-warn';

    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="${colorClass}">[Cloud DB Stream]</span> ${escapeHtml(msg)}`;
    terminal.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
}

function clearLogs() {
    const terminal = document.getElementById('cloud-log-stream');
    if (terminal) {
        terminal.innerHTML = '<div class="log-entry"><span class="log-time">[' + new Date().toLocaleTimeString() + ']</span> <span class="log-info">[Cloud DB Stream]</span> Terminal cleared by admin.</div>';
    }
}

// ==========================================
// Utilities
// ==========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'danger') icon = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
