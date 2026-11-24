/**
 * Loading race, step 2: the two recordings side by side, in Arcnest's look,
 * with a shared clock and each site's milestones (first paint, main element,
 * fully loaded) appearing as they happen. Renders each video frame in a
 * browser page, then encodes MP4 (H.264) and WebM (VP9) and a poster.
 *
 * Run: node compose.mjs [auto | <elite-run> <elementor-run>]  → out/race.{mp4,webm,jpg}
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const FPS = 30;
const here = new URL( './', import.meta.url ).pathname;
// "auto" (or nothing): each site's median run by first paint (frames/summary.json).
const median = ( site ) => {
	const runs = JSON.parse( readFileSync( `${ here }frames/summary.json`, 'utf8' ) ).filter( ( r ) => r.site === site ).sort( ( a, b ) => a.fcp - b.fcp );
	return String( runs[ Math.floor( runs.length / 2 ) ].run );
};
const args = process.argv.slice( 2 ).filter( ( a ) => a !== 'auto' );
const eliteRun = args[ 0 ] || median( 'elite' );
const elementorRun = args[ 1 ] || median( 'elementor' );
console.log( `Elite run ${ eliteRun }, Elementor run ${ elementorRun }` );
const load = ( site, run ) => {
	const meta = JSON.parse( readFileSync( `${ here }frames/${ site }-${ run }/meta.json`, 'utf8' ) );
	meta.frames = meta.frames.map( ( f ) => ( { ...f, src: `file://${ here }frames/${ site }-${ run }/${ f.file }` } ) );
	return meta;
};
const sides = { elite: load( 'elite', eliteRun ), elementor: load( 'elementor', elementorRun ) };
const end = Math.ceil( ( Math.max( sides.elite.load, sides.elementor.load ) + 800 ) / 100 ) * 100;
const hold = 2000;

const font = 'file:///Users/Himaz/Projects/arcnest/assets/fonts/plus-jakarta-sans/PlusJakartaSans-Latin-VariableFont_wght.woff2';
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Jakarta; src: url(${ font }) format("woff2"); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; }
body { width: 960px; height: 900px; overflow: hidden; background: #26062f; font-family: Jakarta, sans-serif; color: #fff; -webkit-font-smoothing: antialiased; }
.top { display: flex; justify-content: center; align-items: center; height: 92px; gap: 14px; }
.clock { min-width: 150px; padding: 10px 20px; border-radius: 999px; background: rgba(255,255,255,.08); font-size: 34px; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.cap { color: #c9a6d9; font-size: 15px; font-weight: 600; }
.row { display: flex; justify-content: center; gap: 60px; }
.side { width: 390px; }
.label { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.label b { font-size: 22px; font-weight: 800; }
.label span { color: #c9a6d9; font-size: 13px; font-weight: 600; }
.phone { position: relative; width: 390px; height: 600px; overflow: hidden; border-radius: 22px; background: #fff; box-shadow: 0 0 0 6px rgba(255,255,255,.08); }
.phone img { position: absolute; top: 0; left: 0; width: 390px; }
.elite .phone { box-shadow: 0 0 0 6px #d7df23; }
.marks { display: grid; gap: 8px; margin-top: 16px; }
.mark { display: flex; justify-content: space-between; padding: 9px 14px; border-radius: 10px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.35); font-size: 15px; font-weight: 600; }
.mark.on { background: rgba(255,255,255,.12); color: #fff; }
.elite .mark.on b { color: #d7df23; }
.mark b { font-variant-numeric: tabular-nums; }
</style></head><body>
<div class="top"><div class="clock" id="clock">0.0 s</div><div class="cap">Home page · first visit · mid-range phone on 4G</div></div>
<div class="row">
${ [ [ 'elite', 'Arcnest', 'WP Elite + Elite Blocks' ], [ 'elementor', 'Elementor Pro', 'Hello theme' ] ].map( ( [ k, name, tag ] ) => `
<div class="side ${ k }"><div class="label"><b>${ name }</b><span>${ tag }</span></div>
<div class="phone"><img id="${ k }-img" alt=""></div>
<div class="marks">
<div class="mark" id="${ k }-fcp">First content <b>${ ( sides[ k ].fcp / 1000 ).toFixed( 1 ) } s</b></div>
<div class="mark" id="${ k }-lcp">Main element <b>${ ( sides[ k ].lcp / 1000 ).toFixed( 1 ) } s</b></div>
<div class="mark" id="${ k }-load">Fully loaded <b>${ ( sides[ k ].load / 1000 ).toFixed( 1 ) } s</b></div>
</div></div>` ).join( '' ) }
</div></body></html>`;

const work = `${ here }out/`;
rmSync( `${ work }png`, { recursive: true, force: true } );
mkdirSync( `${ work }png`, { recursive: true } );
writeFileSync( `${ work }race.html`, html );

const browser = await chromium.launch();
const page = await browser.newPage( { viewport: { width: 960, height: 900 }, deviceScaleFactor: 1 } );
await page.goto( `file://${ work }race.html` );
await page.evaluate( () => document.fonts.ready );

const total = Math.round( ( ( end + hold ) / 1000 ) * FPS );
for ( let n = 0; n < total; n++ ) {
	const t = Math.min( ( n / FPS ) * 1000, end );
	const state = Object.fromEntries( Object.entries( sides ).map( ( [ k, s ] ) => {
		const f = [ ...s.frames ].reverse().find( ( x ) => x.t <= t );
		return [ k, { src: f ? f.src : '', fcp: t >= s.fcp, lcp: t >= s.lcp, load: t >= s.load } ];
	} ) );
	await page.evaluate( ( { t, state } ) => {
		document.getElementById( 'clock' ).textContent = `${ ( t / 1000 ).toFixed( 1 ) } s`;
		for ( const [ k, s ] of Object.entries( state ) ) {
			const img = document.getElementById( `${ k }-img` );
			if ( s.src && img.getAttribute( 'src' ) !== s.src ) {
				img.setAttribute( 'src', s.src );
			}
			img.style.visibility = s.src ? 'visible' : 'hidden';
			for ( const m of [ 'fcp', 'lcp', 'load' ] ) {
				document.getElementById( `${ k }-${ m }` ).classList.toggle( 'on', s[ m ] );
			}
		}
	}, { t, state } );
	await page.waitForFunction( () => [ ...document.images ].every( ( i ) => ! i.getAttribute( 'src' ) || i.complete ) );
	await page.screenshot( { path: `${ work }png/${ String( n ).padStart( 4, '0' ) }.png` } );
}
await browser.close();

const ff = ( args ) => execFileSync( 'ffmpeg', [ '-loglevel', 'error', '-y', ...args ] );
ff( [ '-framerate', String( FPS ), '-i', `${ work }png/%04d.png`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${ work }race.mp4` ] );
ff( [ '-framerate', String( FPS ), '-i', `${ work }png/%04d.png`, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', `${ work }race.webm` ] );
ff( [ '-i', `${ work }png/${ String( total - 1 ).padStart( 4, '0' ) }.png`, '-q:v', '3', `${ work }race-poster.jpg` ] );
execFileSync( 'cwebp', [ '-quiet', '-q', '80', `${ work }png/${ String( total - 1 ).padStart( 4, '0' ) }.png`, '-o', `${ work }race-poster.webp` ] );
console.log( `Rendered ${ total } frames (${ ( end + hold ) / 1000 } s): out/race.mp4, race.webm, race-poster.jpg/webp` );
