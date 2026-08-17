
const params = new URLSearchParams(location.search);
const department = params.get("department") || "";

departmentTitle.textContent = department || "تفاصيل القسم";
departmentTopName.textContent = department || "القسم";

db.ref("tasks").on("value", snap => {
  const all = snap.val() || {};
  const actualMembers = employees.filter(e => employeeInDepartment(e, department));
  const pendingMembers = additionalDepartmentMembers.filter(e => e.department === department);

  const rows = actualMembers.map(e => ({e, s: calc(tasksArray(all[e.number]))}));

  const totalTasks = rows.reduce((sum,r)=>sum+r.s.total,0);
  const contacted = rows.reduce((sum,r)=>sum+r.s.contacted,0);
  const won = rows.reduce((sum,r)=>sum+r.s.won,0);
  const avg = rows.length ? Math.round(rows.reduce((sum,r)=>sum+r.s.pct,0)/rows.length) : 0;

  departmentEmployeesCount.textContent = actualMembers.length + pendingMembers.length;
  departmentTasks.textContent = totalTasks;
  departmentContacted.textContent = contacted;
  departmentWon.textContent = won;
  departmentAvg.textContent = avg + "%";

  const rendered = [
    ...rows.map(({e,s}) => `
      <tr>
        <td><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><strong>${esc(e.name)}</strong></div></td>
        <td>${e.number}</td>
        <td>${s.total}</td>
        <td>${s.contacted}</td>
        <td>${s.won}</td>
        <td><strong>${s.pct}%</strong><div class="progress"><span style="width:${s.pct}%"></span></div></td>
        <td><span class="status-pill active-status">مفعل</span></td>
      </tr>
    `),
    ...pendingMembers.map(e => `
      <tr>
        <td><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><strong>${esc(e.name)}</strong></div></td>
        <td>—</td>
        <td>0</td><td>0</td><td>0</td>
        <td><strong>0%</strong><div class="progress"><span style="width:0%"></span></div></td>
        <td><span class="status-pill pending-status">بانتظار البيانات</span></td>
      </tr>
    `)
  ];

  departmentDetailsBody.innerHTML = rendered.join("");
  const empty = rendered.length === 0;
  departmentDetailsEmpty.classList.toggle("hidden", !empty);
  departmentDetailsWrap.classList.toggle("hidden", empty);
});
