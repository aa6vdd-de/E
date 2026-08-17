db.ref("tasks").on("value", snap => {
  const all = snap.val() || {};
  let totalTasks=0,totalContacted=0,totalWon=0,totalPct=0;
  document.getElementById("dashboardBody").innerHTML = employees.map(e=>{
    const s=calc(tasksArray(all[e.number]));
    totalTasks+=s.total; totalContacted+=s.contacted; totalWon+=s.won; totalPct+=s.pct;
    return `<tr>
      <td><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><strong>${esc(e.name)}</strong></div></td>
      <td><a class="department-link" href="${departmentLink(e.department)}">${esc(employeeDepartmentsText(e))}</a></td>
      <td>${s.total}</td>
      <td>${s.contacted}</td>
      <td>${s.won}</td>
      <td><strong>${s.pct}%</strong><div class="progress"><span style="width:${s.pct}%"></span></div></td>
      <td><button class="action warning-action" onclick="openManagerWarning('${e.number}')">✉️ تحذير</button></td>
    </tr>`;
  }).join("");
  mgrEmpCount.textContent=employees.length; mgrTaskCount.textContent=totalTasks; mgrContacted.textContent=totalContacted; mgrWon.textContent=totalWon; mgrAvg.textContent=Math.round(totalPct/employees.length||0)+"%";
});


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
