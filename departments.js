
const departmentIcons={"التسويق":"📣","التصميم":"🎨","تحليل البيانات":"📊","تصميم المواقع":"💻"};

db.ref().on("value",snap=>{
  const root=snap.val()||{},marketing=root.tasks||{},projects=root.projectTasks||{};
  departmentsGrid.innerHTML=departments.map(dept=>{
    const members=employees.filter(e=>employeeInDepartment(e,dept));
    const stats=members.map(e=>{
      if(isMarketingEmployee(e)){
        const s=calc(tasksArray(marketing[e.number]));return{s,total:s.total,pct:s.pct};
      }
      const list=projectTasksArray(projects[e.number]).filter(t=>!t.department||t.department===dept);
      const s=projectStats(list);return{s,total:s.total,pct:s.pct};
    });
    const avg=stats.length?Math.round(stats.reduce((a,b)=>a+b.pct,0)/stats.length):0;
    const total=stats.reduce((a,b)=>a+b.total,0);
    return `<article class="department-card department-card-full clickable-department" onclick="location.href='${departmentLink(dept)}'">
      <div class="department-head"><div class="department-title"><div class="department-icon">${departmentIcons[dept]||"🏢"}</div><div><h3>${esc(dept)}</h3><p>${members.length} موظف · ${total} مهمة</p></div></div><div class="department-score"><small>متوسط الإنجاز</small><strong>${avg}%</strong></div></div>
      <div class="department-progress"><span style="width:${avg}%"></span></div>
      <div class="department-members">${members.length?members.map(e=>`<span>${esc(e.name)} <small>#${e.number}</small></span>`).join(""):'<span class="muted-member">لا يوجد موظفون</span>'}</div>
    </article>`;
  }).join("");
});
