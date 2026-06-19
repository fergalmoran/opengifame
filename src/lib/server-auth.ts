import {getServerSession} from 'next-auth';
import {authOptions} from './auth';

export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}
