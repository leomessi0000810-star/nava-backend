const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GENRES_FILE = path.join(DATA_DIR, 'genres.json');
const SONGS_FILE = path.join(DATA_DIR, 'songs.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

function readJSON(file, def = []) {
  try {
    if (!fs.existsSync(file)) return def;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return def;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function initDB() {
  // Users
  let users = readJSON(USERS_FILE);
  if (users.length === 0) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@LEOMESSI_108', 10);
    users.push({
      id: 1,
      username: process.env.ADMIN_USERNAME || 'admin_2008',
      password: hash,
      isAdmin: true
    });
    writeJSON(USERS_FILE, users);
    console.log('✓ ادمین پیش‌فرض ساخته شد:', process.env.ADMIN_USERNAME || 'admin_2008');
  }

  // Genres
  let genres = readJSON(GENRES_FILE);
  if (genres.length === 0) {
    genres = [
      { id: 1, name: 'پاپ' },
      { id: 2, name: 'راک' },
      { id: 3, name: 'سنتی' },
      { id: 4, name: 'هیپ‌هاپ' },
      { id: 5, name: 'الکترونیک' },
      { id: 6, name: 'سایر' }
    ];
    writeJSON(GENRES_FILE, genres);
  }
}

// ---------- Users ----------
function getUsers() { return readJSON(USERS_FILE); }
function saveUsers(users) { writeJSON(USERS_FILE, users); }

function findUserByUsername(username) {
  return getUsers().find(u => u.username === username);
}

function createUser(username, password) {
  const users = getUsers();
  if (users.find(u => u.username === username)) return null;
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const user = {
    id,
    username,
    password: bcrypt.hashSync(password, 10),
    isAdmin: false
  };
  users.push(user);
  saveUsers(users);
  return { id: user.id, username: user.username, isAdmin: false };
}

// ---------- Genres ----------
function getGenres() { return readJSON(GENRES_FILE); }
function saveGenres(genres) { writeJSON(GENRES_FILE, genres); }

function addGenre(name) {
  const genres = getGenres();
  if (genres.find(g => g.name === name)) return null;
  const id = genres.length ? Math.max(...genres.map(g => g.id)) + 1 : 1;
  const genre = { id, name };
  genres.push(genre);
  saveGenres(genres);
  return genre;
}

function deleteGenre(id) {
  let genres = getGenres();
  genres = genres.filter(g => g.id !== Number(id));
  saveGenres(genres);
}

// ---------- Songs ----------
function getSongs() { return readJSON(SONGS_FILE); }
function saveSongs(songs) { writeJSON(SONGS_FILE, songs); }

function addSong(data) {
  const songs = getSongs();
  const id = songs.length ? Math.max(...songs.map(s => s.id)) + 1 : 1;
  const song = {
    id,
    title: data.title,
    artist: data.artist,
    album: data.album || '',
    genre_id: data.genre_id ? Number(data.genre_id) : null,
    genre: data.genre || '',
    audio_path: data.audio_path,
    cover_path: data.cover_path || null,
    play_count: 0,
    tags: data.tags || [],
    created_at: new Date().toISOString()
  };
  songs.push(song);
  saveSongs(songs);
  return song;
}

function updateSong(id, data) {
  const songs = getSongs();
  const index = songs.findIndex(s => s.id === Number(id));
  if (index === -1) return null;
  songs[index] = { ...songs[index], ...data };
  saveSongs(songs);
  return songs[index];
}

function deleteSong(id) {
  let songs = getSongs();
  songs = songs.filter(s => s.id !== Number(id));
  saveSongs(songs);
}

function incrementPlayCount(id) {
  const songs = getSongs();
  const song = songs.find(s => s.id === Number(id));
  if (song) {
    song.play_count = (song.play_count || 0) + 1;
    saveSongs(songs);
  }
}

function getPopularSongs(limit = 15) {
  return getSongs()
    .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
    .slice(0, limit);
}

// ---------- Playlists ----------
function getPlaylists() { return readJSON(PLAYLISTS_FILE); }
function savePlaylists(playlists) { writeJSON(PLAYLISTS_FILE, playlists); }

function getUserPlaylists(userId) {
  return getPlaylists().filter(p => p.userId === Number(userId));
}

function createPlaylist(userId, name) {
  const playlists = getPlaylists();
  const id = playlists.length ? Math.max(...playlists.map(p => p.id)) + 1 : 1;
  const pl = { id, userId: Number(userId), name, songIds: [] };
  playlists.push(pl);
  savePlaylists(playlists);
  return pl;
}

function getPlaylistById(id) {
  return getPlaylists().find(p => p.id === Number(id));
}

function addSongToPlaylist(playlistId, songId) {
  const playlists = getPlaylists();
  const pl = playlists.find(p => p.id === Number(playlistId));
  if (!pl) return null;
  if (!pl.songIds.includes(Number(songId))) {
    pl.songIds.push(Number(songId));
    savePlaylists(playlists);
  }
  return pl;
}

function removeSongFromPlaylist(playlistId, songId) {
  const playlists = getPlaylists();
  const pl = playlists.find(p => p.id === Number(playlistId));
  if (!pl) return null;
  pl.songIds = pl.songIds.filter(id => id !== Number(songId));
  savePlaylists(playlists);
  return pl;
}

function deletePlaylist(id) {
  let playlists = getPlaylists();
  playlists = playlists.filter(p => p.id !== Number(id));
  savePlaylists(playlists);
}

module.exports = {
  initDB,
  getUsers, findUserByUsername, createUser,
  getGenres, addGenre, deleteGenre,
  getSongs, addSong, updateSong, deleteSong, incrementPlayCount, getPopularSongs,
  getUserPlaylists, createPlaylist, getPlaylistById,
  addSongToPlaylist, removeSongFromPlaylist, deletePlaylist
};