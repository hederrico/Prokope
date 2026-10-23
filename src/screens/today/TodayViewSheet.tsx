// A folha "Ver o dia" (?folha=jeito), aberta pelo botão no topo do Hoje: os três jeitos num grupo de rádio.
// A escolha vale na hora (o Hoje troca por opacidade em base, atrás do fundo da folha) e a folha fecha sozinha
// 200 ms depois, para a pessoa ver o rádio escolhido (como a folha de data da Pausa).
import { useRef, useState } from 'react';
import { setTodayView } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { todayViewOf, usePrefs } from '@/data';
import { TodayViewOptions } from './TodayViewPicker';
import './today.css';

export default function TodayViewSheet({ close }: SheetScreenProps) {
  const prefs = usePrefs();
  // o rádio anda na hora, antes de o perfil voltar gravado
  const [view, setView] = useState(() => todayViewOf(prefs.todayView));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return (
    <Sheet title="Ver o dia">
      <div className="td-views">
        <TodayViewOptions
          value={view}
          onChange={(v) => {
            setView(v);
            void setTodayView(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(close, 200);
          }}
        />
        <p className="td-views-foot">Fica guardado para você, nos seus aparelhos. Também em Ajustes › Aparência.</p>
      </div>
    </Sheet>
  );
}
