# fitted Design System

Reference doc for any UI, copy, or marketing work in fitted. When you're about to make a styling decision, this is the source of truth.

## Brand voice

Trusted, sophisticated, luxurious — but not gaudy. Eye-catching without being loud. The aesthetic should feel like the product helps you take your career seriously, not like a hustle-culture app.

What this *isn't*: not LinkedIn-corporate, not Indeed-utilitarian, not Glassdoor-cluttered, not Y-Combinator-scrappy.

## Typography

- **Headings**: Georgia serif. Always.
- **Body**: Sans-serif system stack (Inter or system-ui fallback)
- **Mono / code**: monospace stack only when actually showing code

The Georgia choice is deliberate — most career-tech tools use sans-serif everywhere, so the serif heading is fitted's instant visual differentiator. Don't replace it without a strong reason.

## Color palette

| Role | Hex | Notes |
|------|-----|-------|
| Background | `#f4f2ed` | Warm off-white. Never pure white. |
| Accent (taupe) | `#b8a99a` | Soft, earthy. Use for secondary buttons, dividers, hover states. |
| Navy | `#2f3e5c` | Primary action color, headlines on light backgrounds. |
| ~~Old blue~~ | ~~`#2d5be3`~~ | **Deprecated.** Reads too LinkedIn/Facebook. Replace with navy. |

The palette is intentionally narrow. If you need a fifth color, raise it as a question — don't just pick one.

## Layout primitives

### Dashboard (desktop)

3-column layout: `230px` left rail / `1fr` center / `270px` right rail.

The 230 and 270 are deliberate (even numbers, slight asymmetry that feels intentional). Don't round to 240/280.

### Mobile

Bottom navigation, three tabs: **Tracker | Browse | Profile**. (Saved is *merged into* Tracker as a kanban with soft delete; it is not a standalone tab.)

### Numbers

Catalina prefers even numbers throughout the UI — counts, paddings, grid math, list lengths. When designing a layout that involves arbitrary integers (e.g., "show 7 results" vs "show 8 results"), default to even.

## Component conventions

### Tailor tab (per design ref `fitted_design_1-5.png`)

- HIGH / MEDIUM / LOW priority tags on suggested edits
- Side-by-side **ORIGINAL** vs **TAILORED** view
- **WHY** explanation panel for each change
- Header: `"X edits could raise match X% → Y%"`
- Two CTAs: **Download Resume** + **Generate Cover Letter**

### Match tab

- Three scores displayed: **Overall**, **Personal Fit**, **Likeliness**
- Breakdown bars below each score

### Help Me Stand Out tab

- Numbered tips
- "Why You" paragraph
- Draft email block

## Anti-patterns

Things that creep in when no one is enforcing the system:

- Pure white (`#ffffff`) backgrounds. Always use `#f4f2ed`.
- Sans-serif headings. Use Georgia.
- The deprecated blue `#2d5be3`. Use navy.
- Hustle-bro language: "level up your career," "crush your job hunt," "10x your offers." Cut these on sight.
- Emoji-heavy copy in product UI. Used sparingly in marketing only.
- Round numbers when even alternatives exist (240px instead of 230px).
- Cluttered dashboards. The 3-column layout breathes — keep it that way.

## Open questions

(Update this section as decisions get made)

- Final logo lockup
- Consistent illustration style for empty states
- Loading state animation language
