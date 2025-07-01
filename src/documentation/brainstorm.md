**Project Scope: AI Software Idea Shaper**

**Project Summary:**
This application empowers users to transform a raw software idea into a structured concept through an AI-guided, step-by-step process. Users start with a core idea, and the AI generates a relevant, editable "agenda" of project dimensions. For each dimension, the AI proposes several options as editable cards; users can tweak text or "re-roll" for new suggestions. Users can navigate back to previously completed dimensions to re-edit choices or explore new AI options, then proceed forward again. Selections visually "commit" to an evolving "Idea Brief." Throughout, the dynamically updated master prompt and project summary are accessible. Finally, users can generate lightweight HTML/CSS wireframes from their completed brief.

**User Stories:**

- I have a raw software idea, but I get overwhelmed trying to structure it into a full concept and explore all the necessary facets.
- When I'm brainstorming a new feature or flow, I want to quickly explore different approaches, pick the best fit, edit the details, and if needed, re-roll the AI suggestions.
- As I develop an idea, I often realize a previous choice needs adjustment; I want to be able to go back to an earlier part of my structured brainstorm, change my selection or explore new AI options there, and then continue refining my idea from that point.
- I need a way to ensure my AI brainstorming stays on track with a defined project outline (which the AI helps create and I can adjust), even as I explore creative tangents.
- I want to quickly turn my structured thoughts and AI-generated ideas into a preliminary visual (like basic wireframes) to see if it 'looks right.'

**Product Requirements:**

- **Initial Idea Seeding & Dynamic Agenda:**
  - Users input a concise initial software idea.
  - The system must use an LLM to generate an initial, ordered list of relevant project dimensions (the "agenda") based on this input.
  - Users must be able to review and edit (reorder, rename, add, delete items) the AI-generated agenda before proceeding.
- **Navigation and Iteration:**
  - Users must be able to navigate sequentially through the agenda dimensions.
  - Users must be able to navigate back to any previously completed dimension in the agenda to revisit their choices.
- **AI-Powered Option Generation & Editing:**
  - For each dimension (current or revisited), the LLM generates 2-3 distinct options based on the current state of the idea (initial idea and prior confirmed selections).
  - **Editable Option Cards:** AI-generated option cards must be directly editable by the user before selection.
  - Users must be able to trigger a re-generation of options ("re-roll") for the current dimension.
  - Users must have an optional way to provide brief additional text context before a "re-roll."
- **Consequence of Revisiting Prior Choices (V1):**
  - If a user modifies a selection in a previously completed dimension, all selections and progress in subsequent dimensions will be cleared. The user will then proceed forward from the re-edited dimension. This ensures contextual integrity for AI generation.
- **Guided Selection & Visual Feedback:** Selections visually "commit" to the project summary/brief.
- **Persistent Core Information:** Easy access to the latest master prompt and project summary, with freshness indicators.
- **Structured Output ("Idea Brief"):** Compile selections into a coherent summary.
- **Lightweight Wireframe Generation:** Based on the "Idea Brief," generate basic HTML/CSS wireframes for key screens.
- **Dynamic Dimension Depth (V1 Approach):** AI can generate list-based options for relevant dimensions; users edit these lists on the card.
- **Responsive Interface:** Supports rapid exploration and decision-making.

**User Journey Overview:**

1.  **Planting the Seed (Initial Idea Input):**
    - **UI:** Screen with a single input field. Upon input, page visually expands/transitions to reveal the AI-generated agenda.
    - **Interaction:** User types core idea, initiates unfolding.
2.  **Setting the Agenda (Review & Edit):**
    - **UI:** System displays the AI-generated, editable list of project dimensions. Agenda items are visually styled to indicate status (e.g., upcoming, current, completed). CTAs: "Confirm & Start with [First Dimension]" and "Edit Agenda."
    - **Interaction:** User reviews/edits agenda, then confirms to start.
3.  **Dimensional Deep Dive & Option Selection (Iterative Loop):**
    - **UI:** Main content area focuses on the current dimension. AI presents 2-3 distinct options as selectable, editable cards. Buttons for "Re-roll Options" and "Re-roll with Guidance..." are available. The agenda (e.g., in a sidebar) shows all dimensions; completed ones are clickable for navigation.
    - **Interaction:**
      - User reviews/edits/selects an option or re-rolls.
      - Upon clicking "Select & Continue" on a card:
        - The selection visually "commits" to the "Project Summary."
        - The view transitions to the next dimension in the agenda.
      - **Navigating Back:** User can click on a previously completed dimension name in the agenda. The view switches to that dimension, displaying their prior selection. They can then edit it, re-roll options, or choose a new option.
      - **Revisiting Impact:** If a change is made in a revisited dimension, a brief, clear notification confirms that subsequent progress will be cleared to maintain consistency. The user then proceeds from the just-edited dimension.
4.  **Persistent Insights (Prompt & Summary Access):**
    - **UI:** Small, persistent icons for "Master Prompt" and "Project Summary" with update indicators.
    - **Interaction:** Click to open modal/slide-out with text and timestamp.
5.  **Review Your Blueprint (Consolidated Idea):**
    - **UI:** After the (potentially new) last dimension, a "Project Blueprint" page displays the "Idea Brief." CTA: "Generate Key Screen Wireframes."
    - **Interaction:** User reviews.
6.  **Visualize Key Screens (Wireframe Generation):**
    - **UI:** User clicks "Generate Key Screen Wireframes." Wireframes displayed after loading.
    - **Interaction:** User views wireframes.

**Target Audience:**
Aspiring or current software builders (entrepreneurs, indie developers, product managers) who want to leverage AI to rapidly define, structure, iterate on, and get an initial visual feel for new AI-powered software applications.

**Key Success Outcome:**
The total number of "Idea Briefs" completed by users per week.

**Out of Scope (for V1):**

- Saving/loading multiple distinct "Idea Briefs."
- Real-time collaboration.
- Sophisticated merging or reconciliation of changes when revisiting prior dimensions (V1 clears subsequent steps).
- User accounts.

**High-Level Technical Considerations:**

- **Frontend:** Modern reactive JavaScript framework; state management needs to handle non-linear navigation and clearing of subsequent states gracefully.
- **Backend:** Python (FastAPI) or Node.js (Express).
- **LLM Integration:** As before, with added consideration for re-generating options for revisited dimensions.
- **Data Storage (V1):** Session storage or browser local storage. The `Selections` data structure needs to be managed carefully when items are cleared due to revisiting.

**Database / Flow (for session-based V1):**

- **Data (session/frontend state):**
  - `InitialIdea` (text)
  - `Agenda` (ordered list of dimension objects: `{id: string, name: string, status: 'todo'|'active'|'done'}`)
  - `CurrentDimensionId` (string)
  - `Selections` (map: `{[dimensionId]: {selectedOptionText: "...", isEdited: boolean}}`)
  - `DerivedMasterPrompt` (text)
  - `DerivedProjectSummary` (text)
- **Flow (Handling Revisit):**
  1.  User navigates to a previously 'done' `dimensionId_N`.
  2.  `CurrentDimensionId` is set to `dimensionId_N`.
  3.  User makes a new selection or edits the existing one for `dimensionId_N`.
  4.  All entries in `Selections` for dimensions _after_ `dimensionId_N` in the `Agenda` are cleared. Their status in `Agenda` reverts to 'todo'.
  5.  The user proceeds to the dimension immediately following `dimensionId_N`.

---

This adds the crucial iterative capability while maintaining a manageable scope for V1 by defining a clear consequence for revisiting past choices. How does this revision align with your vision?
