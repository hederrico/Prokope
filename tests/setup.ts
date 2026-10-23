// Setup do Vitest: matchers do jest-dom e um IndexedDB em memória (o cache do Firestore e o modo demonstração usam IndexedDB).
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
