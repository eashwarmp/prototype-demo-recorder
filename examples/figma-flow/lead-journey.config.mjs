// Example: the "Qualify new leads" journey of a Figma phone prototype (the Flow demo), recorded section by section.
// Set FIGMA_PROTO_URL to a prototype link shared as "anyone with the link can view", starting at the Home frame.
// Coordinates are points in the 390×844 design frame, read from the Figma file (see trace-links.mjs).

const base = process.env.FIGMA_PROTO_URL;
if (!base) throw new Error('Set FIGMA_PROTO_URL (see .env.example).');
// Figma viewer options: fit the frame to the window, hide the viewer's chrome and the hotspot hints.
const url = `${base}${base.includes('?') ? '&' : '?'}scaling=contain&hide-ui=1&hotspot-hints=0&content-scaling=fixed`;

export default {
  url,
  viewport: { width: 900, height: 1860 }, // the phone renders at about 2× in this window
  frame: { width: 390, height: 844 },
  // mapping: { ox: 48, oy: 61, scale: 2.059 }, // measured for this viewer; leave unset to calibrate automatically
  loadSeconds: 14,
  fps: 30,
  output: { width: 780, height: 1688 },
  sections: [
    {
      name: '02_request_to_plan',
      run: async ({ hold, glide, tap, scroll, cue }) => {
        await hold(2); // editing handle
        cue('Chasing overdue invoices?'); await glide(300, 481, 900); await hold(1.5);
        cue('Handling incoming calls?'); await glide(300, 741, 700); await hold(1.5);
        cue('Qualifying new leads?'); await glide(300, 611, 700); await hold(1.5);
        cue("Let's try that last one"); await tap(195, 611, 2, 'Qualify new leads');
        await hold(1);
        await tap(336, 326, 2.5, 'Send');
        cue('Flow lays out the work'); await glide(250, 300, 900); await hold(1.5);
        cue('Five leads at a time'); await glide(220, 403, 700); await hold(2);
        cue('Steps and tools involved'); await scroll(195, 560, 260, 1500); await hold(1.5);
        await scroll(195, 560, -260, 1200); await hold(0.5);
        cue('Review the plan'); await glide(300, 700, 700); await hold(3);
        await hold(2);
      },
    },
    {
      name: '03b_connect_hubspot',
      run: async ({ hold, glide, tap }) => {
        await hold(2);
        await tap(195, 776, 3, 'Start (HubSpot not connected)');
        await glide(200, 520, 1200); await hold(3);
        await tap(106, 776, 2.5, 'Connect HubSpot');
        await hold(2);
      },
    },
    {
      name: '04_execution',
      run: async ({ hold, glide, tap, cue }) => {
        await hold(2);
        cue("Alright, let's hit Start"); await tap(195, 776, 2.5, 'Start');
        await glide(220, 610, 1000); await hold(2);
        await glide(240, 700, 800); await hold(2);
        await glide(215, 357, 900); await hold(0.6);
        cue('Open the call summary'); await tap(215, 357, 3, 'Recording (summary)');
        await tap(352, 507, 1.2, 'Close summary');
        cue('Read the transcript'); await tap(85, 357, 3, 'Transcript');
        await glide(230, 560, 1200); await hold(2);
        await tap(352, 400, 1.5, 'Close transcript');
        cue('Clear record of the work'); await glide(300, 520, 800); await hold(3);
        await hold(2);
      },
    },
    {
      name: '05_approval',
      run: async ({ hold, glide, tap, cue }) => {
        await hold(2);
        await glide(250, 626, 900); await hold(3);
        cue('Ready to add the contact'); await tap(195, 626, 3, 'HubSpot step');
        await glide(150, 330, 900);
        await glide(260, 560, 1400); await hold(0.6);
        await glide(285, 776, 700); await hold(1);
        await glide(106, 776, 600); await hold(1);
        cue('One tap'); await tap(106, 776, 3, 'Add to HubSpot (approve)');
        await glide(405, 640, 900); await hold(2);
        await hold(2);
      },
    },
  ],
};
