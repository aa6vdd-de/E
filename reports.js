function currentMonthOnly(list){
 const now=new Date();
 return list.filter(t=>{
   if(!t.createdAt) return true;
   const d=new Date(t.createdAt);
   return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
 });
}

db.ref().on("value",snap=>{
 const root=snap.val()||{},marketing=root.tasks||{},projects=root.projectTasks||{};
 const rows=employees.map(e=>{
   if(isMarketingEmployee(e)){
     const s=calc(currentMonthOnly(tasksArray(marketing[e.number])));return{e,total:s.total,done:s.contacted,won:s.won,pct:s.pct};
   }
   const s=projectStats(currentMonthOnly(projectTasksArray(projects[e.number])));return{e,total:s.total,done:s.completed,won:"—",pct:s.pct};
 }).sort((a,b)=>b.pct-a.pct);
 reportsBody.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${esc(r.e.name)}</strong></td><td>${esc(employeeDepartmentsText(r.e))}</td><td>${r.total}</td><td>${r.done}</td><td>${r.won}</td><td><strong>${r.pct}%</strong><div class="progress"><span style="width:${r.pct}%"></span></div></td></tr>`).join("");
});
