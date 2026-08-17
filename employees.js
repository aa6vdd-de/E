db.ref("tasks").on("value", snap=>{
 const all=snap.val()||{};
 employeesBody.innerHTML=employees.map(e=>{const s=calc(tasksArray(all[e.number]));return `<tr><td><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><strong>${esc(e.name)}</strong></div></td><td>${e.number}</td><td><a class="department-link" href="${departmentLink(e.department)}">${esc(employeeDepartmentsText(e))}</a></td><td>${monthlyTarget}</td><td>${s.total}</td><td>${s.contacted}</td><td>${s.won}</td><td><strong>${s.pct}%</strong><div class="progress"><span style="width:${s.pct}%"></span></div></td></tr>`}).join("");
});
