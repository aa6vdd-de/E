
const departmentIcons={
  "التسويق":"📣",
  "التصميم":"🎨",
  "تحليل البيانات":"📊",
  "تصميم المواقع":"💻"
};

db.ref("tasks").on("value", snap => {
  const all = snap.val() || {};

  departmentsGrid.innerHTML = departments.map(dept => {
    const actualMembers = employees.filter(e => employeeInDepartment(e, dept));
    const pendingMembers = additionalDepartmentMembers.filter(e => e.department === dept);

    const memberRows = actualMembers.map(e => {
      const s = calc(tasksArray(all[e.number]));
      return {e,s};
    });

    const departmentAvg = memberRows.length
      ? Math.round(memberRows.reduce((sum,row)=>sum+row.s.pct,0)/memberRows.length)
      : 0;

    const totalTasks = memberRows.reduce((sum,row)=>sum+row.s.total,0);
    const totalWon = memberRows.reduce((sum,row)=>sum+row.s.won,0);
    const totalMembers = actualMembers.length + pendingMembers.length;

    return `<article class="department-card department-card-full clickable-department" onclick="location.href='${departmentLink(dept)}'">
      <div class="department-head">
        <div class="department-title">
          <div class="department-icon">${departmentIcons[dept]||"🏢"}</div>
          <div>
            <h3>${esc(dept)}</h3>
            <p>${totalMembers} موظف · ${totalTasks} مهمة · ${totalWon} عميل مكتسب</p>
          </div>
        </div>
        <div class="department-score">
          <small>متوسط الإنجاز</small>
          <strong>${departmentAvg}%</strong>
        </div>
      </div>

      <div class="department-progress"><span style="width:${departmentAvg}%"></span></div>

      <div class="department-members">
        ${actualMembers.map(e=>`<span>${esc(e.name)} <small>#${e.number}</small></span>`).join("")}
        ${pendingMembers.map(e=>`<span>${esc(e.name)} <small>بيانات الدخول لاحقًا</small></span>`).join("")}
        ${totalMembers===0?'<span class="muted-member">لا يوجد موظفون مضافون حاليًا</span>':""}
      </div>
    </article>`;
  }).join("");
});
