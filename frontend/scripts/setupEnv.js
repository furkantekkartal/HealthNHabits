const fs = require('fs');
const path = require('path');

/**
 * Read .env.cloudflare and set up environment variables for Vite
 * This runs before Vite starts to inject Cloudflare URLs
 */
function setupEnv() {
    // Get environment from command line argument
    const env = process.argv[2] || 'master';

    console.log(`🔧 Setting up environment: ${env}`);

    // Look for .env.cloudflare in project root
    const cloudflareEnvPath = path.join(__dirname, '..', '..', '.env.cloudflare');

    if (!fs.existsSync(cloudflareEnvPath)) {
        console.warn('⚠️  .env.cloudflare file not found.');
        console.warn('   Using localhost URLs as fallback.');

        const fallbackEnv = env === 'master'
            ? { VITE_API_URL: 'http://localhost:5040/api', PORT: '3040' }
            : { VITE_API_URL: 'http://localhost:5050/api', PORT: '3050' };

        writeEnvFile(fallbackEnv);
        return;
    }

    // Read and parse .env.cloudflare file
    const envContent = fs.readFileSync(cloudflareEnvPath, 'utf8');
    const config = {};

    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const keyName = key.trim();
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                config[keyName] = value;
            }
        }
    });

    // Get the appropriate URLs based on environment
    let backendUrl = null;

    if (env === 'master') {
        backendUrl = config.master_Backend || config.master_backend || config.MASTER_BACKEND;
    } else if (env === 'dev' || env === 'development') {
        backendUrl = config.development_Backend || config.development_backend || config.DEVELOPMENT_BACKEND;
    }

    if (!backendUrl) {
        console.warn(`⚠️  Cloudflare URL not found for ${env} environment in .env.cloudflare`);
        console.warn('   Using localhost URLs as fallback.');

        const fallbackEnv = env === 'master'
            ? { VITE_API_URL: 'http://localhost:5040/api', PORT: '3040' }
            : { VITE_API_URL: 'http://localhost:5050/api', PORT: '3050' };

        writeEnvFile(fallbackEnv);
        return;
    }

    console.log(`✅ Loaded Cloudflare URL for ${env}:`);
    console.log(`   Backend: ${backendUrl}`);

    // Write to temporary .env file for Vite to read
    const envVars = {
        VITE_API_URL: `${backendUrl}/api`,
        PORT: env === 'master' ? '3040' : '3050'
    };

    writeEnvFile(envVars);
}

function writeEnvFile(envVars) {
    const envPath = path.join(__dirname, '..', '.env.local');
    let content = '# Auto-generated from .env.cloudflare - DO NOT EDIT MANUALLY\n';
    content += '# This file is regenerated on each start\n\n';

    Object.entries(envVars).forEach(([key, value]) => {
        content += `${key}=${value}\n`;
    });

    fs.writeFileSync(envPath, content);
    console.log(`📝 Created ${envPath}`);
}

// Run if called directly
setupEnv();
