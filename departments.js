
const departmentIcons = {
  "التسويق":"📣",
  "التصميم":"🎨",
  "تحليل البيانات":"📊",
  "تصميم المواقع":"💻"
};

db.ref("tasks").on("value", snap => {
  const all = snap.val() || {};

  departmentsGrid.innerHTML = departments.map(dept => {
    const members = employees.filter(e => e.department === dept);

    const memberRows = members.map(e => {
      const s = calc(tasksArray(all[e.number]));
      return { e, s };
    });

    const departmentAvg = memberRows.length
      ? Math.round(memberRows.reduce((sum, row) => sum + row.s.pct, 0) / memberRows.length)
      : 0;

    const totalTasks = memberRows.reduce((sum, row) => sum + row.s.total, 0);
    const totalWon = memberRows.reduce((sum, row) => sum + row.s.won, 0);

    return `
      <article class="department-card department-card-full">
        <div class="department-head">
          <div class="department-title">
            <div class="department-icon">${departmentIcons[dept] || "🏢"}</div>
            <div>
              <h3>${esc(dept)}</h3>
              <p>${members.length} موظف · ${totalTasks} مهمة · ${totalWon} عميل مكتسب</p>
            </div>
          </div>

          <div class="department-score">
            <small>متوسط الإنجاز</small>
            <strong>${departmentAvg}%</strong>
          </div>
        </div>

        <div class="department-progress">
          <span style="width:${departmentAvg}%"></span>
        </div>

        ${
          memberRows.length
          ? `<div class="department-employee-list">
              ${memberRows.map(({e,s}) => `
                <div class="department-employee-row">
                  <div class="department-employee-name">
                    <div class="avatar">${esc(e.name[0])}</div>
                    <div>
                      <strong>${esc(e.name)}</strong>
                      <small>الرقم الوظيفي: ${e.number}</small>
                    </div>
                  </div>

                  <div class="employee-metric">
                    <small>المهام</small>
                    <strong>${s.total}</strong>
                  </div>

                  <div class="employee-metric">
                    <small>تم التواصل</small>
                    <strong>${s.contacted}</strong>
                  </div>

                  <div class="employee-metric">
                    <small>عملاء مكتسبون</small>
                    <strong>${s.won}</strong>
                  </div>

                  <div class="employee-achievement">
                    <div class="employee-achievement-head">
                      <small>الإنجاز</small>
                      <strong>${s.pct}%</strong>
                    </div>
                    <div class="progress">
                      <span style="width:${s.pct}%"></span>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>`
          : `<div class="department-empty">
              لا يوجد موظفون مضافون في هذا القسم حاليًا.
            </div>`
        }
      </article>
    `;
  }).join("");
});
