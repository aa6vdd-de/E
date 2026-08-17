db.ref("tasks").on("value", snap => {
  const all = snap.val() || {};
  let totalTasks=0,totalContacted=0,totalWon=0,totalPct=0;
  document.getElementById("dashboardBody").innerHTML = employees.map(e=>{
    const s=calc(tasksArray(all[e.number]));
    totalTasks+=s.total; totalContacted+=s.contacted; totalWon+=s.won; totalPct+=s.pct;
    return `<tr><td><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><strong>${esc(e.name)}</strong></div></td><td>${esc(e.department || "غير محدد")}</td><td>${s.total}</td><td>${s.contacted}</td><td>${s.won}</td><td><strong>${s.pct}%</strong><div class="progress"><span style="width:${s.pct}%"></span></div></td></tr>`;
  }).join("");
  mgrEmpCount.textContent=employees.length; mgrTaskCount.textContent=totalTasks; mgrContacted.textContent=totalContacted; mgrWon.textContent=totalWon; mgrAvg.textContent=Math.round(totalPct/employees.length||0)+"%";
});
