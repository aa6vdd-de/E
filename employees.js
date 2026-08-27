
db.ref().on("value",snap=>{
 const root=snap.val()||{},marketing=root.tasks||{},projects=root.projectTasks||{};
 employeesBody.innerHTML=employees.map(e=>{
   if(isMarketingEmployee(e)){
     const s=calc(tasksArray(marketing[e.number]));
     return row(e,s.total,s.contacted,s.won,s.pct);
   }
   const s=projectStats(projectTasksArray(projects[e.number]));
   return row(e,s.total,s.completed,"—",s.pct);
 }).join("");
});
function row(e,total,done,won,pct){
 return `<tr><td><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><strong>${esc(e.name)}</strong></div></td><td>${e.number}</td><td><a class="department-link" href="${departmentLink(e.department)}">${esc(employeeDepartmentsText(e))}</a></td><td>${isMarketingEmployee(e)?monthlyTarget:"—"}</td><td>${total}</td><td>${done}</td><td>${won}</td><td><strong>${pct}%</strong><div class="progress"><span style="width:${pct}%"></span></div></td></tr>`;
}

async function renderEmployeeEmailManagement(){
  const box=document.getElementById("employeeEmailCards");
  if(!box)return;
  box.innerHTML=employees.map(e=>{
    const email=accountEmail(e.number)||"غير محدد";
    return `<div class="email-management-card">
      <div class="employee-name">
        <div class="avatar">${esc(e.name[0])}</div>
        <div><strong>${esc(e.name)}</strong><small>#${e.number} · ${esc(employeeDepartmentsText(e))}</small></div>
      </div>
      <div class="field" style="margin:0">
        <label>البريد الإلكتروني الثابت</label>
        <input type="email" value="${esc(email)}" disabled>
      </div>
      <small style="color:var(--muted)">البريد مربوط بالرقم الوظيفي ولا يحتاج إدخال يدوي.</small>
    </div>`;
  }).join("");
}
renderEmployeeEmailManagement();
