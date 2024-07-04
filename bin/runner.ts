#!/usr/bin/env node
import * as Path from 'node:path';
import { runCli } from '../lib/CliRunner';

runCli(Path.join(__dirname, '..'));
