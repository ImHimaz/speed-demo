/**
 * Arcnest home page video, step 2: the captured clips (capture.mjs) on
 * Arcnest's dark purple, 1920×1080 at 30 fps. The editor in a browser window
 * with a drawn pointer (two captions: editing, adding a section), then the
 * live site on a laptop and a phone side by side, then a fade back to the
 * start so it loops. Each frame is rendered in a browser page; ffmpeg makes
 * MP4 (H.264, High profile level 4.0 with 4 reference frames: Safari's
 * hardware decoder refuses heavier streams, so no `-tune animation`), WebM
 * (VP9) and a JPEG poster. Use the MP4 alone on the site: Safari says it
 * "maybe" plays this WebM, then never decodes it.
 *
 * Run: WORK=/path/to/work node compose.mjs  → out/arcnest-demo.{mp4,webm,jpg}
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const FPS = 30;
const FADE = 15; // frames
const WORK = process.env.WORK;
const here = new URL( './', import.meta.url ).pathname;
const out = `${ here }out/`;
const load = ( name ) => {
	const t = JSON.parse( readFileSync( `${ WORK }/${ name }/timeline.json`, 'utf8' ) );
	t.frames = t.frames.map( ( f ) => ( { ...f, src: `file://${ WORK }/${ name }/${ f.file }` } ) );
	return t;
};
const editor = load( 'editor' );
const desk = load( 'desk' );
const phone = load( 'phone' );

// Caption 2 from when the pointer heads for the inserter (top left).
const toInserter = editor.frames.findIndex( ( f, i ) => i > 60 && f.cursor && f.cursor.y < 60 );
const caption2 = Math.max( 0, toInserter - 24 );

// Window sizes (CSS px of the 1920×1080 frame).
const ED = { x: 250, y: 160, w: 1420 };
ED.s = ED.w / editor.width;
ED.h = Math.round( editor.height * ED.s );
const DK = { x: 150, y: 176, w: 1180 };
DK.s = DK.w / desk.width;
DK.h = Math.round( desk.height * DK.s );
const PH = { w: 340 };
PH.h = Math.round( phone.height * ( PH.w / phone.width ) );
PH.x = 1440;
PH.y = DK.y + Math.round( ( DK.h + 40 - PH.h - 24 ) / 2 );

const font = 'file:///Users/Himaz/Projects/arcnest/assets/fonts/plus-jakarta-sans/PlusJakartaSans-Latin-VariableFont_wght.woff2';
const chrome = ( url ) => `<div class="bar"><i></i><i></i><i></i><span>${ url }</span></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Jakarta; src: url(${ font }) format("woff2"); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; }
body { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #26062f; font-family: Jakarta, sans-serif; color: #fff; -webkit-font-smoothing: antialiased; }
body::before { content: ""; position: absolute; inset: auto -10% -55% -10%; height: 100%; background: radial-gradient(closest-side, rgb(146 46 186 / .7), rgb(79 15 105 / .3) 55%, transparent 75%); }
body::after { content: ""; position: absolute; top: -260px; right: -200px; width: 760px; height: 760px; background: radial-gradient(closest-side, rgb(215 223 35 / .14), transparent 70%); }
.brand { position: absolute; z-index: 5; top: 58px; right: 120px; font-size: 40px; font-weight: 800; letter-spacing: -.04em; }
.brand b { color: #d7df23; }
.cap { position: absolute; z-index: 5; top: 56px; left: 120px; display: flex; align-items: center; gap: 18px; }
.cap span { padding: 6px 16px; border-radius: 999px; background: #d7df23; color: #26062f; font-size: 22px; font-weight: 800; }
.cap p { font-size: 38px; font-weight: 800; letter-spacing: -.03em; }
.scene { position: absolute; inset: 0; z-index: 2; }
.win { position: absolute; overflow: hidden; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px rgb(255 255 255 / .12), 0 50px 120px -40px rgb(0 0 0 / .8); }
.bar { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; background: #3a1446; }
.bar i { width: 12px; height: 12px; border-radius: 50%; background: rgb(255 255 255 / .25); }
.bar span { flex: 0 1 460px; margin: 0 auto; padding: 5px 14px; border-radius: 8px; background: rgb(255 255 255 / .1); color: rgb(255 255 255 / .75); font-size: 14px; font-weight: 600; text-align: center; }
.win img { display: block; width: 100%; }
.phone { position: absolute; padding: 12px; border-radius: 52px; background: #120318; box-shadow: 0 0 0 2px rgb(255 255 255 / .14), 0 50px 120px -40px rgb(0 0 0 / .8); }
.phone .screen { overflow: hidden; border-radius: 40px; background: #fff; }
.phone img { display: block; width: ${ PH.w }px; }
.ptr { position: absolute; z-index: 6; width: 34px; height: 34px; margin: -3px 0 0 -6px; filter: drop-shadow(0 4px 8px rgb(0 0 0 / .35)); }
.ring { position: absolute; z-index: 6; width: 60px; height: 60px; margin: -30px 0 0 -30px; border: 4px solid #d7df23; border-radius: 50%; opacity: 0; }
</style></head><body>
<div class="brand">arcnest<b>.</b></div>
<div class="cap"><span id="num">01</span><p id="text"></p></div>
<div class="scene" id="a"><div class="win" style="left:${ ED.x }px;top:${ ED.y }px;width:${ ED.w }px">${ chrome( 'elite.arcnestpreview.com/wp-admin' ) }<img id="ed" alt=""></div></div>
<div class="scene" id="b" style="opacity:0">
<div class="win" style="left:${ DK.x }px;top:${ DK.y }px;width:${ DK.w }px">${ chrome( 'elite.arcnestpreview.com' ) }<img id="dk" alt=""></div>
<div class="phone" style="left:${ PH.x }px;top:${ PH.y }px"><div class="screen"><img id="ph" alt=""></div></div>
</div>
<svg class="ptr" id="ptr" viewBox="0 0 24 24"><path d="M4 2l16 10.5-7 1.3 4.2 7.4-3 1.6-4.2-7.5L4 20z" fill="#fff" stroke="#26062f" stroke-width="1.6" stroke-linejoin="round"/></svg>
<div class="ring" id="ring"></div>
</body></html>`;

rmSync( `${ WORK }/png`, { recursive: true, force: true } );
mkdirSync( `${ WORK }/png`, { recursive: true } );
mkdirSync( out, { recursive: true } );
writeFileSync( `${ WORK }/compose.html`, html );

const browser = await chromium.launch();
const page = await browser.newPage( { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 } );
await page.goto( `file://${ WORK }/compose.html` );
await page.evaluate( () => document.fonts.ready );

const A = editor.frames.length;
const B = desk.frames.length;
const total = A + B;
let lastClick = -100;
for ( let n = 0; n < total; n++ ) {
	// Scene A, then B (fading in over A's last frames), then A's first frame
	// fading back in over B's last frames (the loop).
	const a = n < A ? editor.frames[ n ] : editor.frames[ 0 ];
	const bi = Math.max( 0, n - A + FADE );
	const b = n >= A - FADE ? { dk: desk.frames[ Math.min( bi, B - 1 ) ], ph: phone.frames[ Math.min( bi, phone.frames.length - 1 ) ] } : null;
	let bOpacity = n < A - FADE ? 0 : Math.min( 1, ( n - ( A - FADE ) ) / FADE );
	if ( n >= total - FADE ) {
		bOpacity = ( total - n ) / FADE; // back to the start
	}
	if ( a.click && n < A ) {
		lastClick = n;
	}
	const ring = n - lastClick;
	const cursor = n < A && a.cursor && ! a.cursor.hide ? { x: ED.x + a.cursor.x * ED.s, y: ED.y + 40 + a.cursor.y * ED.s } : null;
	const inB = bOpacity >= 0.5;
	const text = inB ? [ '03', 'Fast on laptops and phones' ] : n >= caption2 && n < A ? [ '02', 'Add a ready-made section' ] : [ '01', 'Edit in the standard WordPress editor' ];
	await page.evaluate( ( s ) => {
		const set = ( id, src ) => {
			const img = document.getElementById( id );
			if ( src && img.getAttribute( 'src' ) !== src ) {
				img.setAttribute( 'src', src );
			}
		};
		set( 'ed', s.a );
		if ( s.b ) {
			set( 'dk', s.b.dk );
			set( 'ph', s.b.ph );
		}
		document.getElementById( 'b' ).style.opacity = s.bOpacity;
		document.getElementById( 'a' ).style.opacity = 1 - s.bOpacity;
		document.getElementById( 'num' ).textContent = s.text[ 0 ];
		document.getElementById( 'text' ).textContent = s.text[ 1 ];
		const ptr = document.getElementById( 'ptr' );
		const ring = document.getElementById( 'ring' );
		ptr.style.display = s.cursor ? 'block' : 'none';
		if ( s.cursor ) {
			ptr.style.left = `${ s.cursor.x }px`;
			ptr.style.top = `${ s.cursor.y }px`;
			ring.style.left = `${ s.cursor.x }px`;
			ring.style.top = `${ s.cursor.y }px`;
		}
		const p = s.ring / 12;
		ring.style.opacity = s.cursor && p >= 0 && p <= 1 ? String( 0.9 * ( 1 - p ) ) : '0';
		ring.style.transform = `scale(${ 0.3 + p * 0.9 })`;
	}, { a: a.src, b: b ? { dk: b.dk.src, ph: b.ph.src } : null, bOpacity, text, cursor, ring } );
	await page.evaluate( () => Promise.all( [ ...document.images ].filter( ( i ) => i.getAttribute( 'src' ) ).map( ( i ) => i.decode().catch( () => {} ) ) ) );
	await page.screenshot( { path: `${ WORK }/png/${ String( n ).padStart( 4, '0' ) }.png` } );
}
await browser.close();

const ff = ( args ) => execFileSync( 'ffmpeg', [ '-loglevel', 'error', '-y', ...args ] );
ff( [ '-framerate', String( FPS ), '-i', `${ WORK }/png/%04d.png`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-profile:v', 'high', '-level:v', '4.0', '-refs', '4', '-bf', '2', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${ out }arcnest-demo.mp4` ] );
ff( [ '-framerate', String( FPS ), '-i', `${ WORK }/png/%04d.png`, '-c:v', 'libvpx-vp9', '-crf', '46', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', `${ out }arcnest-demo.webm` ] );
ff( [ '-i', `${ WORK }/png/0000.png`, '-q:v', '3', `${ out }arcnest-demo-poster.jpg` ] );
console.log( `Rendered ${ total } frames (${ ( total / FPS ).toFixed( 1 ) } s), caption 2 from frame ${ caption2 }: out/arcnest-demo.mp4, .webm, -poster.jpg` );
