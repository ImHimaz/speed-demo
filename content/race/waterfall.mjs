/**
 * What each page fetches before its first paint, on the race's throttled
 * phone: every resource that finished before FCP (or blocks rendering),
 * with its size and timing.
 *
 * Run: node waterfall.mjs [path=/]
 */
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const path = process.argv[ 2 ] || '/';
const sites = { elite: 'https://elite.arcnestpreview.com', elementor: 'https://elementor.arcnestpreview.com' };
const browser = await chromium.launch();
for ( const [ site, base ] of Object.entries( sites ) ) {
	const ctx = await browser.newContext( { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } );
	const page = await ctx.newPage();
	await page.addInitScript( () => {
		window.__fcp = 0;
		new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => {
			if ( e.name === 'first-contentful-paint' ) {
				window.__fcp = e.startTime;
			}
		} ) ).observe( { type: 'paint', buffered: true } );
	} );
	const cdp = await ctx.newCDPSession( page );
	await cdp.send( 'Network.enable' );
	await cdp.send( 'Network.setCacheDisabled', { cacheDisabled: true } );
	await cdp.send( 'Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: ( 1.6 * 1024 * 1024 ) / 8, uploadThroughput: ( 750 * 1024 ) / 8 } );
	await cdp.send( 'Emulation.setCPUThrottlingRate', { rate: 4 } );
	await page.goto( `${ base }${ path }?wf=${ Date.now().toString( 36 ) }`, { waitUntil: 'load', timeout: 60000 } );
	await page.waitForTimeout( 2000 );
	const r = await page.evaluate( () => {
		const nav = performance.getEntriesByType( 'navigation' )[ 0 ];
		const res = performance.getEntriesByType( 'resource' ).map( ( e ) => ( {
			name: e.name.replace( location.origin, '' ).split( '?' )[ 0 ].slice( -70 ),
			type: e.initiatorType, start: Math.round( e.startTime ), end: Math.round( e.responseEnd ),
			kb: Math.round( e.transferSize / 1024 ), blocking: e.renderBlockingStatus,
		} ) );
		return { fcp: Math.round( window.__fcp ), ttfb: Math.round( nav.responseStart ), html: Math.round( nav.responseEnd ), htmlKB: Math.round( nav.transferSize / 1024 ), res };
	} );
	const before = r.res.filter( ( x ) => x.end <= r.fcp || x.blocking === 'blocking' );
	console.log( `\n== ${ site } ${ path }: TTFB ${ r.ttfb } ms, HTML done ${ r.html } ms (${ r.htmlKB } KB), FCP ${ r.fcp } ms` );
	console.log( `   finished before FCP or render-blocking: ${ before.length } files, ${ before.reduce( ( s, x ) => s + x.kb, 0 ) } KB` );
	for ( const x of before.sort( ( a, b ) => a.start - b.start ) ) {
		console.log( `   ${ String( x.start ).padStart( 5 ) }–${ String( x.end ).padStart( 5 ) } ms ${ String( x.kb ).padStart( 4 ) } KB ${ x.blocking === 'blocking' ? 'BLOCKING' : '        ' } ${ x.type.padEnd( 6 ) } ${ x.name }` );
	}
	await ctx.close();
}
await browser.close();
