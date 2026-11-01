/**
 * Draws a soft touch cursor above the page (headless Chrome shows no pointer). It follows the mouse,
 * shrinks and tints on press, and never receives clicks itself.
 */
export async function installCursor(page, { size = 58, color = 'rgba(13,17,23,.16)', press = 'rgba(51,71,224,.4)' } = {}) {
  await page.evaluate(
    ({ size, color, press }) => {
      if (document.getElementById('pdr-cursor')) return;
      const style = document.createElement('style');
      style.textContent = `#pdr-cursor{position:fixed;left:-100px;top:-100px;width:${size}px;height:${size}px;
        margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,.95);
        box-shadow:0 3px 14px rgba(0,0,0,.28);pointer-events:none;z-index:2147483647;transition:transform .14s ease,background .14s ease}
        #pdr-cursor.down{transform:scale(.7);background:${press}}`;
      document.head.appendChild(style);
      const dot = document.createElement('div');
      dot.id = 'pdr-cursor';
      document.body.appendChild(dot);
      addEventListener('mousemove', (e) => { dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`; }, true);
      addEventListener('mousedown', () => dot.classList.add('down'), true);
      addEventListener('mouseup', () => setTimeout(() => dot.classList.remove('down'), 120), true);
    },
    { size, color, press },
  );
}
