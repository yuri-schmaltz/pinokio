#!/usr/bin/env node

/**
 * Sync Vendor Script
 * 
 * Copies UX-improved files from pinokio_vendor/ to node_modules/pinokiod/
 * This ensures our UI improvements persist after npm install
 */

const fs = require('fs-extra');
const path = require('path');

const vendorDir = path.join(__dirname, '..', 'pinokio_vendor', 'server');
const targetDir = path.join(__dirname, '..', 'node_modules', 'pinokiod', 'server');

console.log('🔄 Syncing vendored pinokiod files...');

try {
    // Check if vendor directory exists
    if (!fs.existsSync(vendorDir)) {
        console.log('⚠️  No pinokio_vendor directory found. Skipping sync.');
        process.exit(0);
    }

    // Check if target directory exists
    if (!fs.existsSync(targetDir)) {
        console.log('⚠️  pinokiod not installed. Skipping sync.');
        process.exit(0);
    }

    // Copy views
    const viewsSource = path.join(vendorDir, 'views');
    const viewsTarget = path.join(targetDir, 'views');

    if (fs.existsSync(viewsSource)) {
        fs.copySync(viewsSource, viewsTarget, { overwrite: true });
        console.log('✅ Synced views/');
    }

    // Copy public assets
    const publicSource = path.join(vendorDir, 'public');
    const publicTarget = path.join(targetDir, 'public');

    if (fs.existsSync(publicSource)) {
        fs.copySync(publicSource, publicTarget, { overwrite: true });
        console.log('✅ Synced public/');
    }

    console.log('✨ Vendor sync complete!');
} catch (error) {
    console.error('❌ Error syncing vendor files:', error.message);
    process.exit(1);
}
