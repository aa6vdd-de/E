const current = JSON.parse(sessionStorage.getItem("currentAccount") || "null");

if(!current || current.role !== "manager"){
  location.href = "index.html";
}

const tasksRef = db.ref("tasks");

tasksRef.on("value", snap => {
  const all = snap.val() || {};
  let totalTasks = 0;
  let totalContacted = 0;
  let totalWon = 0;
  let totalPercent = 0;

  document.getElementById("managerEmployeesBody").innerHTML = employees.map(e => {
    const tasks = tasksArray(all[e.number]);
    const s = calc(tasks);

    totalTasks += s.total;
    totalContacted += s.contacted;
    totalWon += s.won;
    totalPercent += s.pct;

    return `
      <tr>
        <td>
          <div class="employee-name">
            <div class="avatar">${esc(e.name[0])}</div>
            <strong>${esc(e.name)}</strong>
          </div>
        </td>
        <td>${e.number}</td>
        <td>${monthlyTarget}</td>
        <td>${s.total}</td>
        <td>${s.contacted}</td>
        <td>${s.won}</td>
        <td>
          <strong>${s.pct}%</strong>
          <div class="progress"><span style="width:${s.pct}%"></span></div>
        </td>
        <td>
          <button class="action" onclick="openTaskModal('${e.number}')">＋ إضافة عميل</button>
        </td>
      </tr>
    `;
  }).join("");

  document.getElementById("mgrEmpCount").textContent = employees.length;
  document.getElementById("mgrTaskCount").textContent = totalTasks;
  document.getElementById("mgrContacted").textContent = totalContacted;
  document.getElementById("mgrWon").textContent = totalWon;
  document.getElementById("mgrAvg").textContent = Math.round(totalPercent / employees.length || 0) + "%";
});

function openTaskModal(number){
  const emp = employees.find(e => e.number === number);

  document.getElementById("taskEmpNumber").value = number;
  document.getElementById("taskEmpName").value = emp.name;
  document.getElementById("clientName").value = "";
  document.getElementById("clientPhone").value = "";
  document.getElementById("managerNote").value = "";
  document.getElementById("taskModal").classList.add("show");
}

function closeTaskModal(){
  document.getElementById("taskModal").classList.remove("show");
}

async function addTask(){
  const employeeNumber = document.getElementById("taskEmpNumber").value;
  const clientName = document.getElementById("clientName").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const note = document.getElementById("managerNote").value.trim();

  if(!clientName || !phone){
    alert("أدخل اسم العميل ورقم التواصل");
    return;
  }

  const newRef = db.ref("tasks/" + employeeNumber).push();

  await newRef.set({
    clientName,
    phone,
    status:"جديد",
    note,
    createdAt:firebase.database.ServerValue.TIMESTAMP,
    createdBy:"2000"
  });

  closeTaskModal();
  showToast("تم إرسال المهمة للموظف");
}

function logout(){
  sessionStorage.removeItem("currentAccount");
  location.href = "index.html";
}
