// Apagar todos os dados: diz o que some, oferece a cópia antes e pede a palavra "apagar". Só então o botão de atenção
// acende (de contorno a cheio, em micro, sem mola nem tremida). Não há Desfazer: a palavra é a proteção. Durante o
// apagar, tudo trava, inclusive o voltar, e o app vai para o primeiro acesso (ajustes-rotina-conta.md › Apagar).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { NavBar, useGoBack } from '@/components/shell';
import { Button, MiniBar, PillarBubble } from '@/components/ui';
import { diffDays, useConnection, useHabits, useJourney, usePillars, useProfile, useSession } from '@/data';
import { useNow } from '@/data/useDomain';
import { deleteAllData } from '@/actions';
import { Icon } from '@/icons';
import { useSinceDay } from './dataHooks';
import { matchesWord } from './habitText';
import { buildExport, deliverFile } from './exportFile';
import './settings.css';

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function DeleteDataScreen() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const session = useSession();
  const { online } = useConnection();
  const { today } = useNow();
  const since = useSinceDay();
  const pillars = usePillars();
  const habits = useHabits('active');
  const journey = useJourney();
  const [word, setWord] = useState('');
  const [exported, setExported] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const field = useRef<HTMLInputElement>(null);

  const days = since ? Math.max(1, diffDays(today, since) + 1) : 0;
  const habitCount = new Set(habits.map((h) => h.habit.id)).size;
  const needsNet = session.mode === 'firebase' && !online;
  const ready = matchesWord(word) && !needsNet;
  const deleting = progress !== null;

  // com o teclado aberto, a tela rola para o botão ficar 12 px acima dele
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (document.activeElement !== field.current) return;
      const btn = document.getElementById('st-delete-btn');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const limit = vv.offsetTop + vv.height - 12;
      if (r.bottom > limit) btn.scrollIntoView({ block: 'end', behavior: 'smooth' });
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  const exportFirst = async () => {
    const { file } = await buildExport('json');
    const r = await deliverFile(file);
    if (r !== 'cancelled') setExported(true);
  };

  const run = async () => {
    setProgress(0);
    try {
      await deleteAllData((done, total) => setProgress(total ? Math.round((done / total) * 100) : 100));
      setProgress(100);
      void navigate('/comecar/1', { replace: true });
    } catch {
      setProgress(null);
    }
  };
  const remove = async () => {
    if (!ready || deleting) return;
    await run();
  };

  // o app fechou no meio do apagar (o perfil ficou com `deleting`): a guarda trouxe para cá e o apagar retoma
  // sozinho, com a barra, sem pedir a palavra de novo (ajustes-rotina-conta.md › Apagar)
  const interrupted = useProfile()?.deleting === true;
  const resumed = useRef(false);
  useEffect(() => {
    if (!interrupted || resumed.current || progress !== null) return;
    resumed.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interrupted]);

  const parts = [
    days ? plural(days, 'dia de registros', 'dias de registros') : null,
    plural(pillars.length, 'pilar', 'pilares'),
    plural(habitCount, 'hábito', 'hábitos'),
  ].filter(Boolean) as string[];
  const what = `${parts.join(', ')}${journey.phases.length ? ' e as fases' : ''}`;

  return (
    <div className="st-screen" aria-busy={deleting || undefined}>
      <NavBar noBack={deleting} />
      <div className="st-pad" style={{ paddingTop: 4 }}>
        <div className="st-card">
          <div className="pk-li warn st-danger-head">
            <PillarBubble icon="trash-simple" size="li" />
            <span>
              <h1 className="st-h1-row" tabIndex={-1}>
                Apagar todos os dados
              </h1>
            </span>
            <span />
          </div>
          <div className="st-confirm">
            <p>
              {`Apaga para sempre ${what} desta conta. ${
                session.mode === 'demo' ? 'A demonstração recomeça do zero.' : 'Sua conta Google continua igual.'
              }`}
            </p>
            {deleting ? (
              <div className="st-deleting" role="status" aria-live="polite">
                <b>Apagando…</b>
                <MiniBar value={progress ?? 0} thick />
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  wide
                  icon={exported ? 'check' : 'export'}
                  iconWeight={exported ? 'bold' : 'regular'}
                  onClick={() => void exportFirst()}
                >
                  {exported ? 'Cópia exportada' : 'Exportar em JSON antes'}
                </Button>
                <div className="st-hr" />
                <div className="pk-field">
                  <label htmlFor="st-delete-word" className="pk-flabel">
                    Para confirmar, digite <b>apagar</b>
                  </label>
                  <div className="pk-fld">
                    <input
                      id="st-delete-word"
                      ref={field}
                      value={word}
                      placeholder="apagar"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      enterKeyHint="done"
                      onChange={(e) => setWord(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void remove()}
                    />
                  </div>
                </div>
                <div className="st-confirm-row">
                  <Button variant="secondary" size="sm" onClick={() => goBack('/ajustes/dados')}>
                    Cancelar
                  </Button>
                  <Button
                    id="st-delete-btn"
                    variant="warn"
                    size="sm"
                    icon="trash-simple"
                    className={ready ? undefined : 'st-off'}
                    aria-disabled={!ready || undefined}
                    aria-label={ready ? 'Apagar tudo' : 'Apagar tudo, indisponível. Digite apagar para liberar.'}
                    onClick={() => void remove()}
                  >
                    Apagar tudo
                  </Button>
                </div>
                {needsNet && (
                  <p className="cap" style={{ margin: 0, color: 'var(--text-2)' }}>
                    <Icon name="info" weight="regular" /> Precisa de internet para apagar.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
