#!/usr/bin/env node
/**
 * Sanity Webhook Handler for GitHub Pages Deployment
 * 
 * This script runs as a webhook endpoint that listens for Sanity publish events
 * and triggers GitHub Actions via the Repository Dispatch API.
 * 
 * Environment variables needed:
 * - GITHUB_TOKEN: Personal Access Token (repo scope)
 * - GITHUB_REPO: owner/repo format (e.g., karazman/vlcmwebsite)
 */

import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'karazman/vlcmwebsite';
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

if (!GITHUB_TOKEN) {
    console.error('ERROR: GITHUB_TOKEN environment variable not set');
    process.exit(1);
}

/**
 * Verify webhook signature from Sanity
 */
function verifyWebhookSignature(body, signature) {
    if (!SANITY_WEBHOOK_SECRET) {
        console.warn('WARNING: SANITY_WEBHOOK_SECRET not set, skipping verification');
        return true;
    }

    const hash = crypto
        .createHmac('sha256', SANITY_WEBHOOK_SECRET)
        .update(body)
        .digest('base64');

    return hash === signature;
}

/**
 * Trigger GitHub Repository Dispatch Event
 */
async function triggerGitHubDeployment(documentId, title) {
    try {
        const [owner, repo] = GITHUB_REPO.split('/');

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type: 'sanity-publish',
                    client_payload: {
                        document_id: documentId,
                        title: title,
                        timestamp: new Date().toISOString(),
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${error}`);
        }

        console.log(`✓ Deployment triggered for: ${title}`);
        return { success: true, message: 'Deployment triggered' };
    } catch (error) {
        console.error(`✗ Failed to trigger deployment: ${error.message}`);
        throw error;
    }
}

/**
 * Webhook endpoint for Sanity publish events
 */
app.post('/webhook/sanity-publish', (req, res) => {
    try {
        // Verify signature (optional if you set SANITY_WEBHOOK_SECRET)
        const signature = req.headers['sanity-webhook-signature'];
        const bodyRaw = JSON.stringify(req.body);

        if (signature && !verifyWebhookSignature(bodyRaw, signature)) {
            console.warn('⚠ Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const { _id, title, _type } = req.body;

        if (!_id || !title) {
            return res.status(400).json({
                error: 'Missing required fields: _id, title',
                received: { _id, title, _type }
            });
        }

        // Trigger GitHub deployment
        triggerGitHubDeployment(_id, title)
            .then(() => {
                res.status(200).json({
                    success: true,
                    message: 'Deployment queued',
                    document: { _id, title, _type }
                });
            })
            .catch((error) => {
                res.status(500).json({
                    error: error.message,
                    document: { _id, title, _type }
                });
            });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sanity-github-webhook' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Webhook server running on port ${PORT}`);
    console.log(`📝 Sanity publish events → POST /webhook/sanity-publish`);
    console.log(`🏥 Health check → GET /health`);
});
