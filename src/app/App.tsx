// O app: a sessão (modo demonstração ou Firebase) e o roteador com a casca.
// main.tsx renderiza <App /> e o aviso de versão nova (<PwaUpdate />).
import { RouterProvider } from 'react-router/dom';
import { DataProvider } from '@/data/session';
import '@/components/shell/shell.css';
import { router } from './router';

export function App() {
  return (
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  );
}
