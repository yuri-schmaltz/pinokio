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

            // Ensure node_modules_vendor exists as a real directory
            if (fs.existsSync(tauriVendorDir)) {
                if (!fs.lstatSync(tauriVendorDir).isDirectory()) {
                    fs.removeSync(tauriVendorDir);
                }
            }
            fs.ensureDirSync(tauriVendorDir);

            // Prepare pinokiod into tauri resource folder
            const pinokiodSource = path.join(rootDir, 'node_modules', 'pinokiod');
            const pinokiodTarget = path.join(tauriVendorDir, 'pinokiod');

            if (fs.existsSync(pinokiodSource)) {
                if (!fs.existsSync(pinokiodTarget)) {
                    console.log('🔗 Linking pinokiod to Tauri resources (using hard links if possible)...');
                    try {
                        // Try hard link first for speed and space efficiency (Linux/macOS)
                        require('child_process').execSync(`cp -al "${pinokiodSource}" "${pinokiodTarget}"`);
                        console.log('✅ Hard linked pinokiod');
                    } catch (e) {
                        // Fallback to real copy if hard link fails (e.g. cross-device or Windows)
                        console.log('⚠️ Hard link failed, falling back to copy (this may take a moment)...');
                        fs.copySync(pinokiodSource, pinokiodTarget, { overwrite: true });
                        console.log('✅ Copied pinokiod');
                    }
                } else {
                    console.log('✅ pinokiod resources already present');
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
