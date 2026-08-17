db.ref(".info/connected").on("value", snap => {
  const online = snap.val() === true;
  document.getElementById("connectionDot").classList.toggle("online", online);
  document.getElementById("connectionText").textContent = online ? "متصل بـ Firebase" : "غير متصل بـ Firebase";
});

function login(){
  const name = normalizeArabic(document.getElementById("loginName").value);
  const number = document.getElementById("loginNumber").value.trim();

  const found = accounts.find(a =>
    a.aliases.some(x => normalizeArabic(x) === name) && a.number === number
  );

  if(!found){
    document.getElementById("loginError").style.display = "block";
    return;
  }

  document.getElementById("loginError").style.display = "none";
  sessionStorage.setItem("currentAccount", JSON.stringify(found));

  if(found.role === "manager"){
    location.href = "manager.html";
  }else{
    location.href = "employee.html";
  }
}

document.getElementById("loginNumber").addEventListener("keydown", e => {
  if(e.key === "Enter") login();
});
