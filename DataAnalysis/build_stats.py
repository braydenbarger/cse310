#!/usr/bin/env python3
"""Turn the raw Apple Music export into stats.js, which index.html loads.

Run from anywhere:  python3 build_stats.py

Only aggregates (artist, album and song names with listening time) are written.
Nothing identifying in the export (IP, location, device or account IDs) is read
into the output.
"""
import collections
import csv
import datetime as dt
import json
import pathlib
import re
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
EXPORT = HERE / "Apple Music Activity"
HOUR_MS = 3_600_000
TOP_N = 10
MIN_ACTIVE_DAY_MS = 60_000  # a day needs a minute of music to count as active

# The export only holds two real stretches of listening, so those are the filters.
ERAS = {
    "2023": ("Winter 2023–24", dt.date(2023, 11, 1), dt.date(2024, 1, 31)),
    "2026": ("Fall 2026", dt.date(2026, 9, 1), dt.date(2026, 10, 31)),
}

# Apple's end reasons, grouped into what a listener would recognize.
END_GROUPS = {
    "NATURAL_END_OF_TRACK": "Played to the end",
    "TRACK_SKIPPED_FORWARDS": "Skipped ahead",
    "TRACK_SKIPPED_BACKWARDS": "Skipped back",
    "MANUALLY_SELECTED_PLAYBACK_OF_A_DIFF_ITEM": "Picked something else",
    "PLAYBACK_MANUALLY_PAUSED": "Paused",
}


def read_csv(name):
    with open(EXPORT / name, encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)


def read_zipped_json(name):
    with zipfile.ZipFile(EXPORT / f"{name}.json.zip") as z:
        return json.loads(z.read(f"{name}.json"))


def normalize(title):
    """Match 'Aces High (2015 Remaster)' to 'Aces High'."""
    title = re.sub(r"\s*[(\[].*?[)\]]", "", title)
    title = re.sub(r"\s+-\s+.*remaster.*$", "", title, flags=re.I)
    return title.strip().casefold()


def load_plays():
    """Audio PLAY_END events: the only rows holding a real listening duration."""
    csv.field_size_limit(10**8)
    plays, seen = [], set()
    for row in read_csv("Apple Music Play Activity.csv"):
        if row["Event Type"] != "PLAY_END" or row["Media Type"] != "AUDIO":
            continue
        if row["Event ID"] in seen:
            continue
        seen.add(row["Event ID"])
        ms = int(row["Play Duration Milliseconds"] or 0)
        stamp = row["Event Start Timestamp"] or row["Event Timestamp"]
        if ms <= 0 or not stamp:
            continue
        utc = dt.datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        offset = dt.timedelta(seconds=int(row["UTC Offset In Seconds"] or 0))
        plays.append({
            "when": utc + offset,  # the listener's local time
            "ms": ms,
            "song": row["Song Name"],
            "album": row["Album Name"],
            "end": row["End Reason Type"],
            "shuffle": row["Shuffle Play"] == "SHUFFLE_ON",
            "offline": row["Offline"] == "true",
        })
    return plays


def add_artists(plays):
    """The play log has no artist column, so join one in from the other files."""
    by_song_album, by_day, by_song, known = {}, collections.defaultdict(set), {}, set()

    def remember(song, artist, weight=1):
        by_song.setdefault(normalize(song), collections.Counter())[artist] += weight

    for track in read_zipped_json("Apple Music Library Tracks"):
        if track.get("Artist") and track.get("Title"):
            by_song_album[(track["Title"], track.get("Album", ""))] = track["Artist"]
            remember(track["Title"], track["Artist"])
    for row in read_csv("Apple Music - Play History Daily Tracks.csv"):
        if " - " in row["Track Description"]:
            artist, song = row["Track Description"].split(" - ", 1)
            by_day[(row["Date Played"], normalize(song))].add(artist)
            remember(song, artist, int(row["Play Duration Milliseconds"]))
    for row in read_csv("Apple Music - Track Play History.csv"):
        if " - " in row["Track Name"]:
            artist, song = row["Track Name"].split(" - ", 1)
            remember(song, artist)

    known.update(a["Artist Name"] for a in read_zipped_json("Apple Music Library Artists"))
    known.update(r["Content"] for r in read_csv("Apple Music - Top Content.csv"))
    known.update(r["Item Description"] for r in read_csv("Apple Music - Favorites.csv"))

    # First pass: matches specific enough to trust on their own.
    album_artists = collections.defaultdict(collections.Counter)
    pair_artist = {}
    for play in plays:
        day_match = by_day.get((play["when"].strftime("%Y%m%d"), normalize(play["song"])), ())
        if (play["song"], play["album"]) in by_song_album:
            play["artist"] = by_song_album[(play["song"], play["album"])]
        elif len(day_match) == 1:
            play["artist"] = next(iter(day_match))
        else:
            play["artist"] = None
            continue
        pair_artist[(play["song"], play["album"])] = play["artist"]
        if play["album"]:
            album_artists[play["album"]][play["artist"]] += play["ms"]

    # Second pass: fill the rest from what the first pass learned.
    for play in plays:
        if play["artist"]:
            continue
        candidates = by_song.get(normalize(play["song"]), collections.Counter())
        album = album_artists.get(play["album"], collections.Counter())
        album_top = album.most_common(1)[0] if album else None
        if (play["song"], play["album"]) in pair_artist:
            play["artist"] = pair_artist[(play["song"], play["album"])]
        elif len(candidates) == 1:
            play["artist"] = next(iter(candidates))
        elif album_top and album_top[1] / sum(album.values()) >= 0.6:
            play["artist"] = album_top[0]
        elif candidates:
            play["artist"] = candidates.most_common(1)[0][0]

    for play in plays:
        if play["artist"]:
            play["artist"] = lead_artist(play["artist"], known)
    return add_genres(plays, known)


def add_genres(plays, known):
    """Genre lives only in the library: match by song and album, else the artist's usual genre."""
    by_pair, by_artist = {}, collections.defaultdict(collections.Counter)
    for track in read_zipped_json("Apple Music Library Tracks"):
        if not track.get("Genre"):
            continue
        by_pair[(track.get("Title"), track.get("Album", ""))] = track["Genre"]
        if track.get("Artist"):
            by_artist[lead_artist(track["Artist"], known)][track["Genre"]] += 1
    for play in plays:
        genre = by_pair.get((play["song"], play["album"]))
        if not genre and play["artist"] in by_artist:
            genre = by_artist[play["artist"]].most_common(1)[0][0]
        play["genre"] = genre
    return plays


def lead_artist(name, known):
    """'Kanye West & Lil Durk' credits Kanye West; 'Tyler, The Creator' stays whole."""
    for cut in re.finditer(r",\s|\s&\s|\sx\s", name):
        if name[:cut.start()] in known:
            return name[:cut.start()]
    return name


def hours(ms):
    return round(ms / HOUR_MS, 2)


def top(counter, n=TOP_N):
    return counter.most_common(n)


def longest_streak(days):
    best = run = 0
    previous = None
    for day in sorted(days):
        run = run + 1 if previous and (day - previous).days == 1 else 1
        best = max(best, run)
        previous = day
    return best


def summarize(plays):
    total = sum(p["ms"] for p in plays)
    by_day, artists, songs, albums, genres = (collections.Counter() for _ in range(5))
    ends = collections.Counter()
    grid = [[0] * 24 for _ in range(7)]  # Monday first
    album_artist = collections.defaultdict(collections.Counter)

    for p in plays:
        by_day[p["when"].date()] += p["ms"]
        grid[p["when"].weekday()][p["when"].hour] += p["ms"]
        songs[(p["song"], p["artist"] or "")] += p["ms"]
        if p["artist"]:
            artists[p["artist"]] += p["ms"]
        if p["genre"]:
            genres[p["genre"]] += p["ms"]
        if p["album"]:
            albums[p["album"]] += p["ms"]
            if p["artist"]:
                album_artist[p["album"]][p["artist"]] += p["ms"]
        if p["end"] in END_GROUPS:
            ends[END_GROUPS[p["end"]]] += 1

    active = {d: ms for d, ms in by_day.items() if ms >= MIN_ACTIVE_DAY_MS}
    peak_day, peak_ms = max(active.items(), key=lambda kv: kv[1])
    attributed = sum(artists.values())

    return {
        "hours": hours(total),
        "activeDays": len(active),
        "hoursPerDay": round(hours(total) / len(active), 2),
        "streak": longest_streak(active),
        "peakDay": {"date": peak_day.isoformat(), "hours": hours(peak_ms)},
        "songCount": len(songs),
        "artistCount": len(artists),
        "attributedShare": round(attributed / total, 3),
        "shuffleShare": round(sum(p["ms"] for p in plays if p["shuffle"]) / total, 3),
        "offlineShare": round(sum(p["ms"] for p in plays if p["offline"]) / total, 3),
        "artists": [{"name": a, "hours": hours(ms)} for a, ms in top(artists)],
        "songs": [{"name": s, "artist": a, "hours": hours(ms)} for (s, a), ms in top(songs)],
        "albums": [{
            "name": name,
            "artist": album_artist[name].most_common(1)[0][0] if album_artist[name] else "",
            "hours": hours(ms),
        } for name, ms in top(albums)],
        "genres": [{"name": g, "hours": hours(ms)} for g, ms in top(genres)],
        "genreShare": round(sum(genres.values()) / total, 3),
        "ends": [{"name": name, "count": n} for name, n in ends.most_common()],
        "grid": [[hours(ms) for ms in row] for row in grid],
    }


def daily_series(plays):
    """Every day from first play to last, so a quiet day shows as an empty slot."""
    by_day = collections.Counter()
    for p in plays:
        by_day[p["when"].date()] += p["ms"]
    start, end = min(by_day), max(by_day)
    return [{
        "date": (start + dt.timedelta(n)).isoformat(),
        "hours": hours(by_day[start + dt.timedelta(n)]),
    } for n in range((end - start).days + 1)]


def main():
    plays = add_artists(load_plays())
    in_era = lambda p, s, e: s <= p["when"].date() <= e

    views = {"all": {"label": "All time", **summarize(plays), "panels": []}}
    for key, (label, start, end) in ERAS.items():
        subset = [p for p in plays if in_era(p, start, end)]
        panel = {"label": label, "days": daily_series(subset)}
        views[key] = {"label": label, **summarize(subset), "panels": [panel]}
        views["all"]["panels"].append(panel)

    outside = [p for p in plays if not any(in_era(p, s, e) for _, s, e in ERAS.values())]
    stats = {
        "views": views,
        "outsideHours": hours(sum(p["ms"] for p in outside)),
        "firstDate": min(p["when"] for p in plays).date().isoformat(),
        "lastDate": max(p["when"] for p in plays).date().isoformat(),
        "favorites": sorted(r["Item Description"] for r in read_csv("Apple Music - Favorites.csv")
                            if r["Favorite Type"] == "Artist" and r["Preference"] == "LIKE"),
    }

    body = json.dumps(stats, ensure_ascii=False, indent=1)
    (HERE / "stats.js").write_text(f"window.STATS = {body};\n", encoding="utf-8")
    print(f"Wrote stats.js: {len(plays)} plays, {views['all']['hours']} hours")


if __name__ == "__main__":
    main()
