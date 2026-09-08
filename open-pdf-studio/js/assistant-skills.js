// Assistant skill set.
//
// Each skill is a capability the assistant can perform on the open PDF. Clicking
// a skill chip sends `invoke` as a user message; via the provider chain it reaches
// the brain (Claude Code over the MCP relay, or any AI provider) which executes
// it using the app's MCP tools. SKILLS_SYSTEM_PROMPT teaches the brain how.

export const ASSISTANT_SKILLS = [
  {
    id: 'summarize',
    icon: '📝',
    label: 'Summarize',
    hint: 'Summarize the document or drawing',
    invoke: 'Summarize the open document or drawing concisely: what it covers, the main components, and anything worth flagging.',
  },
  {
    id: 'draw',
    icon: '✏️',
    label: 'Draw',
    hint: 'Draw an element or annotation on the drawing',
    invoke: 'Draw on the drawing: ',
    needsInput: true,
  },
  {
    id: 'detect-openings',
    icon: '🚪',
    label: 'Find openings',
    hint: 'Detect doors and windows in the plan and mark them',
    invoke: 'Look at the floor plan, identify the doors and windows, and mark each one on the drawing with an annotation and a short label.',
  },
  {
    id: 'takeoff',
    icon: '📐',
    label: 'Takeoff help',
    hint: 'Identify items to count or measure for a takeoff',
    invoke: 'Review the open drawing and list the items a material takeoff would need to count or measure, grouped by type, with the quantity you can see for each.',
  },
];

export const SKILLS_SYSTEM_PROMPT =
  'You have a skill set and can perform ACTIONS on the open PDF document through the app\'s MCP tools:\n' +
  '- Reading / summarizing: use app_screenshot_view (width 2000) to view and read the page; return the result as text.\n' +
  '- Drawing: use app_create_annotation. Coordinates are page points at 100% zoom; get the page size from app_get_viewport_state (pageW/pageH).\n' +
  '- Finding doors and windows: run app_fit_page first, then app_screenshot_view (width 2000), identify the openings visually, and mark each one with app_create_annotation (for example a box or cloud around the opening plus a textbox label). Convert screenshot pixels to page points via pageW/pageH.\n' +
  'Always reply in English, concise and practical. Carry out requested actions directly and briefly report what you did.';
