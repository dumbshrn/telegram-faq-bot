# Vivi Music — Knowledge Base

This file is what the bot answers questions from. Edit it anytime —
changes take effect on the next question, no restart needed.

---

## Quick Index (match the symptom, then read that section)

- Song won't play / stuck / streaming errors → **Playback Issues**
- Too quiet, no sound, second volume slider → **Volume & Audio**
- Auto-skipping, repeat stuck, crossfade glitches → **Skipping, Repeat & Shuffle**
- Can't reorder queue, "add to queue" does nothing → **Queue & Playlists**
- Downloads stuck/cancel themselves, missing cover art offline → **Downloads**
- Wrong/missing/out-of-sync lyrics, laggy or glitchy lyrics, weird
  characters in lyrics → **Lyrics**
- Black/white screen, app crashes, freezes, slow to open → **Black / White Screen, Crashes & Freezes**
- Losing liked songs/stats after update or clearing data → **Backups**
- Spotify playlists not importing correctly → **Importing Spotify Playlists**
- App unavailable in your country, VPN issues → **Region & VPN**
- Home screen recommendations not updating → **Home Screen & Recommendations**
- Animated album art not showing / wrong / cropped → **Canvas**
- Apple Music-style player, player designs, hiding the quality badge → **Apple Music-style UI**
- Battery drain, hot phone, notifications, Android Auto → **Battery, Background & Notifications**
- Login issues, token expired, screenshot blocking → **Account & Login**
- How to report a bug / send logs → **Reporting bugs & logs**
- "Can it do X" (local files, FLAC, iOS, cast, PiP, etc.) → **Features NOT available**
- Who made the app, who are the admins → **Developer & Admins**

---

## Group Rules

1. No admin tagging unless necessary.
2. No external app or group promotion links.
3. No gore, violent, or disturbing content.
4. Keep language respectful and clean.
5. Crash logs only in #crash-logs channel.
6. No spam or repeated messages.
7. Follow admin decisions.
8. Not all feature requests can be implemented.

Enforcement: violations may result in warnings, mute, or removal.
Severe cases may lead to immediate action. Please use correct
channels/topics.

Extra rules enforced by the bot:
- Helpdesk messages must be in English (translate first).
- Only Vivi-related topics here — discussing other music apps earns
  a warning; don't post crash logs outside #crash-logs.
- Feature requests / suggestions are currently CLOSED (see pinned
  message in General). Bug reports are still welcome.
- Flooding gets you temporarily muted by the bot.

---

## Developer & Admins

- The developer of Vivi Music is Vividh P Ashokan.
- Admins of this group:
  - Sharon: the ultimate GOAT.
  - CLASSIC GENIUS: another cool GOAT admin.
  - shadowking: another GOAT admin.
  - Ansuman: an okay admin.
- Reminder: don't tag admins unless it's necessary (group rule 1).

## Links

- Report a bug: https://github.com/vivizzz007/vivi-music/issues (most
  bug reports happen directly in the group though, not on GitHub)
- Recent commits: https://github.com/vivizzz007/vivi-music/commits/main/
- Latest official release: https://github.com/vivizzz007/vivi-music/releases/latest
- Official website: https://vivimusic.mkmdevilmi.workers.dev/
- Support development (donate): https://vivimusic.mkmdevilmi.workers.dev/sponsor
- Desktop edition (Windows/Mac/Linux) Telegram channel: https://t.me/vivimusicde
- Logcat Reader (for sending logs): https://play.google.com/store/apps/details?id=com.dp.logcatapp

Beware of fake sites: vivimusic.org and vivimusic.net are NOT
affiliated with the project and may bundle malware. Only use the
official website, GitHub releases, and the official Telegram topics.

---

## Nightly / Beta Builds
### Getting the nightly / beta build (Gitapks, in-app beta updates)

If the Automatic Nightly Git Build is down:
1. Go to the Gitapks channel
2. Download the latest compiled APK

If the Nightly Git Builder is available:
- Inside the app: Settings > System update > turn on Beta Updates >
  tap System Update to check for updates
- Or via the website: visit https://vivimusic.mkmdevilmi.workers.dev/,
  click Download, then "Download Beta"

Notes:
- Check the pinned comments to see if the nightly build is down.
- "Nightly" = per-commit beta builds (version number often doesn't
  change between them, so the updater may prompt repeatedly — normal).
- Prefer the GMS variant; the FOSS build doesn't get in-app beta
  updates.
### Install problem: “App not installed / package invalid”, wrong APK size
- Install problem: "App not installed / package invalid" → uninstall
  the existing app first, then install (or delete the previously
  downloaded update APK and download again). If an APK is ~31MB when
  it should be ~30MB or much larger, the download is wrong.

---

## Playback Issues (song won't play / stuck / errors)

### Song won't play / stuck / streaming errors: troubleshooting steps
Troubleshooting steps, in order:
1. Force stop the app fully (close from recents too) and try again
2. Settings > Content > Network IP version: enable IPv4 OR IPv6.
   This is NOT the proxy address field — just turn the proxy toggle
   ON and leave the address empty. ("Failed to parse proxy URL" =
   you pasted an address; remove it, toggle alone is enough.)
   IPv4 is usually the better choice; on WiFi try IPv6 if IPv4 fails.
3. Switch network: try mobile data instead of WiFi (and vice versa).
   Turn off ad blockers / private DNS — one user's ad blocker was
   the cause. If you use a VPN, reconnect it (IPs get blacklisted;
   try another server).
4. Log out and log back in (refreshes the login token; fixes cases
   where playback dies after ~10-12 hours or after errors pile up).
5. Clear cache; if still broken, clear app DATA from phone Settings —
   do NOT restore an old backup — and test signed out first, then
   sign your account back in.
6. Still broken? Capture a log (see "Reporting bugs & logs") and post
   it in the group — logs are what actually gets issues fixed.

### Error 2000 / IO_UNSPECIFIED / “Playback failed: unknown error”
What the errors mean:
- Error 2000 / IO_UNSPECIFIED / "Playback failed: unknown error" =
  a playback/streaming failure. Run the playback fixing steps above
  first: force stop → IPv4/IPv6 with proxy enabled → switch network
  → logout/login → clear cache (then clear data without old backup
  if needed). If it still fails on every song while others are
  unaffected, it's a YouTube API-side issue on your account/network —
  capture a log and report it.
### “LOGIN_REQUIRED: confirm you’re not a bot” and slow first song
- "LOGIN_REQUIRED: confirm you're not a bot" in logs = YouTube bot
  detection; the app requests a new visitor/streaming ID and the
  first song may take ~20 seconds to start, then it's fast again.
### Age-restricted / 18+ / kids' songs won't play
- Age-restricted / 18+ songs: YouTube Music clients can't show the
  age-confirmation dialog, so these generally can't play — even
  logged in with an adult account. Kids' content is often blocked
  the same way. If the same track exists on JioSaavn, enabling the
  JioSaavn source (beta) can sometimes play it.
### Premium-only tracks, missing albums, podcasts/video entries won't play
- YT-Premium-only tracks need Premium on the linked Google account;
  otherwise unplayable.
- A whole album missing / "song not available" = it isn't on YouTube
  in your region (or was removed). Premium doesn't unlock that;
  nothing the app can do.
- Podcast episodes and some video entries often fail to play
  (YouTube side).
### Works signed out but not signed in (or vice versa)
- Works signed out but not signed in (or vice versa) → possibly an
  account-related variable (unconfirmed — try the numbered
  troubleshooting steps above first, and try logging out or using
  the app signed out as one thing to test): log out, or use the app
  signed out (your library is copied locally; you just can't push
  new songs to YT Music).
### Country without YouTube Music (VPN) / roaming blocks playback
- Country without YouTube Music (e.g. Russia) → a VPN is required;
  the devs don't officially support VPNs. Roaming without a SIM can
  also make YouTube flag requests and block playback.
### Sudden mass errors or false age restriction on songs that used to play
- Sudden "false age restriction" or mass errors on songs that used
  to play = usually a temporary YouTube outage/change, not your
  account.
### Only downloaded songs play / uploaded songs don't play
- Only downloaded songs play while online songs fail → same
  troubleshooting as above (see the #playfix note steps).
- Songs from your own YT uploads ("uploaded songs") had a long
  period of not playing (account/login related) — this has since
  been fixed server-side and should no longer be an issue.

---

## Volume & Audio

### Quieter than other players / second volume slider
- Quieter than other players: the player has a SECOND volume slider
  inside the 3-dot menu (song-level). Set it to 100%. Also turn OFF
  audio normalisation (Settings > Player & Audio).
### Song plays but there is no sound
- Song shows as playing but NO sound → open the 3-dot menu and raise
  the in-app volume slider (it can get stuck at 0). Lowering and
  re-raising it always fixes it.
### Music stops when another app plays audio or app goes to background
- App pauses when another app plays audio (navigation, videos), or
  music stops when the app goes to the background → set the app's
  background activity / battery to Unrestricted in phone Settings.

---

## Skipping, Repeat & Shuffle

### Parts of a song auto-skip (SponsorBlock, skip silence)
- Parts of a song auto-skip → turn OFF SponsorBlock (Settings >
  Player & Audio). Also check the "skip silence" option — both can
  cause skipping, and SponsorBlock can still skip even when skip
  silence is off.
### Crossfade bugs (repeats start, cuts endings, reshuffles)
- Crossfade is a BETA feature with known bugs: it can repeat the
  first seconds of a song, cut off endings, skip before the end,
  make shuffle reshuffle, and glitch the previous-track button.
  Workaround: turn Crossfade off. (Shuffle reshuffling was also
  triggered by using "add to queue".)
### One song repeats forever (repeat-one)
- One song plays forever on repeat → check the repeat toggle in the
  player (repeat-one mode).
### Playlist ends and playback stops (infinite queue)
- A playlist ends and playback stops → normal behavior unless you
  enable the infinite queue / play-similar settings (those settings
  are sometimes not honored — reported).

---

## Queue & Playlists

### Can't reorder or delete queue items (lock icon)
- Reordering/deleting queue items: tap the LOCK icon at the top of
  the queue first to unlock it.
### “Add to queue” does nothing (swipe gestures, play next)
- Swipe gestures: swipe RIGHT on a song = play next; swipe LEFT =
  add to queue (it goes to the BOTTOM of the queue — this is why
  "add to queue" seems to do nothing / plays something else).
  Swipe-to-add can be toggled in Settings > Appearance > Misc.
### Liked count wrong / sync failed / playlists missing (force sync)
- Liked count jumps / sync failed / playlists missing → syncing
  with YT Music is automatic now, and there's a Force sync button in
  Settings > Account. Still stuck → log out and back in, and check
  the same content in YouTube Music itself.
### Export a playlist to CSV
- To export a playlist (CSV): open the playlist, tap the three-dot
  menu, tap Export.
### Spotify-exclusive songs can't be imported
- Spotify-exclusive songs can't be imported — they don't exist on
  YT Music, so Vivi can't play or import them.

---

## Downloads

### Downloads cancel themselves / stuck / partial count
- Downloads cancel themselves / stuck loading / partial count
  (e.g. 150 of 238) → grant background activity permission, battery
  Unrestricted, don't minimize the app while downloading; some
  custom-OS security features block downloads. Retry the missing
  ones.
### Old downloads need internet again or fail
- Downloaded songs from an OLD app version start needing internet
  again or fail → delete those downloads and re-download them.
### JioSaavn downloads demand internet
- JioSaavn-downloaded songs may demand internet even when
  downloaded (JioSaavn is beta).
### Cover art missing offline / low-res covers
- Cover art disappears when offline → artwork isn't cached by
  default; keep the image cache enabled. Low-res covers = turn OFF
  Data Saver (it also affects artwork on WiFi).
### Can't export downloads as MP3; downloads deleted on clear data
- Downloads are app-internal cache — there is NO way to export them
  as MP3/files to your phone. Downloads are deleted when you clear
  app data.

---

## Lyrics
### Lyric providers and animation styles (which to use)

**Two separate things can go wrong here — text/timing (provider) or
how it's drawn on screen (animation style). Match the symptom below.**

Lyric providers (where the words/timing come from):
- Word-sync capable: BetterLyrics, YouLyPlus, PaxSenix, Musixmatch
- Line-sync fallback (used when no word-sync provider has it):
  LrcLib, KuGou, YouTube Subtitle, YouTube Music
- SimpMusic was REMOVED as a provider (restricted in India, fetches
  were failing) — don't suggest it.

Lyric animation styles (Settings > Appearance > Lyrics style). Full
list: None, Fade, Glow, Slide, Karaoke, Apple Music, Apple Music V2
(Letter by Letter), Vivimusic (Fluid), Lyrics V2 (Fluid), MetroLyrics.
Most stable / recommended: **Vivimusic (Fluid)** and **MetroLyrics**.

### Lyrics laggy / glitchy / stutter
- Lyrics feel laggy, glitchy, or stutter while playing → switch the
  animation style to Vivimusic (Fluid) or MetroLyrics — both are the
  most stable for smooth rendering. Switching applies immediately, no
  refetch needed. If it's still not smooth, also try a different
  lyrics provider (song-dependent).
### Wrong / missing / out-of-sync lyrics (change provider)
- Wrong / missing / totally out-of-sync lyrics → try a different
  lyrics provider from the list above; if a specific provider isn't
  fetching anything, it's usually a temporary outage on that
  provider's side — retry later or switch providers.
### “Lyrics not found” — refetch
- Auto-fetch says "lyrics not found" → tap refetch manually.
### Lyrics out of sync because of the video version
- Lyrics out of sync → you may be playing the VIDEO version while
  the lyrics match the audio release. Try a different provider, or
  switch to static (non-synced) lyrics.
### Lyrics size in the Apple v17 player
- Lyrics size in the Apple v17 player is adjustable/resizable — it's
  not stuck at a fixed size.
### AI lyrics translation setup and errors
- AI lyrics translation setup: OpenRouter provider = key from
  openrouter.ai (missing key → auth error); Gemini provider = valid
  Google AI Studio key AND correct model, otherwise HTTP 404.
  Translation can crash on songs where the model adds trailing text
  (reported). Language mis-translation (e.g. Slovak→Slovenian)
  reported.

---

## Black / White Screen, Crashes & Freezes

### Black / white screen on open (after update or from 5.0.3)
- Black or white screen on open (usually after an update, or coming
  from 5.0.3) → remove from recents → force stop → clear cache →
  clear app DATA from phone Settings. Still broken → clean install
  (uninstall, then install fresh). Updating FROM 5.0.3 in particular
  requires clearing data.
### Crash right after updating
- Crash right after updating → clear app data + cache.
### Crashes when closing the app / in background (OS killing it)
- Crashes when closing the app / playing in background → the OS is
  killing it mid-task: set battery optimization to Unrestricted,
  allow background activity, turn OFF "kill app when removed from
  recents" (Settings > Player & Audio, bottom), and lock Vivi in
  your recents list.
### Music stops when you swipe the app away (Clear Music on Task Clear)
- App pauses / music stops when you swipe the app away → that's the
  "Clear Music on Task Clear" toggle (Settings > Player & Audio) —
  enable it to stop music on swipe, disable it to keep music alive.
### Lock-screen notification keeps reappearing
- Lock-screen / media notification keeps reappearing after swipe →
  OS quirk (BBK/OnePlus/Realme/HyperOS don't always recognize Vivi
  as a music player): restart, battery = don't optimize, and an OS
  update fixed it for some.
### Widget can't restart playback
- Widget can't restart playback after the app was killed → OS
  limitation; open the app instead. Widgets are fixed-size and have
  limited controls (reported).
### Slow first song after an error
- Slow first song after an error = the app fetching a new visitor
  ID; subsequent songs are fast again.

---

## Backups

### Back up before updating or clearing data; auto-backup
- ALWAYS back up before updating or clearing data: Settings > Backup
  and restore. Backups store liked songs, stats and settings —
  NOT downloads (those are re-downloaded).
- Enable auto-backup. Clearing data with no backup = likes/stats
  gone permanently (unless YT-synced).
### Backups from 5.0.3 don't work on 6.x
- Backups from 5.0.3 are NOT compatible with 6.x — restoring one
  breaks the app. Even updating directly from 5.0.3 causes problems
  until data is cleared.
### Corrupted backup breaks the app
- A corrupted backup has no fix — don't restore it (it breaks
  Spotify import, library and playback). Test with a fresh login
  first, apply the backup afterwards.

---

## Importing Spotify Playlists

### How to import Spotify playlists (and sync to YouTube Music)
1. Go to Settings > Backup and restore
2. Select Spotify, then select all the playlists you want to import
3. To also sync those playlists to YouTube Music: after importing,
   hold on a specific playlist, and you'll see an option to "sync to
   YouTube Music" — tap it. Your playlist will then be available in
   the cloud too, and any new songs you add to that playlist will
   keep syncing.

### Spotify import problems (fewer songs, “Unknown” titles)
Troubleshooting:
- Fewer songs than the source playlist → Spotify-exclusive tracks
  can't be imported (not on YT Music). Check the same playlist in
  YTM.
- "Unknown" titles in imported playlists → reported.

---

## Region & VPN

### YouTube Music not available in your country (VPN)
- YouTube Music not available in your country → VPN required; no
  other fix. The devs don't officially provide/support VPNs.
### VPN connected but nothing plays
- VPN connected but nothing plays → reconnect/switch server (your
  IP may be blacklisted), and make sure the network IP version
  setting is enabled.
### Region setting breaks playback
- Region setting in Settings > Content can break playback → leave
  it on "System Default" (some users set a different region for
  specific content).
### “Hide video songs” toggle causes errors
- "Hide video songs" toggle: if songs error after flipping it,
  toggle it back.

---

## Home Screen & Recommendations

### Home sections / Quick Picks not updating
- Quick Picks / Remixes / home sections only refresh once you
  actually PLAY songs from them; guest (signed-out) mode barely
  changes — sign in with a Google account for changing
  recommendations.
### Can't remove home sections
- No way to remove home sections yet (Forgotten Classics, Daily
  Discovery, community playlists, speed dial) — not customizable.
  "Randomize home screen order" can be turned off in Content
  settings.
### Recommendations don't match YouTube Music
- Recommendations/queues don't match official YT Music exactly —
  partially fixed; logging out of the YT Music account and back in
  helped with wrong-genre autoplay.
### Listening stats and recap are local
- Listening stats/recap inside Vivi are LOCAL — official YouTube
  Music monthly/yearly recap won't count songs played in Vivi.

---

## Canvas (animated album art)

### Canvas requirements (Android 12+)
- Requires Android 12+ (blur/blur-based effects too).
### Canvas not showing for a song (album matching)
- The song's album must actually HAVE a canvas (check Apple Music).
  It's matched by album name across YT/Apple/Tidal — so canvas
  usually works when you play FROM the album or home, but NOT when
  you search-and-play a single song (null album name), and breaks
  with edition/accent mismatches in album titles.
### Canvas data usage and offline
- Needs to be enabled in settings; heavy on data (~10-15 MB per
  song — use Data Saver to limit usage).
- Not available offline; covers also vanish offline if the image
  cache is off.
### Cropped / stretched canvas and player-background conflicts
- Cropped/stretched/mixed canvas on some songs = known issues
  (dynamic positioning is hard server-side) — report the song link.
- Canvas may not show with certain player background styles (e.g.
  Apple Music background) → try another background style / other
  player.

---

## Apple Music-style UI

### Player designs: Apple Player, Apple Music v17, m3e; quality badge
- There are 3 player designs: Settings > Appearance > Player >
  "Apple Player", "Apple Music v17", and "m3e player". Selecting
  an Apple design disables the newer (m3e) player design.
- Apple Player (V1) also removes the audio quality badge if
  that's bothering you.
- RECOMMENDATION: Apple Player is the way to go and the group's
  pick. If someone asks which player design is best / which to use,
  recommend Apple Player (Settings > Appearance > Player > "Apple
  Player"). m3e is the newer design and has extras like the comments
  button, but do NOT call m3e the best or the one to switch to.
### Apple Music v17 limitations
- v17 limitations (by design / beta): no landscape/tablet layout
  (it glitches and switches orientation), no cast button, no
  no extra player controls, lyrics size not
  adjustable, song title truncates with "…" instead of scrolling
  (to be fixed), small delay in word-by-word lyrics, thumbnail can
  look compressed, and a known small-box→large-box transition
  glitch.
### Comments button and hiding the volume slider
- Comments button in the queue/player exists only in the m3e
  (new) player design.
- The in-app volume slider can't be hidden (request rejected for
  now).
### Background overlaps status bar / blur needs Android 12+
- Background overlaps the status bar with the Apple Music background
  → switch player background style (Live mesh / Glow animated) or
  adjust display density.
- Blur effect requires Android 12+; on Android 10/11 it simply
  doesn't show (device-side, not a bug).
### Hide the notification bar over lyrics
- Hide the notification bar over lyrics → Settings > Appearance >
  Player > Apple Music v17.

---

## Battery, Background & Notifications

### Battery drain / hot phone (canvas, EQ, v17 blur)
- Battery drain / hot phone → canvas, EQ and other visual effects
  cost battery; disable canvas or EQ if you don't need them. The v17
  player's blur effect can overload the GPU on some phones (frame
  drops) — there's currently no toggle to turn blur off specifically,
  switching away from the v17 player is the only way to avoid it.
### Music keeps playing after closing the app
- Music keeps playing after closing the app → enable "Clear Music
  on Task Clear" (Settings > Player & Audio) and/or close the
  notification first.
### Reliable background / Bluetooth / Android Auto playback
- For reliable background/Bluetooth/Android Auto playback: battery
  optimization = Unrestricted, background activity allowed.
### Annoying notifications / update prompts
- Annoying notifications → Settings > Notification settings: turn
  off "taste based" notifications and artist-release alerts. The
  updater's repeating notification is spammed progress updates —
  turn off download notifications if it bothers you. The "pay to
  update" prompt is an easter egg — updates are free.
### Android Auto problems
- Android Auto is supported; if it fails, disconnect any Cast
  session first (leftover cast mode breaks it). "Source Error" on AA
  → report with logs. Lyrics are not shown on Android Auto.

---

## Account & Login

### Is signing in required? Signed-out mode
- Signing in is OPTIONAL: streaming works signed out. Login enables
  library sync and better streams. Your library is copied locally
  when signed out.
### Token expired — playback/download dies after long use
- Token expires → playback/download dies after long use → log out
  and log back in.
### False “age restricted” errors tied to account
- False "age restricted" errors on songs that used to play = usually
  a temporary outage; if tied to your account, a clean start (clear
  data, no old backup, fresh login) fixed cases.
### Screenshots / screen recording blocked
- Screenshots/screen recording can be blocked by the app — there is
  a toggle in the app settings that allows them.
### GitHub star linking and Discord safety
- GitHub star linking (in-app) only verifies you starred the repo —
  it can't touch your account. Discord integration is unrelated to
  account security (a reported hack was unrelated to Vivi).
### Discord rich presence flaky
- Discord rich presence works for some and not others (flaky,
  reported).

---

## Reporting bugs & logs

### How to capture and send logs (Logcat Reader)
1. Install "Logcat Reader" (Play Store:
   https://play.google.com/store/apps/details?id=com.dp.logcatapp)
   or logfox.
2. Grant its permissions, start recording, reproduce the problem,
   stop, and share the .txt file.
3. FILTER to Vivi only (package com.vivi.vivimusic) — never post
   full system logs. The in-app log/logcat button also works.
4. Still can't get logs? Ask in the group for help.
5. App crash files are saved as vivimusic_crash_*.txt — attach them.
6. Post logs in the group / #crash-logs topic — not in General.

### Group bot commands: #playfix, #nightly, /get …
Useful group bot notes: type #playfix, #nightly, #website,
#applemusicui, #spotify, #vividesktop, #bug, #help, #commits,
#official (or /get notename) to retrieve saved answers.

---

## Features NOT available (quick answers)

### No local files, MP3 export, or lossless/FLAC
- Local file playback / importing local audio: not supported and
  won't be added — Vivi is a streaming client only.
- Exporting downloads to MP3/storage: impossible — downloads are
  protected app cache (ExoPlayer), not files you can open.
- Lossless / FLAC / hi-res: not possible — Vivi is a YT Music
  client (max ~320kbps; an attempt at FLAC was abandoned). YT
  Premium / 774 opus quality is also unsupported.
### iOS, PC, Android TV, Wear OS
- iOS version: none. PC: use the Desktop Edition channel
  (https://t.me/vivimusicde) or an emulator.
- Android TV / Google TV / Wear OS: not tested/unsupported.
### Cast and picture-in-picture
- Cast: only in the normal player (not with the Apple Music
  background/style); some users report cast discovering no devices
  at all (reported).
- Picture-in-picture: not available.
### Playlist sharing and other declined/planned features
- Playlists sharing to others / export single playlist: not
  working/available (reported gap).
- Home section removal, custom fonts, settings search, hide volume
  slider: planned or declined; suggestions are currently closed.
### Listen Together
- Listen Together: create a room and share the code/link; guests
  need host approval. Bugs reported: listeners only hear on song
  change, host can't hear guest side — known issues.
### Spotify scrobbles / stats
- Spotify scrobbles/stats: Vivi's stats are local and only count
  songs played in Vivi.

---

## Other apps

This group is for Vivi Music only — please don't discuss or promote
other music streaming apps here (this includes but isn't limited to
Harmony Music, Archive Tune, Metro Fuse, Metrolist, SimpMusic, Echo,
OpenTune, ConvX).
