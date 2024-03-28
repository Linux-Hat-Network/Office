var cloud_path = "/";

function login() {
  document.getElementById("accountIndicator").href =
    "https://auth.linuxhat.net/?redirect=" + window.location;
  login = document.getElementById("accountIndicator");
  var key = getCookie("KEY");
  if (key) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://auth.linuxhat.net/api/key/getinfo");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ key: key }));
    xhr.onload = function () {
      const data = JSON.parse(xhr.response);
      if (data.user_id) {
        xhr.open("GET", "https://auth.linuxhat.net/api/user/" + data.user_id);
        xhr.send();
        xhr.onload = function () {
          const user = JSON.parse(xhr.response);
          login.innerHTML = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-in-right" viewBox="0 0 16 16">`,
            `  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>`,
            `</svg> ${user.name}`,
          ].join("");
        };
      }
    };
  }
}

function delete_note(id) {
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/note/delete");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, id: id }));
  xhr.onload = function () {
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    if (xhr.status == 404) {
      return;
    }
    get_notes();
  };
}

function get_notes() {
  document.getElementById("title").innerHTML = "Notes";
  document.getElementById("head").innerHTML = "Notes";
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/get-notes");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key }));
  xhr.onload = function () {
    const data = JSON.parse(xhr.response);
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    const indic = document.getElementById("is_notes");
    const list = document.getElementById("notes_list");
    list.innerHTML = "";
    if (data.notes.length) {
      indic.innerHTML =
        '<h1><a style="border-radius:20px" class="btn btn-primary" href="/note/new" role="button"><h1>+</h1></a>  Notes :</h1>';
      for (const note of data.notes) {
        list.innerHTML +=
          '<div class="bg-light-a card-body"><div class="box-teams"><div><h3 class="text-start list-inline-item">' +
          note.name +
          '</h3></div><div><a class="btn btn-primary" href="/note?id=' +
          note.id +
          '" role="button">View/Edit</a><a class="btn btn-danger" onclick="delete_note(' +
          note.id +
          ')" role="button">Delete</a></div></div></div>';
      }
    } else {
      list.remove();
      indic.innerHTML =
        '<h1><a style="border-radius:20px" class="btn btn-primary" href="/note/new" role="button"><h1>+</h1></a>  No notes for the moment.</h1>';
    }
  };
}

function get_note(edit = 0) {
  var key = getCookie("KEY");
  var id = get_param("id");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/get-note");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, id: id }));
  xhr.onload = function () {
    const data = JSON.parse(xhr.response);
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    if (xhr.status == 404) {
      window.location.replace("https://office.linuxhat.net/notes");
    }
    document.getElementById("title").innerHTML = data.name;
    document.getElementById("head").innerHTML = data.name;
    const name = document.getElementById("name");
    const content = document.getElementById("content");
    const button = document.getElementById("button");

    content.innerHTML = data.content;
    if (edit == 0) {
      button.href = "/note/edit?id=" + data.id;
      name.innerHTML = data.name;
    } else {
      name.value = data.name;
    }
  };
}

function edit_note() {
  var name = document.getElementById("name").value;
  var content = document.getElementById("content").value;
  document.getElementById("title").innerHTML = name;
  document.getElementById("head").innerHTML = name;
  var key = getCookie("KEY");
  var id = get_param("id");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/note/edit");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, id: id, name: name, content: content }));
  xhr.onload = function () {
    const data = JSON.parse(xhr.response);
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    if (xhr.status == 404) {
      window.location.replace("https://office.linuxhat.net/notes");
    }
    window.location.replace("https://office.linuxhat.net/note?id=" + id);
  };
}

function new_note() {
  var name = document.getElementById("name").value;
  var content = document.getElementById("content").value;
  document.getElementById("title").innerHTML = name;
  document.getElementById("head").innerHTML = name;
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/new/note");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, name: name, content: content }));
  xhr.onload = function () {
    const data = JSON.parse(xhr.response);
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    window.location.replace("https://office.linuxhat.net/note?id=" + data.id);
  };
}

function get_param(param) {
  var vars = {};
  window.location.href.replace(location.hash, "").replace(
    /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
    function (m, key, value) {
      // callback
      vars[key] = value !== undefined ? value : "";
    }
  );
  if (param) {
    return vars[param] ? vars[param] : null;
  }
  return vars;
}

function setCookie(cname, cvalue) {
  document.cookie =
    cname + "=" + cvalue + "; SameSite=None; Domain=linuxhat.net";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function cloud_load(path) {
  if (!path) {
    path = "/";
  }
  cloud_path = path;
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/cloud");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, path: path }));
  xhr.onload = function () {
    const data = JSON.parse(xhr.response);
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }

    if (xhr.status != 200) {
      return;
    }
    document.getElementById("path").innerText = data.path;
    document.getElementById("storage").innerText = formatBytes(
      data.data.now,
      1
    );
    if (data.data.data_limit) {
      document.getElementById("storage").innerText +=
        " on " + formatBytes(data.data.data_limit, 1);
      document.getElementById("progress").hidden = false;
      document.getElementById("progress-bar").style =
        "width: " + (data.data.now / data.data.data_limit) * 100 + "%";
    } else {
      document.getElementById("progress").hidden = true;
    }
    document.getElementById("no-items").hidden = false;
    document.getElementById("items").innerHTML = "";
    if (data.items.files.length || data.items.folders.length) {
      document.getElementById("no-items").hidden = true;
      for (var folder in data.items.folders) {
        folder = data.items.folders[folder];
        var folderElement = document.createElement("div");
        folderElement.className = "bg-light card";
        folderElement.innerHTML = `
          <div class="bg-light-a card-body">
            <div class="box-teams">
              <div>
                <img src="/static/folder_icon.png" height="50" />
                <h3 class="text-start list-inline-item">${folder}</h3>
              </div>
              <div>
                <a class="btn btn-primary" onclick="cloud_load('${path}${folder}/')" role="button">Go</a>
                <a class="btn btn-primary" onclick="cloud_download('${path}${folder}/',1)" role="button">Download</a>
                <a class="btn btn-danger" onclick="cloud_delete('${path}${folder}/')" role="button">Delete</a>
              </div>
            </div>
          </div>
          <div style="padding-top: 0.2cm"></div>`;
        document.getElementById("items").appendChild(folderElement);
      }

      for (var file in data.items.files) {
        file = data.items.files[file];
        var fileElement = document.createElement("div");
        fileElement.className = "bg-light card";
        fileElement.innerHTML = `
          <div class="bg-light-a card-body">
            <div class="box-teams">
              <div>
                <img src="/static/file_icon.png" height="50" />
                <h3 class="text-start list-inline-item">${file}</h3>
              </div>
              <div>
                <a class="btn btn-primary" onclick="cloud_download('${path}${file}')" role="button">Download</a>
                <a class="btn btn-danger" onclick="cloud_delete('${path}${file}')" role="button">Delete</a>
              </div>
            </div>
          </div>
          <div style="padding-top: 0.2cm"></div>`;
        document.getElementById("items").appendChild(fileElement);
      }
    }
    if (path == "/") {
      document.getElementById("parent").hidden = true;
    } else {
      document.getElementById("parent").hidden = false;
      var bouton = document.getElementById("parent-path");
      bouton.onclick = function () {
        cloud_load(getParentFolderPath(path));
      };
    }
  };
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function cloud_download(path, is_folder = 0) {
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/cloud/download");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.responseType = "blob";
  xhr.send(JSON.stringify({ key: key, path: path }));
  xhr.onload = function () {
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    if (xhr.status != 200) {
      return;
    }
    var blob = new Blob([xhr.response]);
    let a = document.createElement("a");
    a.style = "display: none";
    document.body.appendChild(a);
    let url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = "folder.tar";
    if (!is_folder) {
      a.download = path.split("/")[path.split("/").length - 1];
    }
    a.click();
    window.URL.revokeObjectURL(url);
  };
}

function cloud_new_folder() {
  var name = document.getElementById("folder_name").value;
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/cloud/new/folder");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, name: name, path: cloud_path }));
  xhr.onload = function () {
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }

    if (xhr.status == 303) {
      appendAlert("Alredy exist...", "warning", "folder_alert");
      return;
    }
    if (xhr.status != 200) {
      return;
    }
    appendAlert("Created", "success", "folder_alert");
    cloud_load(cloud_path);
  };
}

function getParentFolderPath(folderPath) {
  var folderPath = folderPath.split("/");
  if (!folderPath[folderPath.length - 1]) {
    folderPath.pop();
  }
  folderPath.pop();
  url = "";
  for (var folder in folderPath) {
    if (folderPath[folder]) {
      url += "/" + folderPath[folder];
    }
  }
  url += "/";
  return url;
}

const appendAlert = (message, type, id) => {
  const alertPlaceholder = document.getElementById(id);
  const wrapper = document.createElement("div");
  wrapper.className = `alert alert-${type} alert-dismissible`;
  wrapper.role = "alert";
  wrapper.innerHTML = [
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
  ].join("");

  alertPlaceholder.append(wrapper);
  var divs = alertPlaceholder.children;
  while (divs.length > 1) {
    alertPlaceholder.removeChild(divs[0]);
  }
};

function cloud_delete(path) {
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/cloud/delete");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, path: path }));
  xhr.onload = function () {
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    if (xhr.status != 200) {
      return;
    }
    appendAlert("Deleted.", "success", "alert_placeholder");
    cloud_load(cloud_path);
  };
}

function cloud_upload() {
  var fileInput = document.getElementById("fileInput");
  if (!fileInput.files) {
    appendAlert("You have to put a file.", "warning", "alert_placeholder");
    return;
  }
  var file = fileInput.files[0];
  var key = getCookie("KEY");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://office.linuxhat.net/api/user/cloud/ask/upload");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ key: key, path: cloud_path, filename: file.name }));

  xhr.onload = function () {
    if (xhr.status == 498) {
      window.location.replace(
        "https://auth.linuxhat.net/?redirect=" + location
      );
    }
    if (xhr.status == 303) {
      appendAlert("Alredy exist...", "warning", "alert_placeholder");
      return;
    }
    if (xhr.status == 200) {
      const data = JSON.parse(xhr.response);
      const url = data.url;
      xhr.open("POST", url, true);
      xhr.send(file);

      xhr.onload = function () {
        if (xhr.status == 507) {
          appendAlert("Insufisent storage.", "warning", "alert_placeholder");
          return;
        }
        appendAlert("Upload", "success", "alert_placeholder");
        cloud_load(cloud_path);
      };
    }
  };
}

function cloud_loop() {
  if (window.location == "https://office.linuxhat.net/cloud") {
    cloud_load(cloud_path);
  }
}

//setInterval(cloud_loop, 10000);
