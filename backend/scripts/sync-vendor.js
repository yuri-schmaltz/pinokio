#!/usr/bin/env node

/**
 * Sync Vendor Script
 * 
 * 1. Copies UX-improved files from pinokio_vendor/ to node_modules/pinokiod/
 * 2. Prepares Tauri resources (symlinking pinokiod and package.json)
 */

const fs = require('fs-extra');
const path = require('path');

async function run() {
    console.log('🔄 Pinokio System Sync...');

    try {
        // --- 1. UI UX Sync ---
        // pinokio_vendor is at root, script is in backend/scripts/
        const rootDir = path.join(__dirname, '..', '..');
        const vendorDir = path.join(rootDir, 'pinokio_vendor', 'server');
        const targetDir = path.join(rootDir, 'node_modules', 'pinokiod', 'server');

        if (fs.existsSync(vendorDir) && fs.existsSync(targetDir)) {
            console.log('🖼️ Syncing vendored UI files...');

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
        } else {
            console.log('ℹ️ Skipping UI sync (vendor or target missing).');
        }

        // --- 2. Tauri Resource Preparation ---
        const tauriDir = path.join(__dirname, '..', 'tauri');
        const tauriVendorDir = path.join(tauriDir, 'node_modules_vendor');
        const tauriPackageJson = path.join(tauriDir, 'package.json.vendor');

        if (fs.existsSync(tauriDir)) {
            console.log('🔧 Preparing Tauri resources...');

            fs.ensureDirSync(tauriVendorDir);

            const pinokiodSource = path.join(rootDir, 'node_modules_vendor_cache', 'pinokiod'); // wait, where is the source? 
            // Ah, the source is node_modules/pinokiod after step 1
            const sourceOfTrue = path.join(rootDir, 'node_modules', 'pinokiod');
            const pinokiodTarget = path.join(tauriVendorDir, 'pinokiod');

            if (fs.existsSync(sourceOfTrue)) {
                fs.ensureDirSync(pinokiodTarget);

                // Always Force Sync UI components (Views/Public)
                const uiDirs = ['server/views', 'server/public'];
                for (const sub of uiDirs) {
                    const src = path.join(sourceOfTrue, sub);
                    const dest = path.join(pinokiodTarget, sub);
                    if (fs.existsSync(src)) {
                        fs.copySync(src, dest, { overwrite: true });
                        console.log(`✅ Forced sync of ${sub} to Tauri`);
                    }
                }

                // Sync the rest (script, etc.) only if missing to maintain speed
                const coreDirs = ['script', 'server/routes', 'server/index.js'];
                for (const sub of coreDirs) {
                    const src = path.join(sourceOfTrue, sub);
                    const dest = path.join(pinokiodTarget, sub);
                    if (fs.existsSync(src) && !fs.existsSync(dest)) {
                        fs.copySync(src, dest);
                        console.log(`✅ Synced core ${sub} to Tauri`);
                    }
                }
            }

            // Symlink/Copy package.json
            const rootPackageJson = path.join(rootDir, 'package.json');
            if (fs.existsSync(rootPackageJson) && !fs.existsSync(tauriPackageJson)) {
                fs.copySync(rootPackageJson, tauriPackageJson);
                console.log('✅ Copied package.json to Tauri resources');
            } else if (fs.existsSync(tauriPackageJson)) {
                console.log('✅ package.json.vendor already present');
            }
        }

        console.log('✨ Pinokio sync complete!');
    } catch (error) {
        console.error('❌ Error during sync:', error.message);
        process.exit(1);
    }
}

run();
