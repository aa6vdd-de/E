const departmentIcons={
  "التسويق":"📣",
  "التصميم":"🎨",
  "تحليل البيانات":"📊",
  "تصميم المواقع":"💻"
};

departmentsGrid.innerHTML=departments.map(dept=>{
  const members=employees.filter(e=>e.department===dept);
  return `<article class="department-card">
    <div class="department-icon">${departmentIcons[dept]||"🏢"}</div>
    <div class="department-info">
      <h3>${esc(dept)}</h3>
      <p>${members.length} موظف</p>
      <div class="department-members">
        ${members.length?members.map(e=>`<span>${esc(e.name)} <small>#${e.number}</small></span>`).join(""):'<span class="muted-member">لا يوجد موظفون مضافون حاليًا</span>'}
      </div>
    </div>
  </article>`;
}).join("");