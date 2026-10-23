// Seções da galeria. Cada uma mostra um componente (ou uma família) em todos os estados, com os números da história.
import { useState, type ReactNode } from 'react';
import {
  ActionPill,
  AddRow,
  BudgetRow,
  BudgetSlots,
  Button,
  Card,
  CardHeader,
  CheckButton,
  Chip,
  ChipRow,
  DayPicker,
  DaysSinceTile,
  EmptyState,
  Face,
  FoldedGroup,
  GoalBar,
  HabitList,
  HabitRow,
  Heatmap,
  HeatmapKey,
  InsightCard,
  ListGroup,
  ListItem,
  MiniBar,
  NumberFlow,
  OptionCard,
  OptionGroup,
  PillarBubble,
  PlusButton,
  ProfileCard,
  QuickAddButton,
  QuickAddGrid,
  RatingFaces,
  RatingRow,
  Ring,
  SectionLabel,
  SegmentedControl,
  Skeleton,
  SkeletonGroup,
  SkeletonRow,
  StatGroup,
  Switch,
  Tag,
  TextField,
  TimeValue,
  ValuePill,
  WeekCard,
  WeekDots,
  WeekStrip,
  type FaceLevel,
} from '@/components/ui';
import { Icon } from '@/icons';
import { PALETTE_KEYS } from '@/styles/palette';
import { ALL_FOODS, HABITS, LUNCH_FOODS, MORNING_FOODS, TODAY, walkHeatmap, weekDays } from './galleryData';

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="gx-sec" data-gallery={id}>
      <header>
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </header>
      {children}
    </section>
  );
}

function Controls({ children }: { children: ReactNode }) {
  return <div className="gx-ctl">{children}</div>;
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="gx-demo">
      {children}
      <span className="gx-cap">{label}</span>
    </span>
  );
}

const noop = () => {};
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

/* ---------------- Hoje · manhã (composição, para comparar com o quadro) ---------------- */
export function TodaySection() {
  const [walk, setWalk] = useState(false);
  const [footy, setFooty] = useState(false);
  const [protein, setProtein] = useState<number[]>([18, 6]);
  const [water, setWater] = useState(0);
  const [free, setFree] = useState(0);
  const [junk, setJunk] = useState(1);
  const [night, setNight] = useState(false);
  const done = 3 + (walk ? 1 : 0) + (footy ? 1 : 0);
  const walks = walk ? 3 : 2;
  const total = sum(protein);
  const foods = Object.fromEntries(ALL_FOODS.map((f) => [f.id, f.grams]));
  const fmtL = (l: number) => String(l).replace('.', ',');

  return (
    <Section id="hoje" title="Hoje · manhã" note="A composição do quadro (7h42), montada só com os componentes. Toque nos controles.">
      <div className="gx-hd">
        <span className="date">Quinta, 22 de outubro</span>
        <h1 className="lt">Bom dia, Henrique</h1>
      </div>
      <div className="gx-pad">
        <WeekCard doneToday={done} totalToday={12} weekPct={76} days={weekDays(done)} today={TODAY} onSelect={noop} onOpenProgress={noop} />
      </div>
      <SectionLabel>Manhã</SectionLabel>
      <div className="gx-pad">
        <HabitList>
          <HabitRow
            habit={HABITS.peso}
            subtitle="média de 7 dias no Progresso"
            done
            control={<ValuePill value="83,6 kg" label="Peso, 83,6 quilos, feito. Abre o peso" onClick={noop} />}
            onOpen={noop}
            onLongPress={noop}
          />
          <HabitRow
            habit={HABITS.acordar}
            subtitle="meta 6h50"
            done
            control={<ValuePill value="6h52" label="Acordar, 6h52, feito. Abre o horário" onClick={noop} />}
            onOpen={noop}
            onLongPress={noop}
          />
          <HabitRow
            habit={HABITS.caminhada}
            done={walk}
            subtitle={
              <>
                <WeekDots total={7} done={walks} />
                <span>
                  <NumberFlow value={walks} delay={60} /> de 7 · meta 6
                </span>
              </>
            }
            a11yLabel={`Caminhada com o cachorro, ${walks} de 7 nesta semana, meta 6`}
            control={<CheckButton checked={walk} onCheckedChange={setWalk} label="Caminhada com o cachorro" />}
            nudge={{ text: walk ? 'De volta hoje.' : 'Hoje é um bom dia para voltar.', action: 'Marcar ontem', onAction: noop }}
            onOpen={noop}
            onLongPress={noop}
          />
        </HabitList>
      </div>
      <SectionLabel>Ao longo do dia</SectionLabel>
      <div className="gx-pad gx-stack">
        <Card padded pillar="alim" className="gx-protein gx-stack" style={{ gap: 8 }}>
          <div className="gx-between">
            <span className="gx-row">
              <PillarBubble icon="egg" pillar="alim" size="sm" />
              <b className="gx-t">Proteína</b>
            </span>
            <span className="gx-total">
              <b>
                <NumberFlow value={total} suffix=" g" />
              </b>{' '}
              <span className="faint">de 80 g</span>
            </span>
          </div>
          <GoalBar segments={protein} goal={80} unit="g" unitName="gramas" status={false} />
          <QuickAddGrid items={MORNING_FOODS} onAdd={(id) => setProtein((p) => [...p, foods[id]!])} onMore={noop} />
        </Card>
        <HabitList>
          <HabitRow
            habit={HABITS.agua}
            className="gx-water"
            leading={
              <Ring size={40} stroke={5} value={water / 3} color="var(--mark)" track="var(--wash)">
                <Icon name="drop" />
              </Ring>
            }
            subtitle={
              <span>
                <NumberFlow value={water} format={{ maximumFractionDigits: 1 }} /> de 3 L
              </span>
            }
            a11yLabel={`Água, ${fmtL(water)} de 3 litros`}
            control={
              <>
                <QuickAddButton amount="500 ml" onClick={() => setWater((w) => Math.round((w + 0.5) * 10) / 10)} />
                <QuickAddButton amount="1 L" onClick={() => setWater((w) => Math.round((w + 1) * 10) / 10)} />
              </>
            }
            onOpen={noop}
          />
        </HabitList>
        <HabitList>
          <HabitRow
            habit={HABITS.almoco}
            subtitle="nota de 1 a 5"
            control={<ActionPill onClick={noop} label="Almoço, sem nota. Dar nota">Dar nota</ActionPill>}
            onOpen={noop}
            onLongPress={noop}
          />
          <HabitRow
            habit={HABITS.futebol}
            done={footy}
            subtitle={`hoje · ${footy ? 1 : 0} de 1 na semana`}
            control={<CheckButton checked={footy} onCheckedChange={setFooty} label="Futebol" />}
            onOpen={noop}
            onLongPress={noop}
          />
        </HabitList>
      </div>
      <SectionLabel trailing="a partir das 20h30">Noite</SectionLabel>
      <div className="gx-pad">
        <FoldedGroup
          icons={[
            { icon: 'broom', pillar: 'familia' },
            { icon: 'trash', pillar: 'familia' },
            { icon: 'bowl-food', pillar: 'alim' },
          ]}
          more={3}
          title="6 hábitos"
          subtitle="louça, lixo, jantar e mais 3"
          expanded={night}
          onToggle={() => setNight((v) => !v)}
        >
          <HabitRow habit={HABITS.louca} subtitle="até 20h30" control={<CheckButton checked={false} onCheckedChange={noop} label="Louça, até 20h30" />} onOpen={noop} />
          <HabitRow habit={HABITS.lixo} subtitle="coleta hoje · até 20h30" control={<CheckButton checked={false} onCheckedChange={noop} label="Lixo e recicláveis" />} onOpen={noop} />
          <HabitRow habit={HABITS.jantar} subtitle="nota de 1 a 5" control={<ActionPill onClick={noop}>Dar nota</ActionPill>} onOpen={noop} />
          <HabitRow habit={HABITS.telas} subtitle="às 21h" control={<CheckButton checked={false} onCheckedChange={noop} label="Telas desligadas" />} onOpen={noop} />
          <HabitRow habit={HABITS.deitar} subtitle="meta 22h · marque amanhã ao acordar" onOpen={noop} />
        </FoldedGroup>
      </div>
      <SectionLabel>Limites da semana</SectionLabel>
      <div className="gx-pad">
        <HabitList>
          <HabitRow
            habit={HABITS.livres}
            subtitle={
              <>
                <BudgetSlots total={2} used={free} />
                <span className="pk-num">{free} de 2</span>na semana
              </>
            }
            control={<PlusButton onClick={() => setFree((v) => v + 1)} full={free >= 2} label={`Refeições livres, ${free} de 2 na semana. Usar uma`} />}
            onOpen={noop}
          />
          <HabitRow
            habit={HABITS.tranqueiras}
            subtitle={
              <>
                <BudgetSlots total={2} used={junk} />
                <span className="pk-num">{junk} de 2</span>
                {junk >= 2 ? '· a semana recomeça segunda' : 'na semana'}
              </>
            }
            control={<PlusButton onClick={() => setJunk((v) => v + 1)} full={junk >= 2} label={`Tranqueiras, ${junk} de 2 na semana. Registrar hoje`} />}
            onOpen={noop}
          />
        </HabitList>
      </div>
      <SectionLabel>Dias sem</SectionLabel>
      <div className="gx-pad pk-dsr">
        <DaysSinceTile habit={HABITS.refri} days={12} record={21} what="refrigerante" onOpen={noop} />
        <DaysSinceTile habit={HABITS.shorts} days={32} record={32} what="Shorts e TikTok" onOpen={noop} />
      </div>
      <Controls>
        <Button variant="secondary" size="sm" onClick={() => setWalk((v) => !v)}>
          {walk ? 'Desmarcar caminhada' : 'Marcar caminhada'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setProtein([18, 6])}>
          Proteína do início
        </Button>
        <Button variant="secondary" size="sm" onClick={() => (setWater(0), setFree(0), setJunk(1))}>
          Zerar água e limites
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- CheckButton ---------------- */
export function CheckSection() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);
  const [quiet, setQuiet] = useState(false);
  return (
    <Section id="check" title="CheckButton" note="Encolhe a 0,9, enche com a mola toque e o ✓ se desenha. Desmarcar volta em micro, sem quique.">
      <div className="gx-pad">
        <Card padded className="gx-row" style={{ justifyContent: 'space-around' }}>
          <Demo label="repouso">
            <CheckButton checked={a} onCheckedChange={setA} label="Caminhada com o cachorro" pillar="familia" />
          </Demo>
          <Demo label="feito">
            <CheckButton checked={b} onCheckedChange={setB} label="Louça" pillar="familia" />
          </Demo>
          <Demo label="parcial">
            <CheckButton checked={false} partial onCheckedChange={noop} label="Corrida, parcial" pillar="corpo" />
          </Demo>
          <Demo label="outro aparelho">
            <CheckButton checked={quiet} quiet onCheckedChange={setQuiet} label="Telas desligadas" pillar="mente" />
          </Demo>
          <Demo label="desabilitado">
            <CheckButton checked={false} disabled onCheckedChange={noop} label="Deitar" pillar="mente" />
          </Demo>
        </Card>
      </div>
      <Controls>
        <Button size="sm" onClick={() => setA((v) => !v)} data-testid="toggle-check">
          Marcar ou desmarcar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setQuiet((v) => !v)}>
          Troca vinda de outro aparelho
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- HabitRow ---------------- */
export function HabitRowSection() {
  const [log, setLog] = useState('Toque na linha, segure por meio segundo ou use Shift+F10.');
  const [done, setDone] = useState(false);
  return (
    <Section id="linha" title="HabitRow" note="O controle registra; o resto da linha abre o hábito; o toque longo (500 ms) abre o menu.">
      <div className="gx-pad">
        <HabitList>
          <HabitRow
            habit={HABITS.louca}
            subtitle="até 20h30"
            done={done}
            control={<CheckButton checked={done} onCheckedChange={setDone} label="Louça, até 20h30" />}
            onOpen={() => setLog('Abriu o hábito Louça.')}
            onLongPress={() => setLog('Toque longo: menu da Louça.')}
          />
          <HabitRow
            habit={HABITS.acordar}
            subtitle="meta 6h50"
            done
            control={<ValuePill value="6h52" label="Acordar, 6h52, feito. Abre o horário" onClick={() => setLog('Abriu a folha do horário.')} />}
            onOpen={() => setLog('Abriu o hábito Acordar.')}
            onLongPress={() => setLog('Toque longo: menu do Acordar.')}
          />
          <HabitRow habit={HABITS.deitar} subtitle="meta 22h · marque amanhã ao acordar" onOpen={() => setLog('Abriu o hábito Deitar.')} />
          <HabitRow
            habit={HABITS.futebol}
            subtitle="não conta hoje"
            muted
            control={<CheckButton checked={false} onCheckedChange={noop} label="Futebol, não conta hoje" />}
            onOpen={noop}
          />
        </HabitList>
      </div>
      <p className="gx-log" aria-live="polite">
        {log}
      </p>
    </Section>
  );
}

/* ---------------- Pílulas ---------------- */
export function PillsSection() {
  const [rated, setRated] = useState(false);
  return (
    <Section id="pilulas" title="Pílulas e botões da linha" note="ValuePill (feito, ok, fantasma), ActionPill, PlusButton e QuickAddButton.">
      <div className="gx-pad">
        <Card padded className="gx-stack">
          <div className="gx-row" data-pillar="mente">
            <ValuePill value="6h52" label="Acordar, 6h52, feito" onClick={noop} />
            <ValuePill value="83,6 kg" label="Peso, 83,6 quilos, feito" pillar="alim" onClick={noop} />
            <ValuePill value="meta batida" state="ok" label="Meta batida" />
            <ValuePill value="22h" state="ghost" label="Deitar, meta 22h, ainda não registrado" onClick={noop} />
          </div>
          <div className="gx-row" data-pillar="alim">
            {rated ? (
              <ValuePill value="4 · Bom" icon={null} label="Almoço, nota 4, bom. Abre a nota" onClick={() => setRated(false)} />
            ) : (
              <ActionPill onClick={() => setRated(true)} label="Almoço, sem nota. Dar nota">
                Dar nota
              </ActionPill>
            )}
            <PlusButton onClick={noop} label="Refeições livres, 0 de 2 na semana. Usar uma" />
            <PlusButton onClick={noop} full label="Tranqueiras, 2 de 2 na semana. Registrar hoje" />
            <QuickAddButton amount="500 ml" onClick={noop} />
            <QuickAddButton amount="1 L" onClick={noop} />
          </div>
        </Card>
      </div>
      <Controls>
        <Button variant="secondary" size="sm" onClick={() => setRated((v) => !v)}>
          Dar nota 4
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- WeekStrip e WeekCard ---------------- */
export function WeekSection() {
  const [done, setDone] = useState(3);
  const [sel, setSel] = useState<string | undefined>('2026-10-21');
  return (
    <Section id="semana" title="WeekStrip e WeekCard" note="Hoje com o anel em destaque; futuro vazado; terça pausada (tracejada); quarta escolhida. O anel de hoje anda em fill, +120 ms.">
      <div className="gx-pad gx-stack">
        <WeekCard doneToday={done} totalToday={12} weekPct={76} days={weekDays(done)} today={TODAY} onSelect={noop} onOpenProgress={noop} />
        <WeekStrip days={weekDays(done, { pausedTue: true })} today={TODAY} selected={sel} onSelect={(d) => setSel((s) => (s === d ? undefined : d))} />
        <Card padded tint pillar="accent" className="gx-stack">
          <span className="eyebrow">Revisão da semana</span>
          <WeekStrip
            bare
            today="2026-11-01"
            days={['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'].map((date, i) => ({
              date,
              value: [0.85, 0.8, 0.9, 0.7, 0.75, 0.85, 0.6][i]!,
              state: 'done' as const,
            }))}
            onSelect={noop}
          />
        </Card>
      </div>
      <Controls>
        <Button size="sm" onClick={() => setDone((d) => Math.min(12, d + 1))}>
          Marcar um hábito
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDone((d) => Math.max(0, d - 1))}>
          Desfazer
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- GoalBar ---------------- */
export function GoalBarSection() {
  const [segs, setSegs] = useState<number[]>([18, 6, 22]);
  const [water, setWater] = useState<number[]>([0.5, 0.5, 0.5]);
  const total = sum(segs);
  const foods = Object.fromEntries(ALL_FOODS.map((f) => [f.id, f.grams]));
  return (
    <Section id="meta" title="GoalBar" note="Segmento novo cresce em fill; a linha acende quando a barra encosta nela; além da meta, “+6 g”. Passando de 120 g, a escala cresce e tudo anda junto.">
      <div className="gx-pad gx-stack">
        <Card padded pillar="alim" className="gx-protein gx-stack" style={{ gap: 8 }}>
          <div className="gx-between">
            <span className="gx-row">
              <PillarBubble icon="egg" pillar="alim" size="sm" />
              <b className="gx-t">Proteína</b>
            </span>
            <span className="gx-total">
              <b>
                <NumberFlow value={total} suffix=" g" />
              </b>{' '}
              <span className="faint">de 80 g</span>
            </span>
          </div>
          <GoalBar segments={segs} goal={80} unit="g" unitName="gramas" />
          <QuickAddGrid items={LUNCH_FOODS} onAdd={(id) => setSegs((s) => [...s, foods[id]!])} onMore={noop} />
        </Card>
        <Card padded pillar="alim" className="gx-stack" style={{ gap: 4 }}>
          <CardHeader title="Água · fina" subtitle="em litros" trailing={<Tag pillar="alim">1,5 de 3 L</Tag>} />
          <GoalBar segments={water} goal={3} unit="L" unitName="litros" thin status={false} goalLabel="meta 3 L" />
        </Card>
        <Card padded pillar="alim" className="gx-stack" style={{ gap: 4 }}>
          <CardHeader title="Hoje, até o dia fechar" subtitle="listrada no Progresso" />
          <GoalBar segments={[18, 6, 22]} goal={80} unit="g" unitName="gramas" striped status={false} />
        </Card>
      </div>
      <Controls>
        <Button size="sm" onClick={() => setSegs((s) => [...s, 10])}>
          Iogurte +10 g
        </Button>
        <Button size="sm" onClick={() => setSegs((s) => [...s, 30])}>
          Frango +30 g
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setSegs((s) => s.slice(0, -1))}>
          Desfazer
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setSegs([18, 6, 22])}>
          Voltar a 46 g
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWater((w) => [...w, 0.5])}>
          Água +500 ml
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- Ring ---------------- */
export function RingSection() {
  const [water, setWater] = useState(1.5);
  const [closed, setClosed] = useState(false);
  const [pct, setPct] = useState(0.72);
  return (
    <Section id="anel" title="Ring" note="Anda em ring (600 ms) nos anéis grandes. O dia fechado completa e brilha uma vez em glow, depois assenta.">
      <div className="gx-pad">
        <Card padded className="gx-row" style={{ justifyContent: 'space-around' }} pillar="alim">
          <Demo label="água 40">
            <Ring size={40} stroke={5} value={water / 3} color="var(--mark)" track="var(--wash)" label={`Água, ${String(water).replace('.', ',')} de 3 litros`}>
              <Icon name="drop" style={{ color: 'var(--ink)', fontSize: 18 }} />
            </Ring>
          </Demo>
          <Demo label="56">
            <Ring size={56} value={pct} color="var(--mark)" />
          </Demo>
          <Demo label="constância 132">
            <Ring size={132} stroke={12} value={pct} color="var(--accent-mark)" track="var(--accent-wash)">
              <span className="stat">
                <NumberFlow value={Math.round(pct * 100)} suffix="%" />
              </span>
            </Ring>
          </Demo>
        </Card>
      </div>
      <div className="gx-closed">
        <Ring size={196} stroke={14} value={closed ? 11 / 12 : 10 / 12} glow={closed} color="var(--accent-mark)" track="var(--accent-wash)">
          <span className="num-big">{closed ? 11 : 10}</span>
          <span className="cap">de 12</span>
        </Ring>
        <span className="ttl2">{closed ? 'Dia fechado' : 'Ainda hoje'}</span>
      </div>
      <Controls>
        <Button size="sm" onClick={() => setWater((w) => Math.min(3, w + 0.5))}>
          Água +500 ml
        </Button>
        <Button size="sm" onClick={() => setPct((p) => (p > 0.9 ? 0.2 : p + 0.18))}>
          Andar o anel
        </Button>
        <Button size="sm" onClick={() => setClosed((c) => !c)} data-testid="close-day">
          {closed ? 'Reabrir o dia' : 'Fechar o dia'}
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- Limites ---------------- */
export function LimitsSection() {
  const [used, setUsed] = useState(1);
  return (
    <Section id="limite" title="BudgetRow e BudgetSlots" note="O espaço usado enche com a mola; passar do limite mostra “3 de 2” em text-2, sem cor nova.">
      <div className="gx-pad">
        <Card className="pk-lst">
          <BudgetRow habit={HABITS.tranqueiras} used={used} total={2} note="até 2 dias por semana" onUse={() => setUsed((u) => u + 1)} />
          <BudgetRow habit={HABITS.livres} used={3} total={2} note="a semana recomeça segunda" />
        </Card>
      </div>
      <Controls>
        <Button variant="secondary" size="sm" onClick={() => setUsed(0)}>
          Zerar
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- Dias sem ---------------- */
export function DaysSinceSection() {
  const [days, setDays] = useState(21);
  const [record, setRecord] = useState(21);
  return (
    <Section id="dias-sem" title="DaysSinceTile" note="O número na Fraunces rola algarismo por algarismo, com a largura animada. Passando do recorde, entra o selo com a mola festa; no deslize, desce devagar até 0.">
      <div className="gx-pad pk-dsr">
        <DaysSinceTile habit={HABITS.refri} days={days} record={record} what="refrigerante" onOpen={noop} />
        <DaysSinceTile habit={HABITS.shorts} days={32} record={32} what="Shorts e TikTok" onOpen={noop} />
        <DaysSinceTile habit={HABITS.refri} days={12} record={21} what="refrigerante" onOpen={noop} />
        <DaysSinceTile habit={HABITS.shorts} days={1} record={32} what="Shorts e TikTok" onOpen={noop} />
      </div>
      <Controls>
        <Button
          size="sm"
          data-testid="plus-day"
          onClick={() => {
            setDays((d) => d + 1);
            setRecord((r) => Math.max(r, days + 1));
          }}
        >
          Mais um dia
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setDays((d) => d + 79)}>
          +79 dias
        </Button>
        <Button size="sm" variant="secondary" data-testid="slip" onClick={() => setDays(0)}>
          Registrar deslize
        </Button>
        <Button size="sm" variant="secondary" onClick={() => (setDays(21), setRecord(21))}>
          Voltar a 21
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- Rostinhos ---------------- */
export function FacesSection() {
  const [mood, setMood] = useState<FaceLevel | undefined>(4);
  const [energy, setEnergy] = useState<FaceLevel | undefined>(3);
  return (
    <Section id="rostos" title="RatingFaces, Face e RatingRow" note="Na cor primária: no humor muda a boca, na energia os olhos. O escolhido ganha o tom claro da primária e a mola toque.">
      <div className="gx-pad gx-stack">
        <SectionLabel inset>Humor</SectionLabel>
        <RatingFaces kind="mood" value={mood} onChange={setMood} />
        <SectionLabel inset>Energia</SectionLabel>
        <RatingFaces kind="energy" value={energy} onChange={setEnergy} />
        <Card padded className="gx-stack">
          <div className="gx-between">
            {([1, 2, 3, 4, 5] as const).map((l) => (
              <Face key={l} kind="mood" level={l} selected={l === 4} />
            ))}
          </div>
          <div className="gx-between">
            {([1, 2, 3, 4, 5] as const).map((l) => (
              <Face key={l} kind="energy" level={l} size={24} selected={l === 3} />
            ))}
          </div>
        </Card>
        <Card padded className="gx-between" pillar="alim">
          <span className="gx-row">
            <span className="gx-t">Almoço</span>
            <RatingRow value={4} pillar="alim" />
          </span>
          <RatingRow />
        </Card>
      </div>
      <Controls>
        <Button variant="secondary" size="sm" onClick={() => (setMood(undefined), setEnergy(undefined))}>
          Limpar
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- Controles ---------------- */
export function ControlsSection() {
  const [chips, setChips] = useState<string[]>(['seg', 'qui']);
  const [prot, setProt] = useState(true);
  const [tol, setTol] = useState(true);
  const [sound, setSound] = useState(false);
  const [period, setPeriod] = useState<'semana' | 'mes' | 'fase'>('semana');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('83,6');
  const [note, setNote] = useState('');
  const [days, setDays] = useState([0, 3]);
  const [review, setReview] = useState([6]);
  const [time, setTime] = useState('06:50');
  const [date, setDate] = useState('2026-12-24');
  const [plan, setPlan] = useState<'base' | 'zero'>('base');
  const D = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  return (
    <Section id="controles" title="Controles" note="Chip, Button, Switch, SegmentedControl, TextField, ListItem, DayPicker, TimeValue e OptionCard.">
      <div className="gx-pad gx-stack">
        <SectionLabel inset>Chips</SectionLabel>
        <ChipRow label="Dias de coleta do lixo">
          {D.map((d) => (
            <Chip key={d} selected={chips.includes(d)} onPressedChange={(on) => setChips((c) => (on ? [...c, d] : c.filter((x) => x !== d)))}>
              {d}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow>
          <Chip tint selected={prot} pillar="alim" onPressedChange={setProt}>
            Proteína
          </Chip>
          <Chip icon="egg" iconWeight="duotone" detail="6 g" onClick={noop}>
            Ovo
          </Chip>
          <Chip ok icon="check">
            meta batida
          </Chip>
          <Chip tint pillar="familia">
            Caminhada
          </Chip>
          <Chip>Acordar às 6h50</Chip>
        </ChipRow>

        <SectionLabel inset>Botões</SectionLabel>
        <Button wide>Começar revisão</Button>
        <Button variant="secondary" wide icon="pencil-simple">
          Editar fases
        </Button>
        <Button variant="tint" pillar="familia" wide icon="salsicha" iconWeight="fill">
          Caminhar agora
        </Button>
        <Button variant="warn" wide icon="trash">
          Apagar tudo
        </Button>
        <div className="gx-row">
          <Button variant="ghost">Ver o dia</Button>
          <Button size="sm">Salvar</Button>
          <Button size="sm" variant="secondary">
            Agora não
          </Button>
          <Button size="sm" disabled>
            Desabilitado
          </Button>
        </div>
        <Button wide disabled>
          Começar (desabilitado)
        </Button>

        <SectionLabel inset>Interruptor e segmentado</SectionLabel>
        <ListGroup>
          <ListItem title="Tolerância de 1h" subtitle="no fim de semana" toggle={{ checked: tol, onCheckedChange: setTol }} />
          <ListItem title="Som suave ao marcar" subtitle="desligado por padrão" toggle={{ checked: sound, onCheckedChange: setSound }} />
        </ListGroup>
        <div className="gx-row">
          <Switch checked={tol} onCheckedChange={setTol} label="Tolerância de 1h" />
          <Switch checked={false} onCheckedChange={noop} label="Desabilitado" disabled />
        </div>
        <SegmentedControl
          label="Período"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mês' },
            { value: 'fase', label: 'Fase' },
          ]}
        />

        <SectionLabel inset>Campos</SectionLabel>
        <TextField label="Nome do hábito" value={name} onChange={setName} placeholder="Ex.: Ler 10 páginas" enterKeyHint="next" />
        <TextField label="Peso de hoje" value={weight} onChange={setWeight} inputMode="decimal" unit="kg" enterKeyHint="done" />
        <TextField label="3 coisas boas" value={note} onChange={setNote} multiline placeholder="Uma por linha" />
        <TextField label="Buscar ícone" hideLabel value="" onChange={noop} icon="magnifying-glass" inputMode="search" placeholder="Buscar ícone" />
        <TextField label="Meta de proteína" value="800" onChange={noop} inputMode="numeric" unit="g" error="Esse número parece alto. Confira se são 80 g." />

        <SectionLabel inset>Lista</SectionLabel>
        <ListGroup>
          <ListItem icon="clock" title="Horários" subtitle="acordar, refeições e noite" onClick={noop} />
          <ListItem icon="palette" title="Aparência" value="Sistema" onClick={noop} />
          <ListItem icon="moon-stars" pillar="mente" title="Mente" subtitle="4 hábitos" onClick={noop} />
          <ListItem icon="alarm" title="Acordar" trailing={<TimeValue kind="time" value={time} onChange={setTime} label="Acordar" />} />
          <ListItem icon="trash" title="Apagar todos os dados" tone="warn" onClick={noop} />
        </ListGroup>

        <SectionLabel inset>Dias e horários</SectionLabel>
        <DayPicker value={days} onChange={setDays} pillar="familia" label="Dias de coleta" />
        <DayPicker value={review} onChange={setReview} single label="Dia da revisão" />
        <div className="gx-row">
          <TimeValue kind="time" value={time} onChange={setTime} label="Acordar" />
          <TimeValue kind="date" value={date} onChange={setDate} label="Volta da pausa" />
          <span style={{ background: 'var(--sunken)', padding: 6, borderRadius: 12 }}>
            <TimeValue kind="time" value="22:00" onChange={noop} label="Deitar" raised />
          </span>
          <TimeValue kind="time" value="14:00" onChange={noop} label="Fim da cafeína, a partir da fase 4" off />
        </div>

        <SectionLabel inset>Opções</SectionLabel>
        <OptionGroup value={plan} onChange={setPlan} label="Como começar">
          <OptionCard value="base" title="Com o plano base" badge="sugerido" description="Quatro pilares e os hábitos da fase 1. Tudo se ajusta depois." />
          <OptionCard value="zero" title="Do zero" description="Você cria os pilares e os hábitos." />
        </OptionGroup>
      </div>
    </Section>
  );
}

/* ---------------- Dados ---------------- */
export function DataSection() {
  const [strength, setStrength] = useState(72);
  return (
    <Section id="dados" title="Dados e informação" note="Heatmap e legenda, Stat e StatGroup, InsightCard, Tag, MiniBar e CardHeader.">
      <div className="gx-pad gx-stack">
        <Card padded pillar="familia" className="gx-stack">
          <CardHeader title="Desde 21 de setembro" subtitle="toque num dia para corrigir" trailing={<Tag pillar="familia">24 caminhadas</Tag>} />
          <Heatmap days={walkHeatmap()} today={TODAY} pillar="familia" label="Desde 21 de setembro: 24 dias feitos, 1 parcial, 1 pausado, 7 sem caminhada." onSelect={noop} />
          <HeatmapKey
            items={[
              { state: 'done', label: 'Feito' },
              { state: 'partial', label: 'Parcial' },
              { state: 'none', label: 'Sem caminhada' },
              { state: 'paused', label: 'Pausado' },
              { state: 'off', label: 'Fora da agenda' },
              { state: 'future', label: 'Por vir' },
              { state: 'today', label: 'Hoje' },
            ]}
          />
        </Card>
        <StatGroup
          pillar="familia"
          items={[
            { label: 'Força', value: strength, unit: '%', icon: 'heartbeat' },
            { label: 'Recorde', value: 21, unit: 'dias', icon: 'trophy' },
            { label: 'Total', value: 24, unit: 'dias', icon: 'calendar-blank' },
          ]}
        />
        <Card padded pillar="familia" className="gx-stack" style={{ gap: 8 }}>
          <div className="gx-between">
            <span className="gx-t">Força do hábito</span>
            <span className="sub pk-num">
              <NumberFlow value={strength} suffix="%" />
            </span>
          </div>
          <MiniBar value={strength} pillar="familia" />
          <MiniBar value={64} pillar="alim" thick />
        </Card>
        <InsightCard
          pillar="familia"
          icon="smiley"
          text="Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4."
          basis="24 dias com · 8 dias sem"
          compare={{ with: 4.1, without: 3.4, withLabel: 'com caminhada', withoutLabel: 'sem caminhada' }}
        />
        <InsightCard pillar="mente" icon="alarm" text="Nos dias em que você acordou no horário, a constância do resto do dia foi 84%. Nos outros, 61%." basis="20 dias com · 12 sem · desde 21 de setembro" />
        <div className="gx-row">
          <Tag pillar="familia" dot>
            Família
          </Tag>
          <Tag ok icon="check">
            meta batida
          </Tag>
          <Tag pillar="alim" icon="trophy" iconWeight="fill">
            recorde
          </Tag>
          <Tag pillar="accent" upper>
            Agora
          </Tag>
          <Tag>fase 4</Tag>
          <span style={{ background: 'var(--accent-wash)', padding: 6, borderRadius: 12 }}>
            <Tag lift>sugerido</Tag>
          </span>
        </div>
      </div>
      <Controls>
        <Button size="sm" onClick={() => setStrength((s) => (s >= 90 ? 40 : s + 9))}>
          Mudar a força
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- Estrutura e estados ---------------- */
export function StructureSection() {
  const [open, setOpen] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  return (
    <Section id="estrutura" title="Estrutura e estados" note="FoldedGroup abre com a mola calma; esqueleto só depois de 300 ms, com respiração lenta.">
      <div className="gx-pad gx-stack">
        <FoldedGroup
          icons={[
            { icon: 'scales', pillar: 'alim' },
            { icon: 'alarm', pillar: 'mente' },
            { icon: 'salsicha', pillar: 'familia' },
          ]}
          title="Tudo feito"
          subtitle="peso, acordar e caminhada"
          complete
          expanded={open}
          onToggle={() => setOpen((v) => !v)}
        >
          <HabitRow habit={HABITS.peso} subtitle="média de 7 dias no Progresso" done control={<ValuePill value="83,6 kg" label="Peso, 83,6 quilos" onClick={noop} />} onOpen={noop} />
          <HabitRow habit={HABITS.acordar} subtitle="meta 6h50" done control={<ValuePill value="6h52" label="Acordar, 6h52" onClick={noop} />} onOpen={noop} />
          <HabitRow habit={HABITS.caminhada} subtitle="3 de 7 · meta 6" done control={<CheckButton checked onCheckedChange={noop} label="Caminhada com o cachorro" />} onOpen={noop} />
        </FoldedGroup>
        <FoldedGroup
          icons={[
            { icon: 'alarm', pillar: 'mente' },
            { icon: 'salsicha', pillar: 'familia' },
            { icon: 'fork-knife', pillar: 'alim' },
            { icon: 'soccer-ball', pillar: 'corpo' },
          ]}
          more={4}
          title="Feitos hoje · 8"
          subtitle="toque para ver ou desmarcar"
          expanded={false}
          onToggle={noop}
        />
        <AddRow onClick={noop}>Novo pilar</AddRow>
        <ProfileCard name="Henrique" onClick={noop} />
        <EmptyState icon="archive" title="Nenhum pilar arquivado." detail="O que você arquivar aparece aqui, com o histórico guardado." />
        <EmptyState title="Nenhum alimento hoje." action={{ label: 'Adicionar', onClick: noop }} />
        <SkeletonGroup key={loadKey} delay={loadKey ? 300 : 0}>
          <Card>
            <SkeletonRow />
            <SkeletonRow title={0.48} />
            <SkeletonRow title={0.7} noControl />
          </Card>
          <div className="gx-row" style={{ marginTop: 12 }}>
            <Skeleton width={120} height={12} shape="pill" />
            <Skeleton width={56} height={56} shape="circle" />
          </div>
        </SkeletonGroup>
        <Card padded className="gx-palette">
          {PALETTE_KEYS.map((k) => (
            <PillarBubble key={k} icon="leaf" pillar={k} />
          ))}
          <PillarBubble icon="gear-six" />
          <PillarBubble icon="egg" pillar="alim" weight="fill" />
          <PillarBubble icon="salsicha" pillar="familia" size="lg" />
        </Card>
      </div>
      <Controls>
        <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Recolher' : 'Abrir'} “Tudo feito”
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setLoadKey((k) => k + 1)}>
          Carregar de novo (300 ms)
        </Button>
      </Controls>
    </Section>
  );
}

/* ---------------- Números ---------------- */
export function NumbersSection() {
  const [g, setG] = useState(46);
  const [l, setL] = useState(1.5);
  return (
    <Section id="numeros" title="NumberFlow" note="Números que mudam usam a Onest com algarismos tabulares e rolam em fill (400 ms), em português.">
      <div className="gx-pad">
        <Card padded className="gx-between">
          <span className="big">
            <NumberFlow value={g} suffix=" g" />
          </span>
          <span className="stat">
            <NumberFlow value={l} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix=" L" />
          </span>
        </Card>
      </div>
      <Controls>
        <Button size="sm" onClick={() => setG((v) => v + 30)}>
          +30 g
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setG((v) => Math.max(0, v - 30))}>
          −30 g
        </Button>
        <Button size="sm" onClick={() => setL((v) => Math.round((v + 0.5) * 10) / 10)}>
          +500 ml
        </Button>
      </Controls>
    </Section>
  );
}
