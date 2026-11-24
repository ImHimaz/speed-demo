/**
 * Lighthouse comparison: Elite Blocks (8894) vs Elementor (8896).
 *
 * For each page and device (mobile: Lighthouse's default, a mid-range phone,
 * 4x CPU slowdown, simulated slow 4G; desktop: its desktop preset), N runs
 * per site, alternating so any slowdown of this machine hits both. All four
 * categories unless --perf-only. Results: results/<round>/<device>-<page>/
 * <site>-<n>.json and summary.json (median, min–max).
 *
 * Run: node lighthouse.mjs <round-name> [runs=5] [--pages=home,pricing,post]
 *      [--devices=mobile,desktop] [--perf-only]
 * Needs LH_BIN (lighthouse CLI) and CHROME_PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice( 2 );
const flag = ( name, fallback ) => ( args.find( ( a ) => a.startsWith( `--${ name }=` ) )?.split( '=' )[ 1 ] ?? fallback );
const positional = args.filter( ( a ) => ! a.startsWith( '--' ) );
const round = positional[ 0 ] || 'round';
const runs = Number( positional[ 1 ] || 5 );
const perfOnly = args.includes( '--perf-only' );

const sites = { elite: 'http://localhost:8894', elementor: 'http://localhost:8896' };
const PAGES = {
	home: '/',
	pricing: '/pricing/',
	post: '/how-to-run-a-feedback-review-your-whole-team-will-join/',
	about: '/about/',
	contact: '/contact/',
	blog: '/blog/',
};
const pages = flag( 'pages', 'home' ).split( ',' );
const devices = flag( 'devices', 'mobile' ).split( ',' );

const lighthouse = ( url, device, out ) => execFileSync( process.env.LH_BIN, [
	url, '--quiet', '--output=json', `--output-path=${ out }`,
	...( perfOnly ? [ '--only-categories=performance' ] : [] ),
	...( device === 'desktop' ? [ '--preset=desktop' ] : [] ),
	'--chrome-flags=--headless=new --no-sandbox',
] );

// Warm up: PHP, object caches, generated CSS files.
for ( const base of Object.values( sites ) ) {
	for ( const page of pages ) {
		for ( let i = 0; i < 3; i++ ) {
			execFileSync( 'curl', [ '-s', '-o', '/dev/null', base + PAGES[ page ] ] );
		}
	}
}

const pick = ( lhr ) => {
	const a = lhr.audits;
	const num = ( id ) => a[ id ]?.numericValue ?? null;
	const score = ( id ) => ( lhr.categories[ id ] ? Math.round( lhr.categories[ id ].score * 100 ) : null );
	const requests = a[ 'network-requests' ]?.details?.items ?? [];
	const by = ( type ) => requests.filter( ( r ) => r.resourceType === type );
	const kb = ( items ) => Math.round( items.reduce( ( s, r ) => s + ( r.transferSize || 0 ), 0 ) / 1024 );
	return {
		performance: score( 'performance' ),
		accessibility: score( 'accessibility' ),
		bestPractices: score( 'best-practices' ),
		seo: score( 'seo' ),
		fcp: num( 'first-contentful-paint' ),
		lcp: num( 'largest-contentful-paint' ),
		tbt: num( 'total-blocking-time' ),
		cls: num( 'cumulative-layout-shift' ),
		si: num( 'speed-index' ),
		ttfb: num( 'server-response-time' ),
		requests: requests.length,
		totalKB: Math.round( ( num( 'total-byte-weight' ) ?? 0 ) / 1024 ),
		jsKB: kb( by( 'Script' ) ),
		cssKB: kb( by( 'Stylesheet' ) ),
		jsFiles: by( 'Script' ).length,
		cssFiles: by( 'Stylesheet' ).length,
		dom: num( 'dom-size' ) ?? a[ 'dom-size-insight' ]?.numericValue ?? null,
	};
};
const median = ( xs ) => {
	const s = [ ...xs ].sort( ( p, q ) => p - q );
	return s[ Math.floor( s.length / 2 ) ];
};
const ms = [ 'fcp', 'lcp', 'si', 'tbt', 'ttfb' ];
const fmt = ( k, v ) => ( v === null || v === undefined ? '–' : ms.includes( k ) ? `${ Math.round( v ) } ms` : k === 'cls' ? v.toFixed( 3 ) : String( v ) );

const summary = {};
for ( const device of devices ) {
	// One discarded run per site: the first run of a session pays for the
	// browser's cold start, not the page.
	for ( const base of Object.values( sites ) ) {
		lighthouse( base + PAGES[ pages[ 0 ] ], device, '/dev/null' );
	}
	for ( const page of pages ) {
		const dir = new URL( `./results/${ round }/${ device }-${ page }/`, import.meta.url );
		mkdirSync( dir, { recursive: true } );
		for ( let i = 1; i <= runs; i++ ) {
			for ( const [ name, base ] of Object.entries( sites ) ) {
				lighthouse( base + PAGES[ page ], device, new URL( `${ name }-${ i }.json`, dir ).pathname );
			}
			process.stdout.write( `${ device } ${ page } run ${ i }/${ runs } done\n` );
		}
		const key = `${ device } ${ page }`;
		summary[ key ] = {};
		for ( const name of Object.keys( sites ) ) {
			const rows = [];
			for ( let i = 1; i <= runs; i++ ) {
				rows.push( pick( JSON.parse( readFileSync( new URL( `${ name }-${ i }.json`, dir ), 'utf8' ) ) ) );
			}
			summary[ key ][ name ] = Object.fromEntries( Object.keys( rows[ 0 ] ).map( ( k ) => {
				const xs = rows.map( ( r ) => r[ k ] ).filter( ( x ) => x !== null );
				return [ k, xs.length ? { median: median( xs ), min: Math.min( ...xs ), max: Math.max( ...xs ) } : null ];
			} ) );
			summary[ key ][ name ].runs = rows;
		}
		writeFileSync( new URL( `./results/${ round }/summary.json`, import.meta.url ), JSON.stringify( summary, null, 1 ) );

		console.log( `\n${ round } · ${ key }: median (min–max) of ${ runs } runs` );
		console.log( 'metric'.padEnd( 14 ), 'Elite Blocks'.padEnd( 30 ), 'Elementor' );
		for ( const k of Object.keys( summary[ key ].elite ).filter( ( x ) => x !== 'runs' ) ) {
			const cell = ( s ) => ( s[ k ] ? `${ fmt( k, s[ k ].median ) } (${ fmt( k, s[ k ].min ) }–${ fmt( k, s[ k ].max ) })` : '–' );
			console.log( k.padEnd( 14 ), cell( summary[ key ].elite ).padEnd( 30 ), cell( summary[ key ].elementor ) );
		}
	}
}
