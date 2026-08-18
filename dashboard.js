
db.ref().on("value",snap=>{
  const root=snap.val()||{},marketing=root.tasks||{},projects=root.projectTasks||{};
  let totalTasks=0,totalDone=0,totalWon=0,totalPct=0;
  dashboardEmployees.innerHTML=employees.map(e=>{
    if(isMarketingEmployee(e)){
      const s=calc(tasksArray(marketing[e.number]));
      totalTasks+=s.total;totalDone+=s.contacted;totalWon+=s.won;totalPct+=s.pct;
      return card(e,s.total,s.contacted,s.won,s.pct,"تم التواصل","عملاء مكتسبون");
    }
    const s=projectStats(projectTasksArray(projects[e.number]));
    totalTasks+=s.total;totalDone+=s.completed;totalPct+=s.pct;
    return card(e,s.total,s.completed,s.overdue,s.pct,"مكتملة","متأخرة");
  }).join("");
  mgrEmpCount.textContent=employees.length;mgrTaskCount.textContent=totalTasks;mgrContacted.textContent=totalDone;mgrWon.textContent=totalWon;mgrAvg.textContent=Math.round(totalPct/employees.length||0)+"%";
});
function card(e,total,a,b,pct,labelA,labelB){
  return `<article class="dashboard-employee-card">
    <div class="dashboard-employee-top"><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><div><strong>${esc(e.name)}</strong><small>#${e.number}</small></div></div><button class="action warning-action" onclick="openManagerWarning('${e.number}')">✉️ تحذير</button></div>
    <a class="department-link dashboard-department" href="${departmentLink(e.department)}">${esc(employeeDepartmentsText(e))}</a>
    <div class="dashboard-mini-stats"><div><small>المهام</small><strong>${total}</strong></div><div><small>${labelA}</small><strong>${a}</strong></div><div><small>${labelB}</small><strong>${b}</strong></div></div>
    <div class="dashboard-performance"><div><small>نسبة الإنجاز</small><strong>${pct}%</strong></div><div class="progress"><span style="width:${pct}%"></span></div></div>
  </article>`;
}
function openManagerWarning(employeeNumber){
  const emp=employees.find(e=>e.number===String(employeeNumber));if(!emp)return;
  warningEmployeeNumber.value=emp.number;warningEmployeeName.value=emp.name;warningEmployeeEmail.value=localStorage.getItem("employeeEmail_"+emp.number)||"";
  warningSubject.value="تنبيه بخصوص تأخر التسليم";
  warningMessage.value=`مرحبًا ${emp.name}،

نود تنبيهك بوجود تأخر في تسليم العمل أو المشروع المسند إليك.

يرجى إكمال وتسليم العمل خلال 24 ساعة من استلام هذا التنبيه.
في حال عدم التسليم خلال هذه المدة، قد تتأثر نسبة الأداء والإنجاز المسجلة في النظام.

شكرًا لك،
إدارة الريادة البصرية`;
  managerWarningModal.classList.add("show");
}
function closeManagerWarning(){managerWarningModal.classList.remove("show")}
function saveEmployeeEmail(){const email=warningEmployeeEmail.value.trim();if(!email){alert("أدخل البريد الإلكتروني أولًا");return}localStorage.setItem("employeeEmail_"+warningEmployeeNumber.value,email);showToast("تم حفظ بريد الموظف")}
function sendManagerWarning(){const email=warningEmployeeEmail.value.trim();if(!email){alert("أدخل البريد الإلكتروني للموظف");return}localStorage.setItem("employeeEmail_"+warningEmployeeNumber.value,email);location.href="mailto:"+encodeURIComponent(email)+"?subject="+encodeURIComponent(warningSubject.value.trim())+"&body="+encodeURIComponent(warningMessage.value.trim());closeManagerWarning()}
