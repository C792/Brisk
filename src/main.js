const { invoke } = window.__TAURI__.tauri;
const { appDataDir, join } = window.__TAURI__.path;
// import { appWindow } from '@tauri-apps/api/window';
const { appWindow } = window.__TAURI__.window;
const { convertFileSrc } = window.__TAURI__.tauri;

const appDataDirPath = await appDataDir();

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

let local = {
  loop: 0,
  shuffle: 0,
  volume: 0,
  playlistidx: 0,
  songidx: 0,
  ismute: 0,
}

const sep = "@].$/";

function updateloop(loopicon, status) {
  switch (Number(status)) {
    case 0:
      loopicon.classList.remove('active');
      loopicon.classList.add('bi-repeat');
      loopicon.classList.remove('bi-repeat-1');
      break;
    case 1:
      loopicon.classList.add('active');
      loopicon.classList.add('bi-repeat');
      loopicon.classList.remove('bi-repeat-1');
      break;
    case 2:
      loopicon.classList.add('active');
      loopicon.classList.remove('bi-repeat');
      loopicon.classList.add('bi-repeat-1');
      break;
    case NaN:
      console.error('Invalid loop status: ' + status);
      return;
  }
  local.loop = status;
}

function updateshuffle(shuffleicon, status) {
  if (status == 1) shuffleicon.classList.add('active');
  else shuffleicon.classList.remove('active');
  local.shuffle = status;
}

const audio = new Audio();
invoke('init');
invoke('readcurrent').then((_data) => {
  let cdata = JSON.parse(_data);
  invoke('readdata').then((data) => { 
    const sdata = JSON.parse(data);
    const currentsong = sdata.songs[sdata.playlists[cdata.playlistidx].songs[cdata.songidx]];
    local.playlistidx = Number(cdata.playlistidx);
    local.songidx = Number(cdata.songidx);
    console.log(`current song: ${currentsong.src}`);
    audio.src = convertFileSrc(currentsong.src);
    console.log(`audio src: ${audio.src}`);

    audio.volume = Number(currentsong.volume);
    local.volume = Number(currentsong.volume);
    document.getElementById('volume-value').innerHTML = `${Math.floor(audio.volume * 100)}`;
    const voi = document.getElementById('volume-icon');
    if (audio.volume >= 0.6) voi.classList.add('bi-volume-up');
    else if (audio.volume >= 0.25) voi.classList.add('bi-volume-down');
    else voi.classList.add('bi-volume-off');
    document.getElementById('volume-bar').style.height = `${audio.volume * 100}%`;
    document.body.getElementsByClassName("pltitle")[0].innerHTML = sdata.playlists[local.playlistidx].title;
    document.body.getElementsByClassName("songtitle")[0].innerHTML = currentsong.title;
  });
  updateshuffle(document.getElementById('shuffle'), Number(cdata.shuffle));
  updateloop(document.getElementById('loop'), Number(cdata.loop));
});

function updatesong() {
  invoke('readdata').then((data) => {
    const sdata = JSON.parse(data);
    const currentsong = sdata.songs[sdata.playlists[local.playlistidx].songs[local.songidx]];
    audio.src = currentsong.src;
    document.body.getElementsByClassName("pltitle")[0].innerHTML = sdata.playlists[local.playlistidx].title;
    document.body.getElementsByClassName("songtitle")[0].innerHTML = currentsong.title;
    audio.volume = Number(currentsong.volume);
    local.volume = Number(currentsong.volume);
    audio.currentTime = 0;
    audio.play();
  });
  invoke('save', { key: 'playlistidx', data: `${local.playlistidx}` });
  invoke('save', { key: 'songidx', data: `${local.songidx}` });
}

const clock = document.querySelectorAll(".clock");
const tick = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const html = `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  clock.forEach((c) => {
    if (c.innerHTML != html) c.innerHTML = html;
  });
};
setInterval(tick, 200);

function mouseisin(e, el) {
  const rect = el.getBoundingClientRect();
  return e.pageX >= rect.left && e.pageX <= rect.right && e.pageY >= rect.top && e.pageY <= rect.bottom;
}

var customPlaybutton = document.getElementById("playbutton");
var outline = document.getElementsByClassName("paused")[0];
function TogglePlay() {
  if (audio.paused) {
    audio.play();
    outline.classList.add("playing");
    outline.classList.remove("paused");
  }
  else {
    audio.pause();
    outline.classList.add("paused");
    outline.classList.remove("playing");
  }
}
customPlaybutton.addEventListener("click", TogglePlay);

const progresstrigger = document.getElementById('progresstrigger');
const progressBox = document.getElementById('progress');
const progressBar = document.getElementById('progress-bar');
const righttrigger = document.getElementById('righttrigger');
const rightsidebar = document.getElementsByClassName('rightsidebar')[0];
const lefttrigger = document.getElementById('lefttrigger');
const leftsidebar = document.getElementsByClassName('leftsidebar')[0];
const dlmenu = document.getElementById("download-menu");
const plc = document.getElementById('plc');
const slc = document.getElementById('slc');

const timestamp = document.getElementById('timestamp');
const sec = () => {
  const currentTime = audio.currentTime;
  const duration = audio.duration;

  timestamp.innerHTML = `${Math.floor(currentTime / 60).toString().padStart(2, "0")}:${Math.floor(currentTime % 60).toString().padStart(2, "0")} / ${Math.floor(duration / 60).toString().padStart(2, "0")}:${Math.floor(duration % 60).toString().padStart(2, "0")}`;
  progressBar.style.width = `${(currentTime / duration) * 100}%`;
  
  if (audio.ended) {
    switch (local.loop) {
      case 0:
        outline.classList.add("paused");
        outline.classList.remove("playing");
        break;
      case 1:
        invoke('readdata').then((data) => {
          const sdata = JSON.parse(data);
          local.songidx = (local.songidx + 1) % sdata.playlists[local.playlistidx].songs.length;
          console.log(local.songidx);
          invoke('save', { key: 'songidx', data: `${local.songidx}` });
        });
        updatesong();
        break;
      case 2:
        audio.play();
        break;
    }
  }
  if (audio.paused) {
    outline.classList.add("paused");
    outline.classList.remove("playing");
  } else {
    outline.classList.add("playing");
    outline.classList.remove("paused");
  }

  if (local.ismute) {
    audio.volume = 0;
    volumeIcon.classList.remove('bi-volume-up');
    volumeIcon.classList.add('bi-volume-mute');
  } else {
    if (!local.ismute && audio.volume != local.volume) {
      audio.volume = local.volume;
      volumebar.style.height = `${audio.volume * 100}%`;
      volumevalue.innerHTML = `${Math.floor(audio.volume * 100)}`;
      volumeIcon.classList.remove('bi-volume-mute');
      if (audio.volume >= 0.6) {
        volumeIcon.classList.add('bi-volume-up');
        volumeIcon.classList.remove('bi-volume-down');
        volumeIcon.classList.remove('bi-volume-off');
      } else if (audio.volume >= 0.25) {
        volumeIcon.classList.add('bi-volume-down');
        volumeIcon.classList.remove('bi-volume-up');
        volumeIcon.classList.remove('bi-volume-off');
      } else {
        volumeIcon.classList.add('bi-volume-off');
        volumeIcon.classList.remove('bi-volume-up');
        volumeIcon.classList.remove('bi-volume-down');
      }
    }
  }
}
setInterval(sec, 100);

progresstrigger.addEventListener('click', function(e) {
  const ispaused = audio.paused;
  const pos = (e.pageX - progressBox.offsetLeft);
  console.log(pos);
  audio.currentTime = (pos * audio.duration) / progressBox.offsetWidth;
  console.log(audio.currentTime);
  if (!ispaused) audio.play();
});

let isfullscreen = false;

document.addEventListener('keydown', function(e) { if (e.code == 'Space') TogglePlay(); });
document.addEventListener('keydown', function(e) { if (e.key == 'Home' || e.key == '0') audio.currentTime = 0; });
document.addEventListener('keydown', function(e) { if (e.key == 'End' || e.key == '-') audio.currentTime = audio.duration; });
document.addEventListener('keydown', function(e) { if (e.key == 'ArrowRight') audio.currentTime += 5; });
document.addEventListener('keydown', function(e) { if (e.key == 'ArrowLeft') audio.currentTime -= 5; });
document.addEventListener('keydown', function(e) { if (e.key == 'ArrowUp') local.volume = Math.min(((parseInt(local.volume * 20) + 1) / 20).toFixed(2), 1); });
document.addEventListener('keydown', function(e) { if (e.key == 'ArrowDown') local.volume = Math.max(0, (((local.volume * 20).toFixed(0) - 1) / 20).toFixed(2)); });
document.addEventListener('keydown', function(e) {
  if (e.key == 'F11') {
    appWindow.setFullscreen(isfullscreen);
    isfullscreen = !isfullscreen;
  }
});

{// !!DEBUG!!
  document.addEventListener('keydown', function(e) { if (e.code === 'Digit1') console.log(local); });
  document.addEventListener('keydown', function(e) {
    if (e.code === 'Digit2') {
      invoke('save', { key: 'shuffle', data: `${local.shuffle}` });
      invoke('save', { key: 'loop', data: `${local.loop}` });
      invoke('save', { key: 'songidx', data: `${local.songidx}` });
    }
  });
}

function AddPlaylistButton() {
  const li = document.createElement('div');
  li.classList.add('dual');
  li.innerHTML = `<button class="playlist center">Add Playlist</button>`;
  return li;
}

const shuffle = document.getElementById('shuffle');
const loop = document.getElementById('loop');
const playlistbtn = document.getElementById('save');

lefttrigger.addEventListener('click', function(e) {
  if (mouseisin(e, loop)) {
    updateloop(loop, (local.loop + 1) % 3);
    invoke('save', { key: 'loop', data: `${local.loop}` });
  } else if (mouseisin(e, shuffle)) {
    updateshuffle(shuffle, (local.shuffle + 1) % 2);
    invoke('save', { key: 'shuffle', data: `${local.shuffle}` });
  } else if (mouseisin(e, playlistbtn)) {
    if (plc.classList.contains('uiip')) {
      plc.classList.remove('uiip');
      slc.classList.add('uiip');
      dlmenu.classList.add('uip');
      invoke('get_playlist').then((data) => {
        let i = 0;
        const playlists = data.split(sep);
        plc.innerHTML = '';
        playlists.forEach((playlist) => {
          const li = document.createElement('div');
          li.classList.add('dual');
          li.classList.add(`${i}`);
          li.innerHTML = `<button class="playlist">${playlist}</button><button class="popup trash" id="${i}"><i class="bi bi-trash"></i></button>`;
          plc.appendChild(li);
          i += 1;
        });
        plc.appendChild(AddPlaylistButton());
        document.querySelectorAll('button.playlist').forEach((pl) => {
          pl.addEventListener('click', function(e) {
            if (e.target.innerHTML === 'Add Playlist') {
              swal({
                title: "Enter Playlist Name",
                type: "input", showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "Playlist000" },
                function (plname) {
                  if (plname != "") {
                    invoke('add_playlist', { songIdx: 0, title: plname });
                    pl.classList.add('uiip');
                    plc.removeChild(plc.lastChild);
                    console.log(`added playlist ${plname}`);
                    const li = document.createElement('div');
                    li.classList.add('dual');
                    li.innerHTML = `<button class="playlist">${plname}</button><button class="popup trash" id="${i}"><i class="bi bi-trash"></i></button>`;
                    pl.appendChild(li);
                    i += 1;
                    plc.appendChild(AddPlaylistButton());
                    
                    return true;
                  }
                  else return false;
                }
              );
            } else {
              invoke('readdata').then((data) => {
                const sdata = JSON.parse(data);
                audio.pause();
                local.playlistidx = playlists.indexOf(e.target.innerHTML);
                console.log(`changed to playlist ${local.playlistidx}`);
                local.songidx = 0;
                invoke('save', { key: 'playlistidx', data: `${local.playlistidx}` });
                invoke('save', { key: 'songidx', data: `${local.songidx}` });
                updatesong();
              });
            }
          });
        });
        document.querySelectorAll("button.trash").forEach((tb) => {
          tb.addEventListener('click', function(e) {
            let el = e.target;
            if (e.target.classList.contains("bi")) el = e.target.parentElement;
            // console.log(el);
            invoke('delete_playlist', { playlistIdx: Number(el.id) });
            document.getElementsByClassName(el.id)[0].remove();
            console.log(`deleted playlist ${el.id}`);
          });
        });
      });
    } else plc.classList.add('uiip');
  }
});


const volumeIcon = document.getElementById('volume-icon');
const volumebar = document.getElementById('volume-bar');
const volumebox = document.getElementById('volume-box');
const volumevalue = document.getElementById('volume-value');
righttrigger.addEventListener('click', function(e) {
  if (mouseisin(e, volumeIcon)) {
    if (local.ismute) {
      audio.volume = local.volume;
      local.ismute = 0;
      volumeIcon.classList.remove('bi-volume-mute');
      volumeIcon.classList.add('bi-volume-up');
    } else {
      local.volume = audio.volume;
      audio.volume = 0;
      local.ismute = 1;
      volumeIcon.classList.remove('bi-volume-up');
      volumeIcon.classList.add('bi-volume-mute');
    }
  }
  else {
    let voo = ((volumebox.getBoundingClientRect().bottom - e.clientY) / volumebox.offsetHeight).toFixed(2);
    voo = voo < 0 ? 0 : voo > 1 ? 1 : voo;
    local.volume = voo;
    volumevalue.innerHTML = `${Math.floor(audio.volume * 100)}`;
    // volumebar.style.height = `${local.volume * 100}%`;
  }
  volumebar.style.height = `${audio.volume * 100}%`;

  // invoke('save', { key: 'volume', data: `${local.volume}` });
});

document.getElementById("turnoff").addEventListener("click", function () {
  let ar = document.querySelectorAll(".clock");
  ar.forEach((clock) => {
    if (clock.classList.contains("hide")) clock.classList.remove("hide");
    else clock.classList.add("hide");
  });
});

document.getElementById("download").addEventListener("click", function () {
  if (dlmenu.classList.contains("uip")) {
    dlmenu.classList.remove("uip");
    plc.classList.add("uiip");
    slc.classList.add("uiip");
  }
  else dlmenu.classList.add("uip");
});

document.getElementById("dl").addEventListener("click", function () {
  const url = document.getElementById("link").value;
  const title = document.getElementById("title").value;
  invoke('download', { urlVideo: url, title: title });
  // invoke('save_song', { title: title, src: title + '.mp3', link: url, volume: 1 });
  invoke('save_playlist_init');
});

document.getElementById("addsong").addEventListener("click", function () {
  if (slc.classList.contains("uiip")) {
    slc.classList.remove("uiip");
    plc.classList.add("uiip");
    dlmenu.classList.add("uip");
    invoke('get_songs').then((data) => {
      let i = 0;
      const songs = data.split(sep);
      slc.innerHTML = '';
      songs.forEach((song) => {
        const li = document.createElement('div');
        li.classList.add('dual');
        li.innerHTML = `<button class="songlist" id="${i}">${song}</button><button class="songbtn popup"><i class="bi bi-plus"></i></button>`;
        slc.appendChild(li);
        i += 1;
      });
      document.querySelectorAll('button.songlist').forEach((sl) => {
        sl.addEventListener('click', function(e) {
          let el = e.target;
          if (e.target.classList.contains("bi")) el = e.target.parentElement;
          invoke('readdata').then((data) => {
            audio.pause();
            local.songidx = songs.indexOf(el.innerHTML);
            local.playlistidx = 0;
            console.log(`changed to song ${local.songidx}`);
            invoke('save', { key: 'songidx', data: `${local.songidx}` });
            invoke('save', { key: 'playlistidx', data: `${local.playlistidx}` });
            updatesong();
          });
        });
      });
      document.querySelectorAll('button.songbtn').forEach((sb) => {
        sb.addEventListener('click', function(e) {
          let el = e.target;
          if (e.target.classList.contains("bi")) el = e.target.parentElement;
          invoke('readdata').then((data) => {
            const sdata = JSON.parse(data);
            const songidx = songs.indexOf(el.previousElementSibling.innerHTML);
            const song = sdata.songs[songidx];
            invoke('playlist_append', { playlistIdx: local.playlistidx, songIdx: songidx });
            console.log(`added song ${song.title} to playlist ${local.playlistidx}`);
          });
        });
      });
    });
  }
  else slc.classList.add("uiip");
});


{ // mouseover things
  righttrigger.addEventListener('mouseover', function() {
    rightsidebar.classList.add('show');
  });

  righttrigger.addEventListener('mouseout', function() {
    rightsidebar.classList.remove('show');
  });

  progresstrigger.addEventListener('mouseover', function(e) {
    progressBox.classList.add('show');
  });

  progresstrigger.addEventListener('mouseout', function(e) {
    progressBox.classList.remove('show');
  });

  lefttrigger.addEventListener('mouseover', function() {
    leftsidebar.classList.add('show');
  });

  lefttrigger.addEventListener('mouseout', function() {
    leftsidebar.classList.remove('show');
  });
}

