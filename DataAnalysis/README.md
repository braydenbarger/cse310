# Listening Stats

A small page that shows off my Apple Music listening history.

## Run it

Open `index.html` in a browser. There's nothing to install or serve.

## Update the data

Put a new Apple privacy export in `Apple Music Activity/`, then run:

```
python3 build_stats.py
```

This rewrites `stats.js`, which is all the page reads. It uses only the Python
standard library. If the new export covers different dates, update `ERAS` at the
top of the script.

## Privacy

The raw export includes IP-based location and account and device IDs, so
`Apple Music Activity/` is git-ignored. `stats.js` holds only artist, album and
song names with listening totals.
