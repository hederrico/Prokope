// Folha do check-in (?folha=checkin, com &humor=4 quando vem do rostinho do Hoje): registros.md › Check-in e
// Check-in · teclado aberto; quadro: f-registros.js › 5 e 5b. Humor e energia (RatingFaces), 3 coisas boas e o tempo
// de tela, opcionais. Tudo vai para o rascunho no aparelho (o texto 500 ms depois de parar de digitar); fechar sem
// salvar guarda o rascunho. O Salvar fica preso no pé, acima do teclado (keyboardAware).
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { saveCheckin, type CheckinInput } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button, ListGroup, PillarBubble, RatingFaces, SectionLabel, type FaceLevel } from '@/components/ui';
import { formatMinutes, useCheckin, useDrafts, useHabitByRole } from '@/data';
import { Icon } from '@/icons';
import { blurActive, closeThenUndo, keepFocus } from './feedback';
import { parseWhole } from './lib';
import { DayNote, SheetTitle } from './parts';
import { useHabitPillar, useSheetDay } from './hooks';

interface Values {
  mood?: number;
  energy?: number;
  good: [string, string, string];
  screenMinutes: number | null;
  youtubeMinutes: number | null;
}

const PLACEHOLDERS = ['O que foi bom hoje?', 'Mais uma, se quiser', 'Mais uma, se quiser'];
const level = (n: number | undefined) => (n && n >= 1 && n <= 5 ? (Math.round(n) as FaceLevel) : undefined);

function toInput(v: Values): CheckinInput {
  return {
    mood: v.mood ?? 0,
    energy: v.energy ?? 0,
    good: v.good.map((g) => g.trim()).filter(Boolean),
    screenMinutes: v.screenMinutes,
    youtubeMinutes: v.youtubeMinutes,
  };
}

export default function CheckinSheet({ params, close }: SheetScreenProps) {
  const sd = useSheetDay(params);
  const today = sd.day;
  const saved = useCheckin(today);
  const draft = useDrafts((s) => s.checkins[today]);
  const setDraft = useDrafts((s) => s.setCheckinDraft);
  const clearDraft = useDrafts((s) => s.clearCheckinDraft);
  const habit = useHabitByRole('checkin');
  const screenHabit = useHabitByRole('screenTime');
  const ytHabit = useHabitByRole('youtube');
  const pillar = useHabitPillar(habit?.id);
  const screenPillar = useHabitPillar(screenHabit?.id);
  const ytPillar = useHabitPillar(ytHabit?.id);
  const fromFace = level(Number(params.get('humor')));

  const [v, setV] = useState<Values>(() => {
    const src = draft ?? saved ?? undefined;
    const good = src?.good ?? [];
    return {
      mood: fromFace ?? src?.mood,
      energy: src?.energy,
      good: [good[0] ?? '', good[1] ?? '', good[2] ?? ''],
      screenMinutes: src?.screenMinutes ?? null,
      youtubeMinutes: src?.youtubeMinutes ?? null,
    };
  });

  // rascunho: rostinhos na hora, texto e minutos 500 ms depois; ao fechar, o que estiver pendente
  const latest = useRef(v);
  const pending = useRef(false);
  const done = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  useLayoutEffect(() => {
    latest.current = v;
  });
  const flush = () => {
    window.clearTimeout(timer.current);
    if (!pending.current || done.current) return;
    pending.current = false;
    const cur = latest.current;
    setDraft(today, {
      mood: cur.mood,
      energy: cur.energy,
      good: [...cur.good],
      screenMinutes: cur.screenMinutes,
      youtubeMinutes: cur.youtubeMinutes,
    });
  };
  const flushRef = useRef(flush);
  useLayoutEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => () => flushRef.current(), []);
  useEffect(() => {
    // o rostinho tocado no Hoje já é rascunho
    if (fromFace && draft?.mood !== fromFace) setDraft(today, { mood: fromFace });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(patch: Partial<Values>, wait: boolean) {
    const nextV = { ...latest.current, ...patch };
    latest.current = nextV;
    setV(nextV);
    pending.current = true;
    window.clearTimeout(timer.current);
    if (wait) timer.current = window.setTimeout(() => flushRef.current(), 500);
    else queueMicrotask(() => flushRef.current());
  }

  // campos em ordem, para o "seguinte" do teclado
  const goodRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const screenRef = useRef<HTMLInputElement>(null);
  const ytRef = useRef<HTMLInputElement>(null);
  const order = [...goodRefs, screenRef, ytRef];
  const next = (i: number) => {
    const el = order[i + 1]?.current;
    if (el) el.focus();
    else blurActive();
  };

  const ready = !!v.mood && !!v.energy;
  const label = ready
    ? 'Salvar check-in'
    : v.mood
      ? 'Falta a energia'
      : v.energy
        ? 'Falta o humor'
        : 'Escolha humor e energia';

  async function save() {
    if (!ready || done.current) return;
    blurActive();
    done.current = true;
    window.clearTimeout(timer.current);
    const values = toInput(v);
    const undo = await saveCheckin(today, values);
    clearDraft(today);
    closeThenUndo(
      close,
      { title: 'Check-in salvo', detail: sd.label ?? undefined, pillar, icon: 'check' },
      undo,
      () => setDraft(today, values),
    );
  }

  const title = habit?.name ?? 'Check-in do dia';

  return (
    <Sheet
      title={
        <SheetTitle icon={habit?.icon ?? 'sparkle'} pillar={pillar}>
          {title}
        </SheetTitle>
      }
      label={title}
      tall
      keyboardAware
      className="rg-sheet"
      footer={
        <Button wide aria-disabled={!ready} onPointerDown={keepFocus} onClick={() => void save()}>
          {label}
        </Button>
      }
    >
      <div
        className="rg-stack"
        onPointerDown={(e) => {
          // toque fora dos campos fecha o teclado, e a folha fica
          if (!(e.target as HTMLElement).closest('input, textarea, button, label, [role="radio"]')) blurActive();
        }}
      >
        <DayNote label={sd.label} />
        <div className="rg-grp">
          <SectionLabel inset level={3}>
            Humor
          </SectionLabel>
          <RatingFaces kind="mood" value={level(v.mood)} onChange={(n) => update({ mood: n }, false)} />
        </div>
        <div className="rg-grp">
          <SectionLabel inset level={3}>
            Energia
          </SectionLabel>
          <RatingFaces kind="energy" value={level(v.energy)} onChange={(n) => update({ energy: n }, false)} />
        </div>
        <div className="rg-grp" role="group" aria-label="3 coisas boas de hoje, opcional">
          <SectionLabel inset level={3} trailing="opcional">
            3 coisas boas de hoje
          </SectionLabel>
          <div className="rg-gf">
            {v.good.map((text, i) => (
              <label key={i} className="pk-fld rg-good">
                <span className={clsx('rg-n', !text && 'ph')} aria-hidden="true">
                  {i + 1}
                </span>
                <input
                  ref={goodRefs[i]}
                  value={text}
                  placeholder={PLACEHOLDERS[i]}
                  aria-label={`Coisa boa ${i + 1} de 3`}
                  enterKeyHint="next"
                  autoComplete="off"
                  maxLength={140}
                  onChange={(e) => {
                    const good = [...latest.current.good] as Values['good'];
                    good[i] = e.target.value;
                    update({ good }, true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      next(i);
                    }
                  }}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="rg-grp" role="group" aria-label="Tempo de tela, opcional">
          <SectionLabel inset level={3} trailing="opcional">
            Tempo de tela
          </SectionLabel>
          <ListGroup className="rg-lg">
            <div className="rg-li">
              <PillarBubble icon={screenHabit?.icon ?? 'device-mobile'} pillar={screenPillar ?? pillar} size="li" />
              <b aria-hidden="true">Total no iPhone</b>
              <MinutesField
                inputRef={screenRef}
                label="Tempo de tela total no iPhone, em minutos"
                value={v.screenMinutes}
                onChange={(n) => update({ screenMinutes: n }, true)}
                enterKeyHint="next"
                onEnter={() => next(3)}
              />
            </div>
            <div className="rg-li">
              <PillarBubble icon={ytHabit?.icon ?? 'youtube-logo'} pillar={ytPillar ?? pillar} size="li" />
              <b aria-hidden="true">YouTube</b>
              <MinutesField
                inputRef={ytRef}
                label="YouTube, em minutos"
                value={v.youtubeMinutes}
                onChange={(n) => update({ youtubeMinutes: n }, true)}
                enterKeyHint="done"
                onEnter={() => next(4)}
              />
            </div>
          </ListGroup>
          <p className="rg-foot" style={{ paddingTop: 8 }}>
            <Icon name="info" weight="regular" />
            Copie de Ajustes › Tempo de Uso, no iPhone.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

/** Minutos com a cara do TimeValue: no foco, o número ("108"); fora dele, "1h 48min". */
function MinutesField({
  value,
  onChange,
  label,
  enterKeyHint,
  onEnter,
  inputRef,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  label: string;
  enterKeyHint: 'next' | 'done';
  onEnter: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const shown = editing ?? (value != null ? formatMinutes(value) : '');
  return (
    // a caixa inteira (e a área de 44 px em volta) é o rótulo do campo: tocar fora do número também foca
    <label className="rg-mins hit">
      <span className="rg-auto" data-value={shown || 'min'}>
        <input
          ref={inputRef}
          inputMode="numeric"
          size={1}
          value={shown}
          placeholder="min"
          aria-label={label}
          enterKeyHint={enterKeyHint}
          autoComplete="off"
          onFocus={() => setEditing(value != null ? String(value) : '')}
          onBlur={() => setEditing(null)}
          onChange={(e) => {
            const t = e.target.value.replace(/\D/g, '').slice(0, 4);
            setEditing(t);
            onChange(parseWhole(t));
          }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEnter();
            }
          }}
        />
      </span>
    </label>
  );
}
