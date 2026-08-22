
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
  renderManagerContactNotes(marketing);
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
  const emp=employees.find(e=>e.number===String(employeeNumber));
  if(!emp)return;

  warningEmployeeNumber.value=emp.number;
  warningEmployeeName.value=emp.name;
  warningEmployeeEmail.value=localStorage.getItem("employeeEmail_"+emp.number)||accountEmail(emp.number)||"";
  warningSubject.value="";
  warningMessage.value="";
  warningSubject.placeholder="اكتب عنوان الرسالة";
  warningMessage.placeholder="اكتب نص التحذير أو الرسالة هنا...";
  managerWarningModal.classList.add("show");
}

function closeManagerWarning(){
  managerWarningModal.classList.remove("show");
}

function saveEmployeeEmail(){
  const email=warningEmployeeEmail.value.trim();
  if(!email){alert("أدخل البريد الإلكتروني أولًا");return}
  localStorage.setItem("employeeEmail_"+warningEmployeeNumber.value,email);
  showToast("تم حفظ بريد الموظف");
}

function sendManagerWarning(){
  const email=warningEmployeeEmail.value.trim();
  const subject=warningSubject.value.trim();
  const message=warningMessage.value.trim();

  if(!email){alert("لا يوجد بريد إلكتروني لهذا الموظف. أضفه أولًا.");return}
  if(!subject){alert("اكتب عنوان الرسالة.");return}
  if(!message){alert("اكتب نص الرسالة.");return}

  localStorage.setItem("employeeEmail_"+warningEmployeeNumber.value,email);

  location.href="mailto:"+encodeURIComponent(email)+
    "?subject="+encodeURIComponent(subject)+
    "&body="+encodeURIComponent(message);

  closeManagerWarning();
}


function formatManagerDate(timestamp){
  if(!timestamp) return "—";
  try{
    return new Date(timestamp).toLocaleString("ar-SA",{
      year:"numeric",month:"2-digit",day:"2-digit",
      hour:"2-digit",minute:"2-digit"
    });
  }catch(e){
    return "—";
  }
}

function renderManagerContactNotes(marketingData){
  const body = document.getElementById("managerContactNotesBody");
  const empty = document.getElementById("managerContactNotesEmpty");
  const wrap = document.getElementById("managerContactNotesWrap");
  if(!body || !empty || !wrap) return;

  const rows = [];

  employees
    .filter(e => isMarketingEmployee(e))
    .forEach(emp => {
      tasksArray(marketingData?.[emp.number]).forEach(task => {
        const hasMeaningfulUpdate =
          (task.note && String(task.note).trim()) ||
          (task.status && task.status !== "جديد");

        if(!hasMeaningfulUpdate) return;

        rows.push({
          employee: emp,
          clientName: task.clientName || "—",
          phone: task.phone || "—",
          status: task.status || "جديد",
          note: task.note || "—",
          updatedAt: task.updatedAt || task.createdAt || 0
        });
      });
    });

  rows.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));

  const isEmpty = rows.length === 0;
  empty.classList.toggle("hidden", !isEmpty);
  wrap.classList.toggle("hidden", isEmpty);

  body.innerHTML = rows.map(r => `
    <tr>
      <td>
        <div class="employee-name">
          <div class="avatar">${esc(r.employee.name[0])}</div>
          <div>
            <strong>${esc(r.employee.name)}</strong>
            <small>#${r.employee.number}</small>
          </div>
        </div>
      </td>
      <td><strong>${esc(r.clientName)}</strong></td>
      <td><span class="phone-number" dir="ltr">${esc(r.phone)}</span></td>
      <td><span class="contact-status-badge">${esc(r.status)}</span></td>
      <td><div class="manager-note-text">${esc(r.note)}</div></td>
      <td>${formatManagerDate(r.updatedAt)}</td>
    </tr>
  `).join("");
}
