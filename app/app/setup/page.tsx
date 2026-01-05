
import { Suspense } from 'react';
import SetupClient from './client';

export default function SetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupClient />
    </Suspense>
  );
}
