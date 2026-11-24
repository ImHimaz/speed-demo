/**
 * Budget phone + tap tests on the live demo sites (home page, first visit).
 *
 * Profiles: mid-range (CPU 4× slower, 1.6 Mbps) and budget (CPU 6× slower,
 * 0.75 Mbps); the real round trip to the US server comes on top. Per run:
 * FCP, LCP, load, and the main thread's blocking time (long tasks over
 * 50 ms, until 3 s after load). Then, once the page has settled, five taps,
 * each timed with the Event Timing API (what Google's INP uses: from the
 * tap to the next frame painted): open the menu, close it, the second tab,
 * the second FAQ item, the testimonials' next arrow.
 *
 * Runs alternate between the sites. Run: node phones.mjs [runs=5]
 * → ../results/phones-round2.json
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '/Users/Himaz/Projects/elite-blocks/node_modules/playwright/index.mjs';

const runs = Number( process.argv[ 2 ] || 5 );
const profiles = {
	'mid-range': { cpu: 4, down: 1.6 * 1024 * 1024, up: 750 * 1024 },
	budget: { cpu: 6, down: 750 * 1024, up: 250 * 1024 },
};
const SITES = {
	elite: { url: 'https://elite.arcnestpreview.com/', menu: '.wp-block-navigation__responsive-container-open', close: '.wp-block-navigation__responsive-container-close', tab: '#tabs [role="tab"]', faq: '#faq .elite-accordion button, #faq .elite-accordion summary', next: '#customers .elite-slider__next' },
	elementor: { url: 'https://elementor.arcnestpreview.com/', menu: '.e-n-menu-toggle', close: '.e-n-menu-toggle', tab: '#tabs .e-n-tab-title', faq: '#faq .e-n-accordion-item-title', next: '#customers .elementor-swiper-button-next' },
};
const TAPS = [ [ 'menu open', 'menu', 0 ], [ 'menu close', 'close', 0 ], [ 'tab', 'tab', 1 ], [ 'faq', 'faq', 1 ], [ 'slider next', 'next', 0 ] ];

const browser = await chromium.launch();
const results = {};
for ( const [ profile, p ] of Object.entries( profiles ) ) {
	results[ profile ] = { elite: [], elementor: [] };
	for ( let i = 1; i <= runs; i++ ) {
		for ( const [ site, s ] of Object.entries( SITES ) ) {
			const ctx = await browser.newContext( { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } );
			const page = await ctx.newPage();
			await page.addInitScript( () => {
				window.__m = { lcp: 0, tbt: 0, events: [] };
				new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => e.name === 'first-contentful-paint' && ( window.__m.fcp = e.startTime ) ) ).observe( { type: 'paint', buffered: true } );
				new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => ( window.__m.lcp = e.startTime ) ) ).observe( { type: 'largest-contentful-paint', buffered: true } );
				new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => {
					window.__m.tbt += Math.max( 0, e.duration - 50 );
				} ) ).observe( { type: 'longtask', buffered: true } );
				new PerformanceObserver( ( l ) => l.getEntries().forEach( ( e ) => {
					if ( e.interactionId ) {
						window.__m.events.push( { id: e.interactionId, d: e.duration, t: e.startTime } );
					}
				} ) ).observe( { type: 'event', durationThreshold: 16, buffered: true } );
			} );
			const cdp = await ctx.newCDPSession( page );
			await cdp.send( 'Network.enable' );
			await cdp.send( 'Network.setCacheDisabled', { cacheDisabled: true } );
			await cdp.send( 'Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: p.down / 8, uploadThroughput: p.up / 8 } );
			await cdp.send( 'Emulation.setCPUThrottlingRate', { rate: p.cpu } );
			await page.goto( `${ s.url }?ph=${ Date.now().toString( 36 ) }`, { waitUntil: 'load', timeout: 90000 } );
			await page.waitForTimeout( 3000 );
			const load = await page.evaluate( () => ( { ...window.__m, load: performance.getEntriesByType( 'navigation' )[ 0 ].loadEventEnd, events: undefined } ) );

			// Settle: dismiss nothing (the cookie banner stays, as for a new visitor).
			const taps = {};
			for ( const [ name, key, nth ] of TAPS ) {
				const el = page.locator( s[ key ] ).filter( { visible: true } ).nth( nth );
				if ( ! ( await el.count() ) ) {
					taps[ name ] = null;
					continue;
				}
				await el.scrollIntoViewIfNeeded().catch( () => {} );
				await page.waitForTimeout( 700 );
				const before = await page.evaluate( () => performance.now() );
				await el.tap( { force: true, timeout: 5000 } ).catch( () => {} );
				await page.waitForTimeout( 1200 );
				taps[ name ] = await page.evaluate( ( t0 ) => {
					const ev = window.__m.events.filter( ( e ) => e.t >= t0 - 5 );
					return ev.length ? Math.round( Math.max( ...ev.map( ( e ) => e.d ) ) ) : 0;
				}, before );
			}
			results[ profile ][ site ].push( { fcp: Math.round( load.fcp ), lcp: Math.round( load.lcp ), load: Math.round( load.load ), tbt: Math.round( load.tbt ), taps } );
			console.log( `${ profile } ${ site } ${ i }: FCP ${ Math.round( load.fcp ) } LCP ${ Math.round( load.lcp ) } load ${ Math.round( load.load ) } TBT ${ Math.round( load.tbt ) } | taps ${ JSON.stringify( taps ) }` );
			await ctx.close();
		}
	}
}
await browser.close();
writeFileSync( new URL( '../results/phones-round2.json', import.meta.url ), JSON.stringify( results, null, 1 ) );

const med = ( xs ) => {
	const v = xs.filter( ( x ) => x !== null && x !== undefined ).sort( ( a, b ) => a - b );
	return v.length ? v[ Math.floor( v.length / 2 ) ] : null;
};
for ( const [ profile, r ] of Object.entries( results ) ) {
	console.log( `\n${ profile } (median of ${ runs })` );
	for ( const k of [ 'fcp', 'lcp', 'load', 'tbt' ] ) {
		console.log( `  ${ k.padEnd( 12 ) } elite ${ String( med( r.elite.map( ( x ) => x[ k ] ) ) ).padStart( 6 ) } ms   elementor ${ String( med( r.elementor.map( ( x ) => x[ k ] ) ) ).padStart( 6 ) } ms` );
	}
	for ( const [ name ] of TAPS ) {
		console.log( `  tap ${ name.padEnd( 12 ) } elite ${ String( med( r.elite.map( ( x ) => x.taps[ name ] ) ) ).padStart( 4 ) } ms   elementor ${ String( med( r.elementor.map( ( x ) => x.taps[ name ] ) ) ).padStart( 4 ) } ms` );
	}
}
