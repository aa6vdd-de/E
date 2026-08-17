const current = JSON.parse(sessionStorage.getItem("currentAccount") || "null");

if(!current || current.role !== "employee"){
  location.href = "index.html";
}

document.getElementById("empSideName").textContent = current.name;
document.getElementById("empSideNumber").textContent = "الرقم الوظيفي: " + current.number;
document.getElementById("empTopName").textContent = current.name;
document.getElementById("welcomeName").textContent = current.name;

db.ref("tasks/" + current.number).on("value", snap => {
  const tasks = tasksArray(snap.val());
  renderEmployeeTasks(tasks);
});

function renderEmployeeTasks(tasks){
  const s = calc(tasks);

  document.getElementById("empTotal").textContent = s.total;
  document.getElementById("empContacted").textContent = s.contacted;
  document.getElementById("empWon").textContent = s.won;
  document.getElementById("empWon2").textContent = s.won;
  document.getElementById("empPostponed").textContent = s.postponed;
  document.getElementById("empRemaining").textContent = Math.max(monthlyTarget - s.won, 0);
  document.getElementById("empScore").textContent = s.pct + "%";
  document.getElementById("targetBar").style.width = Math.min(s.won / monthlyTarget * 100, 100) + "%";

  const empty = tasks.length === 0;
  document.getElementById("employeeEmpty").classList.toggle("hidden", !empty);
  document.getElementById("employeeTableWrap").classList.toggle("hidden", empty);

  if(empty){
    document.getElementById("employeeTasksBody").innerHTML = "";
    return;
  }

  tasks.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  document.getElementById("employeeTasksBody").innerHTML = tasks.map((t,i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${esc(t.clientName)}</strong></td>
      <td>${esc(t.phone)}</td>
      <td>
        <select class="status-select" id="status-${t.id}">
          ${["جديد","تم التواصل","تم التحويل إلى عميل","مؤجل","لا يرد"]
            .map(st => `<option ${t.status === st ? "selected" : ""}>${st}</option>`)
            .join("")}
        </select>
      </td>
      <td>
        <input class="note-input" id="note-${t.id}" value="${esc(t.note || "")}" placeholder="اكتب ملاحظة...">
      </td>
      <td>
        <button class="action" onclick="saveTask('${t.id}')">حفظ</button>
      </td>
    </tr>
  `).join("");
}

async function saveTask(taskId){
  const status = document.getElementById("status-" + taskId).value;
  const note = document.getElementById("note-" + taskId).value.trim();

  await db.ref("tasks/" + current.number + "/" + taskId).update({
    status,
    note,
    updatedAt:firebase.database.ServerValue.TIMESTAMP
  });

  showToast("تم حفظ التحديث");
}

function logout(){
  sessionStorage.removeItem("currentAccount");
  location.href = "index.html";
}
