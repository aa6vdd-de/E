
function renderDashboardEmployees(allTasks = {}){
  let totalTasks = 0;
  let totalContacted = 0;
  let totalWon = 0;
  let totalPct = 0;

  const container = document.getElementById("dashboardEmployees");
  if(!container) return;

  container.innerHTML = employees.map(e => {
    const s = calc(tasksArray(allTasks[e.number]));
    totalTasks += s.total;
    totalContacted += s.contacted;
    totalWon += s.won;
    totalPct += s.pct;

    return `
      <article class="dashboard-employee-card">
        <div class="dashboard-employee-top">
          <div class="employee-name">
            <div class="avatar">${esc(e.name[0])}</div>
            <div>
              <strong>${esc(e.name)}</strong>
              <small>#${e.number}</small>
            </div>
          </div>
          <button class="action warning-action" onclick="openManagerWarning('${e.number}')">✉️ تحذير</button>
        </div>

        <a class="department-link dashboard-department"
           href="${departmentLink(e.department)}">
          ${esc(employeeDepartmentsText(e))}
        </a>

        <div class="dashboard-mini-stats">
          <div><small>المهام</small><strong>${s.total}</strong></div>
          <div><small>تم التواصل</small><strong>${s.contacted}</strong></div>
          <div><small>عملاء مكتسبون</small><strong>${s.won}</strong></div>
        </div>

        <div class="dashboard-performance">
          <div><small>نسبة الإنجاز</small><strong>${s.pct}%</strong></div>
          <div class="progress"><span style="width:${s.pct}%"></span></div>
        </div>
      </article>
    `;
  }).join("");

  document.getElementById("mgrEmpCount").textContent = employees.length;
  document.getElementById("mgrTaskCount").textContent = totalTasks;
  document.getElementById("mgrContacted").textContent = totalContacted;
  document.getElementById("mgrWon").textContent = totalWon;
  document.getElementById("mgrAvg").textContent =
    Math.round(totalPct / employees.length || 0) + "%";
}

/* Render the names immediately, even before Firebase responds. */
renderDashboardEmployees({});

/* Then update the numbers in realtime. */
db.ref("tasks").on(
  "value",
  snap => renderDashboardEmployees(snap.val() || {}),
  error => {
    console.error("Firebase tasks read failed:", error);
    showToast("تعذر تحديث بيانات الأداء، لكن الموظفين ظاهرون.");
  }
);

function openManagerWarning(employeeNumber){
  const emp = employees.find(e => e.number === String(employeeNumber));
  if(!emp) return;

  warningEmployeeNumber.value = emp.number;
  warningEmployeeName.value = emp.name;
  warningEmployeeEmail.value = localStorage.getItem("employeeEmail_" + emp.number) || "";
  warningSubject.value = "تنبيه بخصوص تأخر التسليم";
  warningMessage.value =
`مرحبًا ${emp.name}،

نود تنبيهك بوجود تأخر في تسليم العمل أو المشروع المسند إليك.

يرجى إكمال وتسليم العمل خلال 24 ساعة من استلام هذا التنبيه.
في حال عدم التسليم خلال هذه المدة، قد تتأثر نسبة الأداء والإنجاز المسجلة في النظام.

شكرًا لك،
إدارة الريادة البصرية`;

  managerWarningModal.classList.add("show");
}

function closeManagerWarning(){
  managerWarningModal.classList.remove("show");
}

function saveEmployeeEmail(){
  const num = warningEmployeeNumber.value;
  const email = warningEmployeeEmail.value.trim();

  if(!email){
    alert("أدخل البريد الإلكتروني أولًا");
    return;
  }

  localStorage.setItem("employeeEmail_" + num, email);
  showToast("تم حفظ بريد الموظف");
}

function sendManagerWarning(){
  const num = warningEmployeeNumber.value;
  const email = warningEmployeeEmail.value.trim();
  const subject = warningSubject.value.trim();
  const message = warningMessage.value.trim();

  if(!email){
    alert("أدخل البريد الإلكتروني للموظف");
    return;
  }

  localStorage.setItem("employeeEmail_" + num, email);

  window.location.href =
    "mailto:" + encodeURIComponent(email) +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(message);

  closeManagerWarning();
}
