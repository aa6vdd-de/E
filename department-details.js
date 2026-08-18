
const params=new URLSearchParams(location.search),department=params.get("department")||"";
departmentTitle.textContent=department||"تفاصيل القسم";departmentTopName.textContent=department||"القسم";

db.ref().on("value",snap=>{
  const root=snap.val()||{},marketing=root.tasks||{},projects=root.projectTasks||{};
  const members=employees.filter(e=>employeeInDepartment(e,department));
  const rows=members.map(e=>{
    if(isMarketingEmployee(e)){
      const s=calc(tasksArray(marketing[e.number]));
      return{e,total:s.total,done:s.contacted,extra:s.won,pct:s.pct,type:"marketing"};
    }
    const list=projectTasksArray(projects[e.number]).filter(t=>!t.department||t.department===department);
    const s=projectStats(list);
    return{e,total:s.total,done:s.completed,extra:s.overdue,pct:s.pct,type:"project"};
  });
  departmentEmployeesCount.textContent=members.length;
  departmentTasks.textContent=rows.reduce((a,r)=>a+r.total,0);
  departmentContacted.textContent=rows.reduce((a,r)=>a+r.done,0);
  departmentWon.textContent=rows.reduce((a,r)=>a+(r.type==="marketing"?r.extra:0),0);
  departmentAvg.textContent=(rows.length?Math.round(rows.reduce((a,r)=>a+r.pct,0)/rows.length):0)+"%";
  const empty=!rows.length;departmentDetailsEmpty.classList.toggle("hidden",!empty);departmentDetailsWrap.classList.toggle("hidden",empty);
  departmentDetailsBody.innerHTML=rows.map(r=>`<tr><td><div class="employee-name"><div class="avatar">${esc(r.e.name[0])}</div><strong>${esc(r.e.name)}</strong></div></td><td>${r.e.number}</td><td>${r.total}</td><td>${r.done}</td><td>${r.type==="marketing"?r.extra:"—"}</td><td><strong>${r.pct}%</strong><div class="progress"><span style="width:${r.pct}%"></span></div></td><td><span class="status-pill active-status">مفعل</span></td></tr>`).join("");
});
