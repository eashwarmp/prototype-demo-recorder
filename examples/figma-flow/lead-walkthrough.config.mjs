// One continuous take of the Flow lead qualification journey, from the "Lead qualification demo" flow start.
// Design points are in the 390×844 phone frame; targets read from the Figma file on 2026-11-01.
// Set FIGMA_PROTO_URL to the prototype link that starts at the "Lead qualification demo" flow (see .env.example).
const base = process.env.FIGMA_PROTO_URL;
if (!base) throw new Error('Set FIGMA_PROTO_URL (see .env.example).');
const url = `${base}${base.includes('?') ? '&' : '?'}scaling=contain&hide-ui=1&hotspot-hints=0&content-scaling=fixed`;

export default {
  url,
  viewport: { width: 900, height: 1860 },
  frame: { width: 390, height: 844 },
  loadSeconds: 16,
  fps: 30,
  output: { width: 780, height: 1688 },
  sections: [
    {
      // Unfilmed: visit every screen once so Figma has loaded them, then reload (fresh prototype state, warm cache).
      name: '_warmup',
      run: async ({ hold, glide, tap, restart }) => {
        await hold(1);
        for (const [x, y] of [[195, 611], [336, 326], [195, 776], [106, 776], [195, 776], [215, 357]]) await tap(x, y, 3);
        await tap(352, 507, 1.5);
        await tap(85, 357, 3);
        await tap(352, 400, 1.5);
        await tap(195, 626, 3);
        await tap(106, 776, 3);
        await restart(16);
        await glide(405, 640, 600);
        await hold(1);
      },
    },
    {
      name: 'lead_qualification_walkthrough',
      run: async ({ hold, glide, tap, scroll, cue }) => {
        // Home, first run
        await hold(2); // editing handle
        cue('Home'); await hold(3);
        await glide(230, 278, 1200); await hold(1.5); // the ask bar
        cue('Qualify new leads'); await glide(300, 611, 1200); await hold(2);
        await tap(195, 611, 3.5, 'Qualify new leads');

        // The request, then the plan
        cue('Request filled in'); await glide(250, 330, 900); await hold(1);
        await tap(336, 326, 4, 'Send');
        cue('Plan review'); await glide(250, 300, 1000); await hold(2);
        await glide(220, 403, 800); await hold(2.5);
        await scroll(195, 560, 260, 1600); await hold(3);
        await scroll(195, 560, -260, 1300); await hold(1);
        await glide(300, 700, 800); await hold(2);

        // Start asks for HubSpot first
        await tap(195, 776, 4, 'Start');
        cue('HubSpot needed'); await glide(200, 520, 1200); await hold(2);
        await tap(106, 776, 3.5, 'Connect HubSpot');
        await glide(300, 700, 800); await hold(1);
        await tap(195, 776, 4.5, 'Start');

        // Live run and call results
        cue('Live run'); await glide(220, 610, 1100); await hold(2);
        await glide(240, 700, 900); await hold(2);
        await glide(215, 357, 1000); await hold(0.8);
        cue('Call summary'); await tap(215, 357, 5, 'Call summary');
        await glide(220, 470, 1200); await hold(2);
        await tap(352, 507, 2, 'Close summary');
        cue('Transcript'); await tap(85, 357, 4, 'Transcript');
        await glide(230, 560, 1400); await hold(3);
        await tap(352, 400, 2.5, 'Close transcript');
        await glide(300, 520, 900); await hold(2);

        // Approval
        cue('Needs you'); await glide(250, 626, 1000); await hold(3);
        await tap(195, 626, 4.5, 'Needs you · HubSpot');
        cue('Approval details'); await glide(150, 330, 1000); await hold(1.5);
        await glide(260, 560, 1600); await hold(2);
        await glide(285, 776, 800); await hold(1.2);
        await glide(106, 776, 700); await hold(1.2);
        await tap(106, 776, 4, 'Approve');

        // Done
        cue('Run finished'); await glide(220, 520, 1200); await hold(3);
        await glide(405, 640, 900); await hold(2);
        await hold(2); // editing handle
      },
    },
  ],
};
