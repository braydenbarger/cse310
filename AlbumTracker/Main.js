"use strict";

const myAlbums = [
    { id: "1", title: "Bloom", artist: "Beach House", year: 2012, genre: "Indie", stats: { energy: 45, mood: 40, dance: 35, acoustic: 30 } },
    { id: "2", title: "Currents", artist: "Tame Impala", year: 2015, genre: "Indie", stats: { energy: 65, mood: 45, dance: 60, acoustic: 10 } },
    { id: "3", title: "The New Abnormal", artist: "The Strokes", year: 2020, genre: "Indie", stats: { energy: 70, mood: 45, dance: 50, acoustic: 10 } },
    { id: "4", title: "OK Computer", artist: "Radiohead", year: 1997, genre: "Alt rock", stats: { energy: 55, mood: 25, dance: 25, acoustic: 30 } },
    { id: "5", title: "Oracular Spectacular", artist: "MGMT", year: 2007, genre: "Indie", stats: { energy: 75, mood: 55, dance: 60, acoustic: 10 } },
    { id: "6", title: "Dirt", artist: "Alice in Chains", year: 1992, genre: "Grunge", stats: { energy: 80, mood: 15, dance: 25, acoustic: 10 } },
    { id: "7", title: "Jar of Flies", artist: "Alice in Chains", year: 1994, genre: "Grunge", stats: { energy: 40, mood: 25, dance: 30, acoustic: 75 } },
    { id: "8", title: "Ten", artist: "Pearl Jam", year: 1991, genre: "Grunge", stats: { energy: 75, mood: 35, dance: 30, acoustic: 10 } },
    { id: "9", title: "Core", artist: "Stone Temple Pilots", year: 1992, genre: "Grunge", stats: { energy: 80, mood: 35, dance: 30, acoustic: 8 } },
    { id: "10", title: "Superunknown", artist: "Soundgarden", year: 1994, genre: "Grunge", stats: { energy: 75, mood: 30, dance: 30, acoustic: 15 } },
    { id: "11", title: "Badmotorfinger", artist: "Soundgarden", year: 1991, genre: "Grunge", stats: { energy: 85, mood: 30, dance: 30, acoustic: 5 } },
    { id: "12", title: "Back to the Barrooms", artist: "Merle Haggard", year: 1980, genre: "Outlaw country", stats: { energy: 45, mood: 60, dance: 55, acoustic: 55 } },
    { id: "13", title: "Honky Tonk Heroes", artist: "Waylon Jennings", year: 1973, genre: "Outlaw country", stats: { energy: 55, mood: 60, dance: 55, acoustic: 55 } },
    { id: "14", title: "Lonesome, On'ry and Mean", artist: "Waylon Jennings", year: 1973, genre: "Outlaw country", stats: { energy: 55, mood: 55, dance: 55, acoustic: 55 } },
    { id: "15", title: "Purgatory", artist: "Tyler Childers", year: 2017, genre: "Country", stats: { energy: 55, mood: 55, dance: 45, acoustic: 50 } },
    { id: "16", title: "Red Headed Stranger", artist: "Willie Nelson", year: 1975, genre: "Outlaw country", stats: { energy: 25, mood: 40, dance: 35, acoustic: 85 } },
    { id: "17", title: "Zach Bryan", artist: "Zach Bryan", year: 2023, genre: "Country", stats: { energy: 35, mood: 45, dance: 40, acoustic: 80 } },
    { id: "18", title: "Led Zeppelin II", artist: "Led Zeppelin", year: 1969, genre: "Classic rock", stats: { energy: 85, mood: 55, dance: 40, acoustic: 10 } },
    { id: "19", title: "Led Zeppelin IV", artist: "Led Zeppelin", year: 1971, genre: "Classic rock", stats: { energy: 70, mood: 50, dance: 35, acoustic: 40 } },
    { id: "20", title: "Rising", artist: "Rainbow", year: 1976, genre: "Metal", stats: { energy: 85, mood: 45, dance: 30, acoustic: 5 } },
    { id: "21", title: "The College Dropout", artist: "Kanye West", year: 2004, genre: "Hip hop", stats: { energy: 70, mood: 65, dance: 70, acoustic: 10 } },
    { id: "22", title: "My Beautiful Dark Twisted Fantasy", artist: "Kanye West", year: 2010, genre: "Hip hop", stats: { energy: 75, mood: 45, dance: 60, acoustic: 10 } },
    { id: "23", title: "Piñata", artist: "Freddie Gibbs & Madlib", year: 2014, genre: "Hip hop", stats: { energy: 65, mood: 45, dance: 65, acoustic: 15 } },
    { id: "24", title: "DeBÍ TiRAR MáS FOToS", artist: "Bad Bunny", year: 2025, genre: "Latin", stats: { energy: 55, mood: 60, dance: 70, acoustic: 25 } },
    { id: "25", title: "Un Verano Sin Ti", artist: "Bad Bunny", year: 2022, genre: "Latin", stats: { energy: 60, mood: 60, dance: 75, acoustic: 20 } },
    { id: "26", title: "Holy Diver", artist: "Dio", year: 1983, genre: "Metal", stats: { energy: 85, mood: 40, dance: 25, acoustic: 5 } },
    { id: "27", title: "Master of Puppets", artist: "Metallica", year: 1986, genre: "Metal", stats: { energy: 95, mood: 25, dance: 20, acoustic: 3 } },
    { id: "28", title: "Paranoid", artist: "Black Sabbath", year: 1970, genre: "Metal", stats: { energy: 85, mood: 40, dance: 25, acoustic: 5 } },
    { id: "29", title: "Painkiller", artist: "Judas Priest", year: 1990, genre: "Metal", stats: { energy: 95, mood: 25, dance: 20, acoustic: 2 } },
    { id: "30", title: "Powerslave", artist: "Iron Maiden", year: 1984, genre: "Metal", stats: { energy: 90, mood: 45, dance: 25, acoustic: 3 } },
    { id: "31", title: "Blonde", artist: "Frank Ocean", year: 2016, genre: "R&B", stats: { energy: 30, mood: 30, dance: 40, acoustic: 55 } },
    { id: "32", title: "The Miseducation of Lauryn Hill", artist: "Lauryn Hill", year: 1998, genre: "R&B", stats: { energy: 55, mood: 65, dance: 65, acoustic: 35 } },
    { id: "33", title: "Random Access Memories", artist: "Daft Punk", year: 2013, genre: "Electronic", stats: { energy: 65, mood: 65, dance: 80, acoustic: 20 } },
    { id: "34", title: "So Tonight That I Might See", artist: "Mazzy Star", year: 1993, genre: "Indie", stats: { energy: 35, mood: 30, dance: 30, acoustic: 70 } },
    { id: "35", title: "Ctrl", artist: "SZA", year: 2017, genre: "R&B", stats: { energy: 50, mood: 40, dance: 60, acoustic: 25 } },
    { id: "36", title: "Rodeo", artist: "Travis Scott", year: 2015, genre: "Hip hop", stats: { energy: 65, mood: 30, dance: 60, acoustic: 10 } },
    { id: "37", title: "Exodus", artist: "Bob Marley & The Wailers", year: 1977, genre: "Reggae", stats: { energy: 60, mood: 70, dance: 75, acoustic: 30 } },
    { id: "38", title: "Kaya", artist: "Bob Marley & The Wailers", year: 1978, genre: "Reggae", stats: { energy: 45, mood: 75, dance: 70, acoustic: 40 } },
    { id: "39", title: "The Dark Side of the Moon", artist: "Pink Floyd", year: 1973, genre: "Classic rock", stats: { energy: 45, mood: 30, dance: 25, acoustic: 25 } },
    { id: "40", title: "Nevermind", artist: "Nirvana", year: 1991, genre: "Grunge", stats: { energy: 85, mood: 45, dance: 35, acoustic: 5 } },
    { id: "41", title: "Dookie", artist: "Green Day", year: 1994, genre: "Punk", stats: { energy: 90, mood: 65, dance: 45, acoustic: 5 } },
    { id: "42", title: "Rumours", artist: "Fleetwood Mac", year: 1977, genre: "Classic rock", stats: { energy: 55, mood: 55, dance: 60, acoustic: 35 } }
];

const extraAlbums = [
    { id: "101", title: "Vs.", artist: "Pearl Jam", year: 1993, genre: "Grunge", stats: { energy: 80, mood: 40, dance: 30, acoustic: 10 } },
    { id: "102", title: "In Utero", artist: "Nirvana", year: 1993, genre: "Grunge", stats: { energy: 85, mood: 30, dance: 30, acoustic: 10 } },
    { id: "103", title: "Master of Reality", artist: "Black Sabbath", year: 1971, genre: "Metal", stats: { energy: 80, mood: 35, dance: 25, acoustic: 8 } },
    { id: "104", title: "Ride the Lightning", artist: "Metallica", year: 1984, genre: "Metal", stats: { energy: 90, mood: 30, dance: 20, acoustic: 5 } },
    { id: "105", title: "Dreaming My Dreams", artist: "Waylon Jennings", year: 1975, genre: "Outlaw country", stats: { energy: 40, mood: 55, dance: 50, acoustic: 65 } },
    { id: "106", title: "Metamodern Sounds in Country Music", artist: "Sturgill Simpson", year: 2014, genre: "Country", stats: { energy: 55, mood: 55, dance: 50, acoustic: 40 } },
    { id: "107", title: "good kid, m.A.A.d city", artist: "Kendrick Lamar", year: 2012, genre: "Hip hop", stats: { energy: 65, mood: 40, dance: 65, acoustic: 10 } },
    { id: "108", title: "Channel Orange", artist: "Frank Ocean", year: 2012, genre: "R&B", stats: { energy: 50, mood: 50, dance: 60, acoustic: 35 } },
    { id: "109", title: "Lonerism", artist: "Tame Impala", year: 2012, genre: "Indie", stats: { energy: 70, mood: 50, dance: 50, acoustic: 10 } },
    { id: "110", title: "Is This It", artist: "The Strokes", year: 2001, genre: "Indie", stats: { energy: 75, mood: 55, dance: 55, acoustic: 10 } },
    { id: "111", title: "Catch a Fire", artist: "Bob Marley & The Wailers", year: 1973, genre: "Reggae", stats: { energy: 55, mood: 65, dance: 70, acoustic: 35 } },
    { id: "112", title: "In Rainbows", artist: "Radiohead", year: 2007, genre: "Alt rock", stats: { energy: 55, mood: 35, dance: 40, acoustic: 30 } },
    { id: "113", title: "Wish You Were Here", artist: "Pink Floyd", year: 1975, genre: "Classic rock", stats: { energy: 40, mood: 35, dance: 25, acoustic: 45 } },
    { id: "114", title: "American Idiot", artist: "Green Day", year: 2004, genre: "Punk", stats: { energy: 90, mood: 55, dance: 40, acoustic: 5 } }
];
const allAlbums = myAlbums.concat(extraAlbums);

const SPOTIFY_CLIENT_ID = "";

function connectSpotify() {
    return "Spotify login isn't set up yet.";
}

async function searchAlbums(query) {
    const q = query.toLowerCase();
    return allAlbums
        .filter(a => labelFor(a).toLowerCase().includes(q))
        .slice(0, 8);
}

async function getRecommendations(library) {
    if (library.length === 0)
        return [];

    let totalWeight = 0;
    let energy = 0;
    let mood = 0;
    let dance = 0;
    let acoustic = 0;
    const genreWeights = {};
    for (const a of library) {
        const weight = a.rating > 0 ? a.rating : 5;
        totalWeight += weight;
        energy += a.stats.energy * weight;
        mood += a.stats.mood * weight;
        dance += a.stats.dance * weight;
        acoustic += a.stats.acoustic * weight;
        genreWeights[a.genre] = (genreWeights[a.genre] || 0) + weight;
    }
    const average = {
        energy: energy / totalWeight,
        mood: mood / totalWeight,
        dance: dance / totalWeight,
        acoustic: acoustic / totalWeight
    };
    const candidates = allAlbums.filter(a => !library.some(l => l.id === a.id));
    const scored = candidates.map(a => {
        const genreShare = (genreWeights[a.genre] || 0) / totalWeight;
        const score = howDifferent(average, a.stats) - genreShare * 150;
        return { album: a, score: score };
    });
    scored.sort((x, y) => x.score - y.score);
    return scored.map(item => item.album);
}
function howDifferent(a, b) {
    return Math.abs(a.energy - b.energy)
        + Math.abs(a.mood - b.mood)
        + Math.abs(a.dance - b.dance)
        + Math.abs(a.acoustic - b.acoustic);
}
const STORAGE_KEY = "spinlog-library-v4";
const library = [];
function saveLibrary() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    }
    catch (error) {
    }
}
function loadLibrary() {
    let saved = null;
    try {
        saved = localStorage.getItem(STORAGE_KEY);
    }
    catch (error) {
        saved = null;
    }
    if (saved) {
        const items = JSON.parse(saved);
        library.push(...items);
    }
}
function inLibrary(album) {
    return library.some(a => a.id === album.id);
}
function removeFromLibrary(id) {
    const index = library.findIndex(a => a.id === id);
    if (index !== -1)
        library.splice(index, 1);
}
function get(id) {
    return document.getElementById(id);
}
function safe(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML.replace(/"/g, "&quot;");
}
function labelFor(album) {
    return album.title + " - " + album.artist;
}
function coverHTML(album) {
    if (album.image) {
        return `<img class="cover" src="${safe(album.image)}" alt="${safe(album.title)} cover">`;
    }
    let hue = 0;
    for (const letter of album.title) {
        hue = (hue * 31 + letter.charCodeAt(0)) % 360;
    }
    const firstLetters = album.title.split(" ").slice(0, 2).map(w => w[0]).join("");
    return `<div class="cover" style="background: hsl(${hue}, 60%, 40%)">${safe(firstLetters)}</div>`;
}
function statsHTML(album) {
    const rows = [
        ["Energy", album.stats.energy],
        ["Mood", album.stats.mood],
        ["Danceability", album.stats.dance],
        ["Acoustic", album.stats.acoustic]
    ];
    let html = "";
    for (const [name, value] of rows) {
        html += `<div class="stat-row"><span>${name}</span><div class="bar"><div class="fill" style="width: ${value}%"></div></div></div>`;
    }
    return html;
}
function showStats() {
    const rated = library.filter(a => a.rating > 0);
    let average = "-";
    if (rated.length > 0) {
        let total = 0;
        for (const a of rated)
            total += a.rating;
        average = (total / rated.length).toFixed(1);
    }
    get("stats").innerHTML = `
    <div><span class="stat-number">${library.length}</span> albums</div>
    <div><span class="stat-number">${rated.length}</span> rated</div>
    <div><span class="stat-number">${average}</span> average rating (out of 10)</div>
  `;
}
function showLibrary() {
    if (library.length === 0) {
        get("library").innerHTML = `<div class="empty">Nothing here yet. Search for an album to add one.</div>`;
        return;
    }
    const list = library.slice().sort((a, b) => b.addedAt - a.addedAt);
    let html = "";
    for (const album of list) {
        const ratingText = album.rating > 0 ? album.rating + "/10" : "Not rated yet";
        const rateButton = album.rating > 0 ? "Change rating" : "Rate it";
        html += `
      <div class="card">
        ${coverHTML(album)}
        <h3>${safe(album.title)}</h3>
        <div class="small-text">${safe(album.artist)} (${album.year}) - ${safe(album.genre)}</div>
        <div class="rating">${ratingText}</div>
        ${statsHTML(album)}
        <button data-action="rate" data-id="${album.id}">${rateButton}</button>
        <button data-action="remove" data-id="${album.id}">Remove</button>
      </div>
    `;
    }
    get("library").innerHTML = html;
}
function refresh() {
    showStats();
    showLibrary();
}

let currentOptions = [];
let highlighted = -1;
function hideSuggestions() {
    get("suggestions").hidden = true;
    currentOptions = [];
    highlighted = -1;
}
function showSuggestions() {
    const list = get("suggestions");
    if (currentOptions.length === 0) {
        list.innerHTML = `<li class="none">No albums found</li>`;
        list.hidden = false;
        return;
    }
    let html = "";
    for (let i = 0; i < currentOptions.length; i++) {
        const album = currentOptions[i];
        let classes = "";
        if (i === highlighted)
            classes += " highlighted";
        if (inLibrary(album))
            classes += " owned";
        const note = inLibrary(album) ? " - in your library" : "";
        html += `<li class="${classes}" data-index="${i}">${safe(labelFor(album))} <span class="small-text">(${album.year}${note})</span></li>`;
    }
    list.innerHTML = html;
    list.hidden = false;
}
async function handleSearch() {
    const box = get("search-box");
    get("search-message").textContent = "";
    const text = box.value.trim();
    if (text === "") {
        hideSuggestions();
        return;
    }
    currentOptions = await searchAlbums(text);
    highlighted = -1;
    showSuggestions();
}
function pickAlbum(album) {
    if (inLibrary(album)) {
        get("search-message").textContent = album.title + " is already in your library.";
        return;
    }
    hideSuggestions();
    askForRating(album);
}
function handleKeys(event) {
    const box = get("search-box");
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (currentOptions.length === 0)
            return;
        event.preventDefault();
        const count = currentOptions.length;
        if (event.key === "ArrowDown") {
            highlighted = (highlighted + 1) % count;
        }
        else {
            highlighted = (highlighted - 1 + count) % count;
        }
        showSuggestions();
        return;
    }
    if (event.key === "Escape") {
        hideSuggestions();
        return;
    }
    if (event.key !== "Enter")
        return;
    const typed = box.value.trim().toLowerCase();
    if (typed === "")
        return;
    let choice = currentOptions[highlighted];
    if (!choice) {
        choice = currentOptions.find(a => labelFor(a).toLowerCase() === typed);
    }
    if (choice) {
        pickAlbum(choice);
    }
    else {
        get("search-message").textContent = "Please pick an album from the list.";
    }
}
function handleSuggestionClick(event) {
    const item = event.target.closest("li");
    if (!item || item.dataset.index === undefined)
        return;
    pickAlbum(currentOptions[Number(item.dataset.index)]);
}
function setupSearch() {
    get("search-box").addEventListener("input", handleSearch);
    get("search-box").addEventListener("keydown", handleKeys);
    get("search-box").addEventListener("focus", () => {
        if (get("search-box").value.trim() !== "")
            handleSearch();
    });
    get("suggestions").addEventListener("click", handleSuggestionClick);
    document.addEventListener("click", (event) => {
        if (!event.target.closest("#search-wrapper"))
            hideSuggestions();
    });
}

let recommendCount = 0;
function resetRecommendations() {
    recommendCount = 0;
}
async function showRecommendation() {
    const box = get("similar-box");
    const list = await getRecommendations(library);
    if (library.length === 0) {
        box.innerHTML = `<div class="empty">Add and rate a few albums first, then I can recommend one.</div>`;
        return;
    }
    if (list.length === 0) {
        box.innerHTML = `<div class="empty">No albums left to recommend!</div>`;
        return;
    }
    const pick = list[recommendCount % list.length];
    recommendCount++;
    const sameGenre = library.filter(a => a.genre === pick.genre).length;
    let reason = "Its stats are close to your average taste.";
    if (sameGenre > 0) {
        reason = `You have ${sameGenre} ${pick.genre} albums in your library, and the stats fit.`;
    }
    box.innerHTML = `
    <div class="similar">
      ${coverHTML(pick)}
      <div>
        <div class="small-text">Recommended for you:</div>
        <h3>${safe(pick.title)}</h3>
        <div class="small-text">${safe(pick.artist)} (${pick.year}) - ${safe(pick.genre)}</div>
        <p class="small-text">${safe(reason)}</p>
        ${statsHTML(pick)}
        <button data-action="add-rec" data-id="${pick.id}">Add to library</button>
        <button data-action="recommend">Show another</button>
      </div>
    </div>
  `;
    box.scrollIntoView({ behavior: "smooth", block: "center" });
}

let ratingFor = null;
function askForRating(album) {
    ratingFor = album;
    const box = get("rating-box");
    const buttonText = inLibrary(album) ? "Save rating" : "Add to library";
    box.innerHTML = `
    <div class="rating-panel">
      <label for="rating-input">Rate "${safe(album.title)}" out of 10:</label>
      <input id="rating-input" type="number" min="1" max="10" step="0.5">
      <button id="rating-save">${buttonText}</button>
      <button id="rating-cancel">Cancel</button>
      <div id="rating-error" class="small-text"></div>
    </div>
  `;
    box.hidden = false;
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    get("rating-input").focus();
}
function closeRatingBox() {
    ratingFor = null;
    get("rating-box").hidden = true;
    get("rating-box").innerHTML = "";
}
function saveRating() {
    if (!ratingFor)
        return;
    const album = ratingFor;
    const input = get("rating-input");
    const rating = Number(input.value);
    if (input.value.trim() === "" || isNaN(rating) || rating < 1 || rating > 10) {
        get("rating-error").textContent = "Please type a number from 1 to 10.";
        return;
    }
    const existing = library.find(a => a.id === album.id);
    if (existing) {
        existing.rating = rating;
    }
    else {
        library.push({ ...album, rating: rating, addedAt: Date.now() });
        get("search-box").value = "";
        hideSuggestions();
        get("similar-box").innerHTML = "";
        get("search-message").textContent = "Added " + album.title + "!";
    }
    resetRecommendations();
    closeRatingBox();
    saveLibrary();
    refresh();
}
function setupRatingBox() {
    get("rating-box").addEventListener("click", (event) => {
        const id = event.target.id;
        if (id === "rating-save")
            saveRating();
        if (id === "rating-cancel")
            closeRatingBox();
    });
    get("rating-box").addEventListener("keydown", (event) => {
        if (event.key === "Enter")
            saveRating();
        if (event.key === "Escape")
            closeRatingBox();
    });
}
function handleLibraryClick(event) {
    const target = event.target;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id)
        return;
    const album = library.find(a => a.id === id);
    if (!album)
        return;
    if (action === "rate") {
        askForRating(album);
        return;
    }
    else if (action === "remove") {
        removeFromLibrary(id);
    }
    resetRecommendations();
    saveLibrary();
    refresh();
}
function handleBoxClick(event) {
    const target = event.target;
    const action = target.dataset.action;
    if (action === "recommend") {
        showRecommendation();
    }
    else if (action === "add-rec") {
        const album = allAlbums.find(a => a.id === target.dataset.id);
        if (album)
            askForRating(album);
    }
}
loadLibrary();
refresh();
get("connect-status").textContent = "Searching a hardcoded album list";
setupSearch();
setupRatingBox();
get("connect-btn").addEventListener("click", () => {
    get("connect-status").textContent = connectSpotify();
});
get("recommend-btn").addEventListener("click", showRecommendation);
get("library").addEventListener("click", handleLibraryClick);
get("similar-box").addEventListener("click", handleBoxClick);