import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA_PIPELINES } from './integrations/pipelineData';
import { INITIAL_BOARD_MEETINGS } from './governance/governanceData';
import fs from 'node:fs';
import path from 'node:path';

test('INITIAL_DATA_PIPELINES holds valid pipeline configurations without missing telemetry data', () => {
    assert.equal(INITIAL_DATA_PIPELINES.length, 5, 'Should have exactly 5 pipelines');
    
    for (const pipeline of INITIAL_DATA_PIPELINES) {
        assert.ok(pipeline.id, 'Pipeline must have an id');
        assert.ok(pipeline.name, 'Pipeline must have a name');
        assert.ok(pipeline.endpoint.startsWith('/api/webhooks/stripe'), 'Endpoint must point to Stripe webhook API');
        assert.ok(pipeline.sha256Verification.startsWith('sha256:whsec_'), 'SHA-256 verification string must be valid');
        assert.equal(pipeline.status, 'Healthy');
    }
});

test('INITIAL_BOARD_MEETINGS contains complete governance records with commitments and probes', () => {
    assert.equal(INITIAL_BOARD_MEETINGS.length, 5, 'Should have 5 board meetings');

    const expectedIds = ['bm-1', 'bm-2', 'bm-3', 'bm-4', 'bm-5'];
    assert.deepEqual(INITIAL_BOARD_MEETINGS.map(m => m.id), expectedIds);

    for (const meeting of INITIAL_BOARD_MEETINGS) {
        assert.ok(meeting.companyName, 'Meeting must have companyName');
        assert.ok(meeting.agendaTopic, 'Meeting must have agendaTopic');
        assert.ok(Array.isArray(meeting.priorCommitments) && meeting.priorCommitments.length > 0, 'Must have priorCommitments');
        assert.ok(Array.isArray(meeting.strategicProbes) && meeting.strategicProbes.length > 0, 'Must have strategicProbes');
        assert.ok(meeting.preMeetingChecklist, 'Must have preMeetingChecklist');
    }
});

test('Zero imports of @/data or src/data remain in any source file (regression guard)', () => {
    const srcDir = path.resolve(__dirname, '..', '..');

    const scanDirectory = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const violatingFiles: string[] = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.next') {
                    violatingFiles.push(...scanDirectory(fullPath));
                }
            } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.endsWith('data-migration.test.ts')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes("from '@/data") || content.includes('from "@/data') || content.includes("from '../data") || content.includes('src/data')) {
                    violatingFiles.push(fullPath);
                }
            }
        }
        return violatingFiles;
    };

    const violations = scanDirectory(srcDir);
    assert.deepEqual(violations, [], `Found unexpected imports from data directory in: ${violations.join(', ')}`);
});
