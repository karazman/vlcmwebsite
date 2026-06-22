#!/usr/bin/env node
/**
 * Rewrite asset paths in Sanity Studio HTML for deployment at /studio
 */

import fs from 'fs';

const htmlPath = process.argv[2];

if (!htmlPath) {
    console.error('Usage: rewrite-studio-paths.js <html-file>');
    process.exit(1);
}

try {
    let html = fs.readFileSync(htmlPath, 'utf-8');
    const before = html.length;

    // Rewrite asset paths from /static/ to /studio/static/
    html = html.replace(/href="\/static\//g, 'href="/studio/static/');
    html = html.replace(/src="\/static\//g, 'src="/studio/static/');
    html = html.replace(/content="\/static\//g, 'content="/studio/static/');

    fs.writeFileSync(htmlPath, html, 'utf-8');

    const after = html.length;
    console.log(`✓ Rewritten ${htmlPath}`);
    console.log(`  Before: ${before} bytes`);
    console.log(`  After: ${after} bytes`);
} catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
}
