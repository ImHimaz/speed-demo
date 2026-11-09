/**
 * Lighthouse comparison: Elite Blocks (8894) vs Elementor (8896).
 *
 * Mobile (Lighthouse's default: a mid-range phone, 4x CPU slowdown,
 * simulated slow 4G), performance only, N runs per site, alternating so
 * any slowdown of this machine hits both. Results: results/<round>/*.json
 * and a summary (median, min–max).
 *
 * Run: node lighthouse.mjs <round-name> [runs=5]
 * Needs LH_BIN (lighthouse CLI) and CHROME_PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const round = process.argv[ 2 ] || 'round';
const runs = Number( process.argv[ 3 ] || 5 );
const sites = { elite: 'http://localhost:8894/', elementor: 'http://localhost:8896/' };
const dir = new URL( `./results/${ round }/`, import.meta.url );
mkdirSync( dir, { recursive: true } );

// Warm up: PHP, object caches, Elementor's generated CSS files.
for ( const url of Object.values( sites ) ) {
	for ( let i = 0; i < 3; i++ ) {
		execFileSync( 'curl', [ '-s', '-o', '/dev/null', url ] );
	}
}

// One discarded Lighthouse run per site: the first run of a session pays
// for the browser's cold start, not the page.
for ( const url of Object.values( sites ) ) {
	execFileSync( process.env.LH_BIN, [ url, '--quiet', '--only-categories=performance', '--output=json', '--output-path=/dev/null', '--chrome-flags=--headless=new --no-sandbox' ] );
}

for ( let i = 1; i <= runs; i++ ) {
	for ( const [ name, url ] of Object.entries( sites ) ) {
		const out = new URL( `${ name }-${ i }.json`, dir ).pathname;
		execFileSync( process.env.LH_BIN, [
			url, '--quiet', '--only-categories=performance', '--output=json', `--output-path=${ out }`,
			'--chrome-flags=--headless=new --no-sandbox',
		], { stdio: 'inherit' } );
		process.stdout.write( `${ name } run ${ i } done\n` );
	}
}

// Summary.
const pick = ( lhr ) => {
	const a = lhr.audits;
	const num = ( id ) => a[ id ]?.numericValue ?? null;
	const requests = a[ 'network-requests' ]?.details?.items ?? [];
	const by = ( type ) => requests.filter( ( r ) => r.resourceType === type );
	const kb = ( items ) => Math.round( items.reduce( ( s, r ) => s + ( r.transferSize || 0 ), 0 ) / 1024 );
	return {
		score: Math.round( ( lhr.categories.performance.score ?? 0 ) * 100 ),
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
		dom: num( 'dom-size' ) ?? lhr.audits[ 'dom-size-insight' ]?.numericValue ?? null,
		mainThreadMs: num( 'mainthread-work-breakdown' ),
		jsBootMs: num( 'bootup-time' ),
	};
};
const median = ( xs ) => { const s = [ ...xs ].sort( ( p, q ) => p - q ); return s[ Math.floor( s.length / 2 ) ]; };
const summary = {};
for ( const name of Object.keys( sites ) ) {
	const rows = [];
	for ( let i = 1; i <= runs; i++ ) {
		rows.push( pick( JSON.parse( readFileSync( new URL( `${ name }-${ i }.json`, dir ), 'utf8' ) ) ) );
	}
	summary[ name ] = Object.fromEntries( Object.keys( rows[ 0 ] ).map( ( k ) => {
		const xs = rows.map( ( r ) => r[ k ] ).filter( ( x ) => x !== null );
		return [ k, { median: median( xs ), min: Math.min( ...xs ), max: Math.max( ...xs ) } ];
	} ) );
	summary[ name ].runs = rows;
}
writeFileSync( new URL( 'summary.json', dir ), JSON.stringify( summary, null, 1 ) );

const fmt = ( k, v ) => ( [ 'fcp', 'lcp', 'si', 'tbt', 'ttfb', 'mainThreadMs', 'jsBootMs' ].includes( k ) ? `${ Math.round( v ) } ms` : k === 'cls' ? v.toFixed( 3 ) : String( v ) );
console.log( `\n${ round }: median (min–max) of ${ runs } runs\n` );
console.log( 'metric'.padEnd( 14 ), 'Elite Blocks'.padEnd( 30 ), 'Elementor' );
for ( const k of Object.keys( summary.elite ).filter( ( x ) => x !== 'runs' ) ) {
	const cell = ( s ) => `${ fmt( k, s[ k ].median ) } (${ fmt( k, s[ k ].min ) }–${ fmt( k, s[ k ].max ) })`;
	console.log( k.padEnd( 14 ), cell( summary.elite ).padEnd( 30 ), cell( summary.elementor ) );
}
