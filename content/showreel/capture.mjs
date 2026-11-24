/**
 * Arcnest home page video, step 1: capture the Elite demo (localhost:8894)
 * frame by frame, so scrolling and typing are smooth whatever the machine.
 *
 *   editor/  the home page in the block editor: the headline retyped, then a
 *            "Call to action" section added from the pattern library (not
 *            saved: the demo's content stays as it is)
 *   desk/    the home page on a laptop, scrolling down
 *   phone/   the same on a phone, scrolling down
 *
 * Each folder gets JPEG screenshots and timeline.json (one entry per output
 * frame at 30 fps: the screenshot and, in the editor, the pointer). compose.mjs
 * puts them together.
 *
 * Run: WORK=/path/to/work node capture.mjs [editor|desk|phone…]
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const SITE = 'http://localhost:8894';
const FPS = 30;
const WORK = process.env.WORK;
if ( ! WORK ) {
	throw new Error( 'Set WORK to a folder for the frames.' );
}
const only = process.argv.slice( 2 );
const want = ( name ) => ! only.length || only.includes( name );
const ease = ( x ) => ( x < 0.5 ? 4 * x * x * x : 1 - Math.pow( -2 * x + 2, 3 ) / 2 );

/** A recorder: screenshots plus the output timeline. */
function recorder( page, dir ) {
	rmSync( dir, { recursive: true, force: true } );
	mkdirSync( dir, { recursive: true } );
	const timeline = [];
	let n = 0;
	let file = null;
	let cursor = null;
	return {
		get cursor() {
			return cursor;
		},
		set cursor( c ) {
			cursor = c;
		},
		async snap() {
			file = `${ String( n++ ).padStart( 4, '0' ) }.jpg`;
			await page.screenshot( { path: `${ dir }/${ file }`, type: 'jpeg', quality: 90 } );
		},
		push( extra = {} ) {
			timeline.push( { file, cursor: cursor ? { ...cursor } : null, ...extra } );
		},
		hold( seconds ) {
			for ( let i = 0; i < Math.round( seconds * FPS ); i++ ) {
				this.push();
			}
		},
		async move( to, seconds = 0.7 ) {
			const from = cursor || to;
			const count = Math.round( seconds * FPS );
			for ( let i = 1; i <= count; i++ ) {
				const p = ease( i / count );
				cursor = { x: from.x + ( to.x - from.x ) * p, y: from.y + ( to.y - from.y ) * p };
				this.push();
			}
		},
		click() {
			timeline.push( { file, cursor: { ...cursor }, click: true } );
		},
		save( meta ) {
			writeFileSync( `${ dir }/timeline.json`, JSON.stringify( { ...meta, frames: timeline } ) );
			console.log( `${ dir }: ${ n } shots, ${ timeline.length } frames (${ ( timeline.length / FPS ).toFixed( 1 ) } s)` );
		},
	};
}

const center = async ( locator ) => {
	const b = await locator.boundingBox();
	return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

const browser = await chromium.launch();

// Log in (for the editor; the front-end clips are recorded logged out).
const context = await browser.newContext( { viewport: { width: 1440, height: 840 }, deviceScaleFactor: 1.25 } );
if ( want( 'editor' ) ) {
const login = await context.newPage();
await login.goto( `${ SITE }/wp-login.php`, { waitUntil: 'commit' } );
await login.waitForSelector( '#user_login' );
await login.fill( '#user_login', 'admin' );
await login.fill( '#user_pass', 'password' );
await login.click( '#wp-submit' );
await login.waitForURL( /wp-admin/ );
await login.close();
}

if ( want( 'editor' ) ) {
	const page = await context.newPage();
	await page.goto( `${ SITE }/wp-admin/post.php?post=26&action=edit` );
	await page.waitForFunction( () => window.wp?.data?.select( 'core/block-editor' ).getBlocks().length > 0, null, { timeout: 60000 } );
	// Full screen, no welcome guide (saved for the admin user; applies on a
	// reload).
	await page.evaluate( () => {
		const prefs = window.wp.data.dispatch( 'core/preferences' );
		prefs.set( 'core/edit-post', 'welcomeGuide', false );
		prefs.set( 'core/edit-post', 'fullscreenMode', true );
		prefs.set( 'core', 'fullscreenMode', true );
		prefs.set( 'core', 'fixedToolbar', false );
		prefs.set( 'core', 'distractionFree', false );
	} );
	await page.waitForTimeout( 1000 );
	await page.reload();
	await page.waitForFunction( () => window.wp?.data?.select( 'core/block-editor' ).getBlocks().length > 0, null, { timeout: 60000 } );
	// Full screen (no admin bar) and the block settings sidebar open.
	await page.evaluate( () => {
		document.body.classList.add( 'is-fullscreen-mode' );
		window.wp.data.dispatch( 'core/interface' ).enableComplementaryArea( 'core', 'edit-post/block' );
	} );
	// Video only: no Yoast box along the bottom, no admin bar.
	await page.addStyleTag( { content: '.edit-post-meta-boxes-main, .edit-post-layout__metaboxes, #wpadminbar { display: none !important; } html.wp-toolbar { padding-top: 0 !important; } .interface-interface-skeleton { top: 0 !important; }' } );
	const canvas = page.frameLocator( 'iframe[name="editor-canvas"]' );
	const h1 = canvas.locator( '.elite-section--hero h1' ).first();
	await h1.waitFor();
	await page.waitForTimeout( 3000 ); // Images and fonts.
	// Start at the hero (the page title above it out of view).
	await page.frame( { name: 'editor-canvas' } ).evaluate( () => {
		const hero = document.querySelector( '.elite-section--hero' );
		scrollTo( 0, hero.getBoundingClientRect().top + scrollY );
	} );
	await page.waitForTimeout( 500 );
	const rec = recorder( page, `${ WORK }/editor` );

	rec.cursor = { x: 1060, y: 640 };
	await rec.snap();
	rec.hold( 1.2 );

	// The headline: click it, select its text, type a new one.
	await rec.move( await center( h1 ), 0.8 );
	await h1.click();
	await page.keyboard.press( 'ControlOrMeta+a' );
	await page.waitForTimeout( 300 );
	await rec.snap();
	rec.click();
	rec.hold( 0.6 );
	for ( const ch of 'Know what every customer needs next' ) {
		await page.keyboard.type( ch );
		await rec.snap();
		rec.push();
		rec.push();
	}
	rec.hold( 1.2 );

	// Select the hero section (the new section goes after it), then add a
	// "Call to action" from the pattern library.
	await page.evaluate( () => {
		const { select, dispatch } = window.wp.data;
		const hero = select( 'core/block-editor' ).getBlocks().find( ( b ) => ( b.attributes.className || '' ).includes( 'elite-section--hero' ) );
		if ( hero ) {
			dispatch( 'core/block-editor' ).selectBlock( hero.clientId );
		}
	} );
	await page.waitForTimeout( 400 );
	await rec.snap();
	rec.hold( 0.3 );

	const toggle = page.locator( 'button.editor-document-tools__inserter-toggle, button[aria-label="Block Inserter"], button[aria-label="Toggle block inserter"]' ).first();
	await rec.move( await center( toggle ), 0.8 );
	await toggle.click();
	await page.waitForTimeout( 800 );
	await rec.snap();
	rec.click();
	rec.hold( 0.5 );

	const tab = page.getByRole( 'tab', { name: 'Patterns' } );
	await rec.move( await center( tab ), 0.6 );
	await tab.click();
	await page.waitForTimeout( 800 );
	await rec.snap();
	rec.click();
	rec.hold( 0.4 );

	const category = page.getByRole( 'tabpanel' ).getByText( 'Call to action', { exact: true } ).first();
	await rec.move( await center( category ), 0.6 );
	await category.click();
	const result = page.locator( '.block-editor-inserter__category-panel .block-editor-block-patterns-list__item' ).first();
	await result.waitFor();
	await page.waitForTimeout( 3000 ); // The preview renders.
	await rec.snap();
	rec.click();
	rec.hold( 0.9 );

	await rec.move( await center( result ), 0.7 );
	await result.click();
	await page.waitForTimeout( 1200 );
	await rec.snap();
	rec.click();
	rec.hold( 0.7 );

	// Close the inserter: the canvas widens, the new section in view.
	await rec.move( await center( toggle ), 0.6 );
	await toggle.click();
	await page.evaluate( () => window.wp.data.dispatch( 'core/interface' ).enableComplementaryArea( 'core', 'edit-post/block' ) );
	await page.waitForTimeout( 1200 );
	await rec.snap();
	rec.click();
	rec.hold( 0.4 );
	rec.cursor = { ...rec.cursor, hide: true };
	rec.hold( 2.4 );
	rec.save( { width: 1440, height: 840, scale: 1.25 } );
	await page.close();
}

/** A front-end scroll: top to `distance` px over `seconds`, after a hold. */
async function scroll( name, viewport, scale, distance ) {
	const ctx = await browser.newContext( { viewport, deviceScaleFactor: scale, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 } );
	const page = await ctx.newPage();
	await page.goto( `${ SITE }/`, { waitUntil: 'load' } );
	// The cookie banner: rejected, so it's gone for the recording.
	const reject = page.getByRole( 'button', { name: /reject all/i } ).first();
	await reject.waitFor( { state: 'visible', timeout: 10000 } ).catch( () => {} );
	if ( await reject.isVisible() ) {
		await reject.click();
		await page.waitForTimeout( 1000 );
	}
	// Video only: no cookie-settings badge in the corner.
	await page.addStyleTag( { content: '.cky-btn-revisit-wrapper { display: none !important; }' } );
	// One pass first: lazy images load and entrances run.
	await page.evaluate( async () => {
		for ( let y = 0; y < document.body.scrollHeight; y += 300 ) {
			scrollTo( 0, y );
			await new Promise( ( r ) => setTimeout( r, 80 ) );
		}
		scrollTo( 0, 0 );
	} );
	await page.waitForTimeout( 2000 );
	const rec = recorder( page, `${ WORK }/${ name }` );
	await rec.snap();
	rec.hold( 0.8 );
	const count = Math.round( 11 * FPS );
	for ( let i = 1; i <= count; i++ ) {
		await page.evaluate( ( y ) => scrollTo( 0, y ), Math.round( distance * ease( i / count ) ) );
		await rec.snap();
		rec.push();
	}
	rec.hold( 0.6 );
	rec.save( { width: viewport.width, height: viewport.height, scale } );
	await ctx.close();
}

if ( want( 'desk' ) ) {
	await scroll( 'desk', { width: 1440, height: 900 }, 1, 3200 );
}
if ( want( 'phone' ) ) {
	await scroll( 'phone', { width: 390, height: 844 }, 2, 4200 );
}
await browser.close();
