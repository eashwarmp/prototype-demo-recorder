// Flow product showcase: narration-timed takes of the live Figma prototype, for prototype-demo-recorder.
// Every time below is on the master timeline (Michael's ten WAVs back to back, 0–200.48 s). Cue times come from
// cues.json (three independent estimates per phrase, see cues.py). Each take films a window [from, to) of the
// master; assemble.py cuts it out at the take's T0 marker and lays the narration over the joined takes.
import { readFileSync } from 'node:fs';

const cues = JSON.parse(readFileSync(new URL('./cues.json', import.meta.url), 'utf8')).cues;
const K = (key) => { if (!cues[key]) throw new Error(`no cue ${key}`); return cues[key].master; };
// The prototype's file key comes from the environment (see .env.example), so no file key is committed.
const proto = (node) => {
  const file = process.env.FIGMA_FILE_KEY;
  if (!file) throw new Error('Set FIGMA_FILE_KEY to the Flow prototype file key (see .env.example).');
  return `https://www.figma.com/proto/${file}/flow?node-id=${node}&starting-point-node-id=111-5055`
    + '&scaling=contain&hide-ui=1&hotspot-hints=0&content-scaling=fixed';
};
const OFF = [0, 18.8, 38.72, 61.6, 82.08, 101.28, 125.2, 143.36, 166.4, 187.68]; // section starts
const END = 200.48; // last narration sample
const S = (i, t) => +(OFF[i] + t).toFixed(2); // section-relative time to master
const PARK = [420, 600]; // off the phone, so the cursor is out of shot

// Events: ['g', T, x, y, ms] glide arriving at T · ['p', T, x, y, label, ms] press exactly at T ·
//         ['s', T, dy, ms] scroll starting at T. Coordinates are 390×844 design points.
export const shots = [
  { name: 'a_home_to_plan', node: '111-5055', from: 0, to: 47.6, events: [
    ['g', K('intro:introducing flow') + 0.8, 112, 74, 1200],          // toward the Flow logo
    ['g', K('intro:just tell flow') + 0.5, 180, 228, 900],
    ['g', K('intro:type it'), 230, 228, 500],                         // "type it"
    ['g', K('intro:say it'), 284, 278, 450],                          // "say it" (mic)
    ['g', K('intro:ready-to-use'), 330, 481, 700],                    // ready-to-use workflows
    ['g', K('intro:ready-to-use') + 0.65, 330, 611, 600],
    ['g', K('intro:ready-to-use') + 1.3, 330, 741, 600],
    ['g', K('intro:just flow'), 112, 74, 1500],                       // "…really just Flow"
    ['g', K('request_to_plan:chasing'), 300, 481, 650],               // Chasing overdue invoices?
    ['g', K('request_to_plan:handling'), 300, 741, 700],              // Handling incoming calls?
    ['g', K('request_to_plan:qualifying'), 300, 611, 600],            // Qualifying new leads?
    ['p', K('request_to_plan:try'), 195, 611, 'Qualify new leads', 600], // "Let's try that last one"
    ['g', K("request_to_plan:we've got") + 0.4, 200, 180, 900],
    ['g', S(1, 11.4), 260, 205, 1800],
    ['p', K('request_to_plan:flow lays') - 0.5, 336, 326, 'Send', 600], // plan appears on "Flow lays out the work"
    ['g', S(1, 13.2), 250, 300, 500],
    ['g', K('request_to_plan:five leads'), 220, 403, 450],            // five leads at a time
    ['s', K('request_to_plan:with the steps') - 0.4, 260, 1500],      // steps and tools
    ['s', K('request_to_plan:and before'), -260, 1200],               // review the plan
    ['g', K('request_to_plan:review the plan') + 0.3, 300, 700, 400],
    ['p', K("permissions:here's something") + 0.55, 195, 776, 'Start (asks for a CRM)', 500],
    ['g', K('permissions:connecting your'), 200, 470, 900],
    ['g', S(2, 6.93), 195, 576, 700],                                 // READ: Read contacts
    ['g', S(2, 8.0), 195, 643, 600],                                 // DO · asks you first
  ] },
  { name: 'b_connections', node: '11-391', from: 47.6, to: 54.87, events: [
    ['g', K('permissions:individual') - 0.15, 279, 305, 900],
    ['p', K('permissions:individual') - 0.05, 279, 305, 'Search inbox off', 100], // choose individual actions
    ['p', K('permissions:limit') - 0.15, 195, 500, 'Google Sheets', 600], // limit which spreadsheets
    ['g', K('permissions:which spreadsheets') + 0.4, 69, 719, 450],
    ['g', K('permissions:which spreadsheets') + 1.0, 242, 719, 550],
    ['s', S(2, 13.25), 260, 600],
    ['p', K('permissions:slack channels') - 0.15, 195, 585, 'Slack', 150], // which Slack channels
    ['s', S(2, 14.68), 160, 400],                                     // reveal Slack's channel limit
    ['g', S(2, 15.95), 70, 643, 450],                                 // #all-flow: channels it can post to
  ] },
  { name: 'c_run', node: '8-147', from: 54.87, to: 125.15,
    prep: async (a) => { await a.tap(195, 776, 2.5); await a.glide(195, 643, 300); await a.hold(1); },
    events: [
    ['g', K('permissions:approval'), 110, 610, 700],                  // DO · ASKS YOU FIRST
    ['g', S(2, 18.6), 195, 643, 600],
    ['p', K('permissions:your tools'), 106, 776, 'Connect HubSpot', 700],
    ['g', S(2, 20.95), 250, 375, 700],
    ['g', S(2, 22.3), 300, 700, 800],
    ['p', K('executions:start'), 195, 776, 'Start', 500],             // "let's hit Start"
    ['g', K('executions:flow begins') + 0.8, 220, 610, 1000],
    ['g', S(3, 4.4), 240, 700, 900],
    ['g', S(3, 6.2), 220, 480, 900],
    ['g', K("executions:see what's happening") + 0.4, 215, 357, 900],
    ['p', K('executions:call summary') - 0.25, 215, 357, 'Call summary', 150], // open the call summary
    ['p', S(3, 13.15), 280, 627, 'Transcript', 500],                   // read the transcript
    ['g', K('executions:see what flow') + 0.6, 230, 560, 900],
    ['g', S(3, 16.2), 230, 640, 800],
    ['p', K('executions:no mysterious'), 352, 400, 'Close transcript', 600],
    ['g', K('executions:clear record'), 300, 520, 900],
    ['g', K('human_approval:qualified'), 110, 318, 1000],             // a qualified lead
    ['g', K('human_approval:ready to add') + 0.8, 250, 626, 900],     // add the contact to HubSpot
    ['p', K('human_approval:but before'), 195, 626, 'Needs you · HubSpot', 600], // "before it makes that change, it asks"
    ['g', K('human_approval:inspect'), 150, 330, 900],                // inspect the details
    ['g', K('human_approval:inspect') + 0.8, 260, 560, 700],
    ['g', K('human_approval:approve the') + 0.15, 106, 776, 400],     // approve…
    ['g', K('human_approval:decline'), 285, 776, 500],                // …or decline
    ['p', K('human_approval:tap'), 106, 776, 'Approve', 500],         // "One tap"
    ['g', K('human_approval:completed'), 220, 520, 1000],
    ['p', K("reciepts_proof:here's another"), 195, 786, 'History', 700], // another example: History
    ['s', S(5, 3.67), 150, 600],
    ['p', K('reciepts_proof:follow-up'), 195, 600, 'Wrote 2 dates to Invoices', 400], // invoice follow-up
    ['g', K('reciepts_proof:green'), 45, 155, 900],                   // green checkmark
    ['g', K('reciepts_proof:why a'), 120, 240, 700],                  // why
    ['g', K('reciepts_proof:which values'), 250, 450, 700],           // which values changed
    ['s', S(5, 11.0), 120, 500],
    ['g', K('reciepts_proof:who approved') + 0.2, 150, 485, 300],     // who approved it
    ['g', K('reciepts_proof:accepted'), 150, 640, 800],               // accepted and verified
    ['p', S(5, 17.72), 195, 776, 'Undo · put the old values back', 600], // put things back
    ['g', K('reciepts_proof:approval step') + 0.3, 106, 776, 600],    // an approval step for that too
    ['g', K('reciepts_proof:accountability'), 195, 640, 900],
  ] },
  { name: 'd_change_plan', node: '19-814', from: 125.15, to: 143.31, slip: 0.3, events: [ // slip: edit uses this take 0.3 s early (composer animates in)
    ['g', K('change_the_plan:plans change'), 195, 150, 900],
    ['g', K('change_the_plan:customer') + 0.3, 190, 330, 700],        // a customer already paid
    ['g', K('change_the_plan:more time'), 195, 664, 800],             // more time
    ['p', K('change_the_plan:tell flow'), 195, 726, 'Change composer', 400], // tell Flow what needs to change
    ['g', K('change_the_plan:leaving'), 180, 705, 800],
    ['g', K('change_the_plan:extending') + 0.5, 300, 730, 900],
    ['p', K('change_the_plan:the updated') - 0.2, 348, 718, 'Send change', 500], // the updated plan
    ['g', K('change_the_plan:both changes'), 180, 134, 700],
    ['g', K('change_the_plan:undo'), 342, 131, 600],                  // we can even undo them
  ] },
  { name: 'e_tools', node: '85-3125', from: 143.31, to: 166.35, events: [
    ['g', S(7, 2.3), 195, 325, 1000],
    ['p', K('bring_your_own_tools:flow identifies') - 0.25, 195, 325, 'Step 6 needs a billing tool', 200],
    ['g', K('bring_your_own_tools:gives you'), 195, 451, 700],
    ['g', K('bring_your_own_tools:gives you') + 0.6, 195, 579, 600],
    ['p', S(7, 8.55), 195, 642, 'Use your own tool', 500],            // a way to add the tool you already use
    ['g', S(7, 9.95), 195, 658, 700],                                 // MCP link
    ['p', S(7, 10.55), 195, 776, 'Continue to sign in', 350],
    ['p', S(7, 11.25), 263, 482, 'Continue', 450],
    ['p', S(7, 12.05), 195, 775, 'Allow', 500],                       // → choose the actions
    ['g', K('bring_your_own_tools:creating'), 195, 619, 700],         // creating…
    ['g', K('bring_your_own_tools:creating') + 0.8, 195, 664, 500],   // …and sending invoices
    ['g', K('bring_your_own_tools:with approval'), 110, 585, 600],    // allowed, with approval
    ['g', K('bring_your_own_tools:refunding'), 195, 711, 700],        // refunds stay off
    ['p', K('bring_your_own_tools:and the updated') - 0.15, 106, 776, 'Use for step 6', 700],
  ] },
  { name: 'f_team', node: '121-5109', from: 166.35, to: 180.45, events: [
    ['g', S(8, 1.6), 195, 95, 1000],
    ['g', K('team_wfs:flow can organize') + 1.0, 195, 160, 900],     // separate runs for a team
    ['g', K('team_wfs:six drivers'), 195, 264, 700],
    ['g', S(8, 8.6), 195, 430, 900],
    ['g', S(8, 9.6), 195, 495, 600],
    ['p', S(8, 10.9), 319, 343, 'Review (Marco)', 600],   // one needs a clearer document
    ['p', K('team_wfs:others') - 0.3, 106, 776, 'Send text', 600],          // others are still moving forward
    ['g', S(8, 13.8), 195, 380, 700],
  ] },
  { name: 'g1_call', node: '115-4882', from: 180.45, to: 181.4, events: [] },   // "calls"
  { name: 'g2_sms', node: '115-4838', from: 181.4, to: 181.95, events: [] },    // "texts"
  { name: 'g3_lock', node: '114-4872', from: 181.95, to: 185.3, events: [] },   // "notifications"
  { name: 'h_home', node: '142-5668', from: 185.3, to: 199.45, events: [
    ['g', K('team_wfs:one place') + 1.0, 300, 420, 1000],             // one place for everything
    ['g', K('product_close:real work'), 300, 560, 1200],
    ['g', K('product_close:you decide'), 230, 228, 900],              // you decide what needs to happen
    ['g', K('product_close:coordinate'), 300, 400, 900],              // Flow helps coordinate the work
    ['g', K('product_close:stay in charge'), 100, 521, 800],          // you stay in charge
  ] },
  { name: 'i_welcome', node: '111-4354', from: 199.45, to: END + 2.5, events: [] }, // "That's Flow" + 2.5 s hold
];

// Runs a shot's events against the wall clock, relative to its T0 marker. A late event is noted in the log.
function schedule(a, from) {
  let t0;
  const at = async (T, what) => {
    const wait = t0 + (T - from) * 1000 - Date.now();
    if (wait > 0) await a.hold(wait / 1000);
    else if (wait < -60) a.note(`late ${(-wait / 1000).toFixed(2)}s: ${what}`);
  };
  return {
    start() { a.cue('T0'); t0 = Date.now(); },
    at,
    async run(e) {
      const [kind, T] = e;
      if (kind === 'g') { const [, , x, y, ms] = e; await at(T - ms / 1000, `glide ${x},${y}`); await a.glide(x, y, ms); }
      if (kind === 'p') { const [, , x, y, label, ms] = e; await at(T - 0.15 - ms / 1000, `approach ${label}`); await a.glide(x, y, ms); await at(T, label); await a.click(label); }
      if (kind === 's') { const [, , dy, ms] = e; await at(T, 'scroll'); await a.scroll(195, 500, dy, ms); }
    },
  };
}

const park = async (a) => { await a.glide(PARK[0], PARK[1], 300); await a.hold(0.5); };

export default {
  get url() { return proto('111-5055'); },
  viewport: { width: 900, height: 1860 },
  frame: { width: 390, height: 844 },
  mapping: { ox: 48, oy: 60, scale: 2.059 }, // measured for this viewer (calibration finds the same)
  loadSeconds: 16,
  fps: 30,
  output: { width: 780, height: 1688 },
  sections: [
    // Unfilmed: visit every screen of every take once, so nothing loads for the first time on camera.
    { name: '_warmup', run: async (a) => {
      for (const s of shots) {
        await a.restart(14, proto(s.node));
        if (s.prep) await s.prep(a);
        for (const e of s.events) {
          if (e[0] === 'p') await a.tap(e[2], e[3], 1.2);
          if (e[0] === 's') await a.scroll(195, 500, e[2], 300);
        }
      }
    } },
    ...shots.flatMap((s) => [
      { name: `_go_${s.name}`, run: async (a) => { await a.restart(14, proto(s.node)); if (s.prep) await s.prep(a); else await park(a); } },
      { name: s.name, run: async (a) => {
        await a.hold(1.5); // editing handle
        const sc = schedule(a, s.from);
        sc.start();
        for (const e of s.events) await sc.run(e);
        await sc.at(s.to, 'end');
        await a.hold(1.5); // editing handle
      } },
    ]),
  ],
};
