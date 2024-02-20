#!/usr/bin/env node
import * as Path from 'path';
import { runCli } from '../lib/CliRunner';

runCli(Path.join(__dirname, '..'));
