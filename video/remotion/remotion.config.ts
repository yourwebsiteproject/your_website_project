import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Entry point for Remotion Studio / CLI
export const entryPoint = './src/DailyVideo.tsx';
