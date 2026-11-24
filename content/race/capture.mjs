/**
 * Loading race, step 1: record each live demo site loading as a first-time
 * visitor (no cache, no cookies) on a throttled phone, frame by frame.
 *
 * Phone: 390×844 at 2×, CPU slowed 4× (PageSpeed's mobile setting), network
 * capped at 1.6 Mbps down / 750 kbps up (PageSpeed's simulated 4G; the real
 * round trip to the US server is added on top). Runs alternate between the
 * sites. For each run: frames (JPEG, with their time since navigation) and
 * the page's own FCP / LCP / load times.
 *
 * Run: node capture.mjs [runs=3] [page=/]  → frames/<site>-<n>/
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const runs = Number( process.argv[ 2 ] || 3 );
const path = process.argv[ 3 ] || '/';
const sites = { elite: 'https://elite.arcnestpreview.com', elementor: 'https://elementor.arcnestpreview.com' };
const out = new URL( './frames/', import.meta.url );

const browser = await chromium.launch();
const summary = [];
for ( let i = 1; i <= runs; i++ ) {
	for ( const [ site, base ] of Object.entries( sites ) ) {
		const dir = new URL( `./${ site }-${ i }/`, out );
		rmSync( dir, { recursive: true, force: true } );
		mkdirSync( dir, { recursive: true } );

		const ctx = await browser.newContext( { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } );
		const page = await ctx.newPage();
		await page.addInitScript( () => {
			window.__m = { lcp: 0, cls: 0 };
			new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => {
				if ( ! e.hadRecentInput ) {
					window.__m.cls += e.value;
				}
			} ) ).observe( { type: 'layout-shift', buffered: true } );
			new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => {
				if ( e.name === 'first-contentful-paint' ) {
					window.__m.fcp = e.startTime;
				}
			} ) ).observe( { type: 'paint', buffered: true } );
			new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => {
				window.__m.lcp = e.startTime;
				window.__m.lcpEl = ( e.element?.tagName || '' ) + '.' + ( e.element?.className || '' ).toString().slice( 0, 60 );
			} ) ).observe( { type: 'largest-contentful-paint', buffered: true } );
		} );
		const cdp = await ctx.newCDPSession( page );
		await cdp.send( 'Network.enable' );
		await cdp.send( 'Network.setCacheDisabled', { cacheDisabled: true } );
		await cdp.send( 'Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: ( 1.6 * 1024 * 1024 ) / 8, uploadThroughput: ( 750 * 1024 ) / 8 } );
		await cdp.send( 'Emulation.setCPUThrottlingRate', { rate: 4 } );

		const frames = [];
		cdp.on( 'Page.screencastFrame', async ( f ) => {
			frames.push( { ts: f.metadata.timestamp * 1000, data: f.data } );
			await cdp.send( 'Page.screencastFrameAck', { sessionId: f.sessionId } ).catch( () => {} );
		} );
		await page.goto( 'about:blank' );
		await cdp.send( 'Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 } );
		const wallStart = Date.now();
		await page.goto( `${ base }${ path }?race=${ Date.now().toString( 36 ) }`, { waitUntil: 'load', timeout: 60000 } );
		await page.waitForTimeout( 4000 );
		await cdp.send( 'Page.stopScreencast' );

		const m = await page.evaluate( () => ( { ...window.__m, origin: performance.timeOrigin, load: performance.getEntriesByType( 'navigation' )[ 0 ]?.loadEventEnd } ) );
		const kept = frames.filter( ( f ) => f.ts >= m.origin - 50 ).map( ( f, n ) => {
			const t = Math.max( 0, Math.round( f.ts - m.origin ) );
			const file = `f${ String( n ).padStart( 4, '0' ) }.jpg`;
			writeFileSync( new URL( file, dir ), Buffer.from( f.data, 'base64' ) );
			return { t, file };
		} );
		const meta = { site, run: i, fcp: Math.round( m.fcp ), lcp: Math.round( m.lcp ), lcpEl: m.lcpEl, load: Math.round( m.load ), cls: Number( m.cls.toFixed( 3 ) ), frames: kept, wallMs: Date.now() - wallStart };
		writeFileSync( new URL( 'meta.json', dir ), JSON.stringify( meta ) );
		summary.push( meta );
		console.log( `${ site } run ${ i }: FCP ${ meta.fcp } ms, LCP ${ meta.lcp } ms (${ meta.lcpEl }), load ${ meta.load } ms, CLS ${ meta.cls }, ${ kept.length } frames` );
		await ctx.close();
	}
}
writeFileSync( new URL( 'summary.json', out ), JSON.stringify( summary.map( ( { frames, ...r } ) => r ), null, 1 ) );
await browser.close();
