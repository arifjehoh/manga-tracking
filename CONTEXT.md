# Manga Tracker

A personal single-user web app for tracking manga series across reading statuses, managing chapters, and organizing with table and kanban views.

## Language

**Manga**:
A series entry representing a specific manga title the user is tracking.
_Related_: Series, comic, graphic novel (all refer to the same thing in this context)

**Status**:
The reading state of a manga: **Reading**, **Backlog**, **Completed**, **Dropped**, or **Hiatus**. Any transition is allowed.
_Avoid_: State, category

**Reading**:
A status indicating the user is actively reading this manga. Only manga with **Reading** status appear in suggested readings.
_Avoid_: In progress, active

**Backlog**:
A status indicating the user plans to read this manga but hasn't started yet.
_Avoid_: Planned, to-read

**Completed**:
A status indicating the user has finished reading this manga. Excluded from suggested readings.
_Avoid_: Finished, done

**Dropped**:
A status indicating the user stopped reading this manga and doesn't plan to resume. Excluded from suggested readings.
_Avoid_: Abandoned, cancelled

**Hiatus**:
A status indicating the user is temporarily pausing this manga (e.g., waiting for new chapters). Excluded from suggested readings.
_Avoid_: Paused, on hold

**Chapter**:
An integer representing the last chapter the user has read. Semantics: "I have read up to chapter N."
_Avoid_: Episode, volume, progress (chapter is precise; these are ambiguous)

**Suggested Reading**:
A manga with **Reading** status that hasn't been updated for at least 1 week. The suggestion is that the user might want to continue reading it.
_Avoid_: Recommendation, reminder

**Image**:
An optional visual representation of the manga cover or artwork. User-uploaded, stored locally in the deployment's data directory. Can be replaced anytime.
_Avoid_: Cover, artwork (too vague; image is precise)

**Manga URL**:
An external link to the manga source (e.g., reader site, MyAnimeList page). Optional. Used for bulk-open features.
_Avoid_: Link, source (too generic; manga URL is specific)

## Relationships

- A **Manga** has exactly one **Status** (one of five states)
- A **Manga** has an optional **Image** (can be null or point to a stored file)
- A **Manga** has an optional **Manga URL** (can be null)
- A **Manga** has a **Chapter** (integer, ≥ 0)
- A **Manga** tracks **Added at** and **Updated at** timestamps

## Example dialogue

> **User:** "I want to restart a manga I dropped five years ago."
> **System:** "No problem. Change its **Status** from **Dropped** to **Reading**, and it'll appear in your reading list."

> **User:** "How do I find manga I haven't touched in a while?"
> **System:** "Check **Suggested Readings**—any **Reading** manga not updated in a week shows up there."

> **User:** "Can I see all my manga in a table, or do I have to use the kanban?"
> **System:** "Both. The table view shows all manga with sorting and filtering. The kanban view lets you drag to change **Status**. Pick whichever works best."

## Flagged ambiguities

None resolved yet. Add as they emerge.
