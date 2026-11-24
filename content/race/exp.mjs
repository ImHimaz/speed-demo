// Elite variants vs Elementor on the race's throttled phone: FCP / LCP / load,
// median of 3 alternating runs each.
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';
const variants = {
	'elite (now)': 'https://elite.arcnestpreview.com/?',
	'elite A: no font preload': 'https://elite.arcnestpreview.com/?exp=a&',
	'elite B: A + CSS inlined': 'https://elite.arcnestpreview.com/?exp=b&',
	elementor: 'https://elementor.arcnestpreview.com/?',
};
const browser = await chromium.launch();
const res = Object.fromEntries( Object.keys( variants ).map( ( k ) => [ k, [] ] ) );
for ( let i = 0; i < 3; i++ ) {
	for ( const [ name, url ] of Object.entries( variants ) ) {
		const ctx = await browser.newContext( { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } );
		const page = await ctx.newPage();
		await page.addInitScript( () => {
			window.__m = {};
			new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => e.name === 'first-contentful-paint' && ( window.__m.fcp = e.startTime ) ) ).observe( { type: 'paint', buffered: true } );
			new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => ( window.__m.lcp = e.startTime ) ) ).observe( { type: 'largest-contentful-paint', buffered: true } );
		} );
		const cdp = await ctx.newCDPSession( page );
		await cdp.send( 'Network.enable' );
		await cdp.send( 'Network.setCacheDisabled', { cacheDisabled: true } );
		await cdp.send( 'Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: ( 1.6 * 1024 * 1024 ) / 8, uploadThroughput: ( 750 * 1024 ) / 8 } );
		await cdp.send( 'Emulation.setCPUThrottlingRate', { rate: 4 } );
		await page.goto( `${ url }x=${ Date.now().toString( 36 ) }`, { waitUntil: 'load', timeout: 60000 } );
		await page.waitForTimeout( 1500 );
		const m = await page.evaluate( () => ( { ...window.__m, load: performance.getEntriesByType( 'navigation' )[ 0 ].loadEventEnd, ttfb: performance.getEntriesByType( 'navigation' )[ 0 ].responseStart } ) );
		res[ name ].push( m );
		await ctx.close();
	}
}
const med = ( xs ) => xs.sort( ( a, b ) => a - b )[ 1 ];
for ( const [ name, rows ] of Object.entries( res ) ) {
	console.log( name.padEnd( 26 ), [ 'ttfb', 'fcp', 'lcp', 'load' ].map( ( k ) => `${ k } ${ String( Math.round( med( rows.map( ( r ) => r[ k ] ) ) ) ).padStart( 5 ) } ms` ).join( '  ' ), '  runs FCP:', rows.map( ( r ) => Math.round( r.fcp ) ).join( '/' ) );
}
await browser.close();
