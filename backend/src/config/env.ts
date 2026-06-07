import path from 'path';
import dotenv from 'dotenv';

const backendEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: backendEnvPath });
