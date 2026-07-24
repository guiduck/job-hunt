# Extension UI Contract: Full-time LinkedIn Jobs External Search

## Search Page Structure

The Full-time extension Search page has two top-level tabs:

- `External jobs`
- `LinkedIn posts`

The active tab scopes visible controls and actions. Controls from one tab must not appear active for another search type.

## External Jobs Tab

Contains:

- Existing career-page external search controls.
- Shared curated source checkboxes.
- New LinkedIn Jobs external search controls:
  - Search text / saved keyword reuse.
  - Assisted LinkedIn Jobs checkbox.
  - Date posted selector for classic mode: any time, last month, last week, last 24 hours.
  - Sort selector for classic mode: relevant, most recent.
  - Max pages input default 15, maximum 30.
  - Start button.
  - Latest/active run diagnostics.

### Assisted Mode Behavior

When assisted mode is enabled:

- Date and sort controls are disabled unless a reliable assisted filtering path is implemented.
- The UI shows a short note that LinkedIn may use profile/preferences and that date/sort may not apply.
- The run still uses the same source allowlist, Easy Apply skip rules, dedupe, and diagnostics.

### No Keywords Behavior

When search text is empty:

- The UI explains that LinkedIn default/relevant jobs will be browsed.
- Start remains available if at least one curated source is selected and no conflicting active run exists.

## LinkedIn Posts Tab

Contains existing LinkedIn post capture controls and post AI filters.

Must preserve:

- Existing post search text/sort behavior.
- AI filters where already implemented.
- Search History tab behavior.
- Existing run/candidate/opportunity flow for LinkedIn posts.

## Run Lifecycle UI

The LinkedIn Jobs external search start flow:

1. Creates a backend run.
2. Opens or focuses a LinkedIn tab.
3. Tries direct Jobs URL navigation when configured/tested.
4. Falls back to user-like navigation/clicking into Jobs when direct navigation is unreliable.
5. Waits for renderable results.
6. Scrolls and inspects visible job cards.
7. Submits inspected candidates/progress to the backend.
8. Moves through pagination until max pages or no next page.
9. Finalizes the run with terminal diagnostics.

The UI must display safe progress:

- Pages visited.
- Jobs inspected.
- External links found.
- Accepted.
- Skipped Easy Apply.
- Unsupported source.
- Duplicates.
- Failures.
- Navigation method.
- Terminal reason.

## Source Checkbox Contract

- Career-page search and LinkedIn Jobs external search share the same selected curated source keys.
- Source selections persist like existing Search preferences where appropriate.
- If no source is selected, start actions that depend on curated sources are disabled with a clear reason.

## Accepted Opportunity Behavior

Accepted LinkedIn Jobs external opportunities appear in the existing `External applications` lane.

No UI changes may:

- Open multiple external applications at once.
- Create Gmail drafts/send requests.
- Change Email/WhatsApp provider behavior.
- Change Freelance UI behavior.

## Error And Empty States

The UI must show safe terminal states for:

- LinkedIn login required.
- No renderable results.
- Direct URL/geoId navigation failed.
- Jobs click-path navigation failed.
- No next page.
- All jobs were Easy Apply.
- All external links were unsupported sources.
- All accepted-looking links were duplicates.
- LinkedIn DOM changed enough that inspection failed.

## Test Expectations

- Search tabs render the right controls in the right tab.
- LinkedIn post controls remain available and unchanged under `LinkedIn posts`.
- External jobs shows career-page and LinkedIn Jobs actions together.
- Assisted mode disables or explains date/sort.
- Max pages rejects values above 30.
- Diagnostics render terminal reasons without requiring DevTools.
