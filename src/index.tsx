#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { config } from 'dotenv';
import { CLI } from './cli.js';

// Load environment variables
config({ quiet: true });

// Parse command line arguments
const args = process.argv.slice(2);
let resumeSessionId: string | undefined;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--resume' || arg === '-r') {
    resumeSessionId = args[i + 1];
    break;
  }
}

// Render the CLI app
render(<CLI resumeSessionId={resumeSessionId} />);
