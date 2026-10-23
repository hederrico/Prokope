// Catálogo de ícones para pilares e hábitos (a biblioteca curada de docs/design-system.html).
// Cada ícone tem nome em português, palavras-chave para a busca e a categoria do seletor.
import type { IconName } from '@/icons';

export interface IconCategory {
  key: string;
  label: string;
}

export interface IconEntry {
  name: IconName;
  /** nome em português ("Cofrinho") */
  label: string;
  /** palavras para a busca, em minúsculas */
  keywords: string;
  category: string;
}

export const ICON_CATEGORIES: IconCategory[] = [
  { key: 'mente', label: 'Mente e sono' },
  { key: 'alim', label: 'Alimentação' },
  { key: 'corpo', label: 'Corpo e movimento' },
  { key: 'familia', label: 'Família e casa' },
  { key: 'saude', label: 'Saúde' },
  { key: 'trabalho', label: 'Trabalho e estudo' },
  { key: 'dinheiro', label: 'Dinheiro' },
  { key: 'lazer', label: 'Lazer e natureza' },
  { key: 'relacoes', label: 'Relações e fé' },
  { key: 'parar', label: 'Deixar de lado' },
];

export const ICON_CATALOG: IconEntry[] = [
  { name: 'brain', label: 'Mente', keywords: 'cérebro mente pensar', category: 'mente' },
  { name: 'moon-stars', label: 'Sono', keywords: 'sono noite dormir', category: 'mente' },
  { name: 'bed', label: 'Cama', keywords: 'cama dormir descanso', category: 'mente' },
  { name: 'alarm', label: 'Despertador', keywords: 'despertador acordar', category: 'mente' },
  { name: 'sun-horizon', label: 'Manhã', keywords: 'manhã nascer do sol luz', category: 'mente' },
  { name: 'book-open', label: 'Leitura', keywords: 'leitura ler livro', category: 'mente' },
  { name: 'notebook', label: 'Diário', keywords: 'diário anotar escrever', category: 'mente' },
  { name: 'lightbulb', label: 'Ideia', keywords: 'ideia aprender', category: 'mente' },
  { name: 'flower-lotus', label: 'Meditação', keywords: 'meditação calma', category: 'mente' },
  { name: 'yin-yang', label: 'Equilíbrio', keywords: 'equilíbrio', category: 'mente' },
  { name: 'wind', label: 'Respirar', keywords: 'respirar respiração', category: 'mente' },
  { name: 'sparkle', label: 'Gratidão', keywords: 'gratidão coisas boas', category: 'mente' },
  { name: 'device-mobile-slash', label: 'Sem celular', keywords: 'sem celular telas', category: 'mente' },
  { name: 'television-simple', label: 'TV', keywords: 'tv televisão telas', category: 'mente' },
  { name: 'headphones', label: 'Fones', keywords: 'fones música', category: 'mente' },
  { name: 'hourglass-medium', label: 'Tempo', keywords: 'tempo paciência pausa', category: 'mente' },
  { name: 'bowl-food', label: 'Refeição', keywords: 'refeição prato comida', category: 'alim' },
  { name: 'fork-knife', label: 'Almoço', keywords: 'almoço jantar comer', category: 'alim' },
  { name: 'cooking-pot', label: 'Cozinhar', keywords: 'cozinhar panela', category: 'alim' },
  { name: 'egg', label: 'Ovo', keywords: 'ovo proteína', category: 'alim' },
  { name: 'cheese', label: 'Queijo', keywords: 'queijo proteína', category: 'alim' },
  { name: 'bread', label: 'Pão', keywords: 'pão café da manhã', category: 'alim' },
  { name: 'grains', label: 'Grãos', keywords: 'grãos feijão arroz', category: 'alim' },
  { name: 'carrot', label: 'Legumes', keywords: 'legumes cenoura salada', category: 'alim' },
  { name: 'avocado', label: 'Abacate', keywords: 'abacate gordura boa', category: 'alim' },
  { name: 'orange-slice', label: 'Fruta', keywords: 'fruta laranja suco', category: 'alim' },
  { name: 'cherries', label: 'Frutas', keywords: 'frutas cereja', category: 'alim' },
  { name: 'fish', label: 'Peixe', keywords: 'peixe', category: 'alim' },
  { name: 'drop', label: 'Água', keywords: 'água beber hidratação', category: 'alim' },
  { name: 'pint-glass', label: 'Copo', keywords: 'copo bebida suco refrigerante', category: 'alim' },
  { name: 'coffee', label: 'Café', keywords: 'café cafeína', category: 'alim' },
  { name: 'cookie', label: 'Bolacha', keywords: 'bolacha doce tranqueira', category: 'alim' },
  { name: 'ice-cream', label: 'Sorvete', keywords: 'sorvete doce', category: 'alim' },
  { name: 'hamburger', label: 'Lanche', keywords: 'lanche hambúrguer fast food', category: 'alim' },
  { name: 'pizza', label: 'Pizza', keywords: 'pizza refeição livre', category: 'alim' },
  { name: 'wine', label: 'Vinho', keywords: 'vinho álcool', category: 'alim' },
  { name: 'person-simple-run', label: 'Corrida', keywords: 'corrida correr', category: 'corpo' },
  { name: 'person-simple-walk', label: 'Caminhada', keywords: 'caminhada andar', category: 'corpo' },
  { name: 'person-simple-hike', label: 'Trilha', keywords: 'trilha', category: 'corpo' },
  { name: 'person-simple-bike', label: 'Bicicleta', keywords: 'pedalar bicicleta', category: 'corpo' },
  { name: 'person-simple-swim', label: 'Natação', keywords: 'natação nadar', category: 'corpo' },
  { name: 'person-simple-tai-chi', label: 'Alongamento', keywords: 'alongamento yoga', category: 'corpo' },
  { name: 'barbell', label: 'Academia', keywords: 'academia musculação peso', category: 'corpo' },
  { name: 'sneaker-move', label: 'Tênis', keywords: 'tênis passos', category: 'corpo' },
  { name: 'footprints', label: 'Passos', keywords: 'passos pegadas', category: 'corpo' },
  { name: 'soccer-ball', label: 'Futebol', keywords: 'futebol', category: 'corpo' },
  { name: 'basketball', label: 'Basquete', keywords: 'basquete', category: 'corpo' },
  { name: 'tennis-ball', label: 'Tênis', keywords: 'tênis esporte', category: 'corpo' },
  { name: 'volleyball', label: 'Vôlei', keywords: 'vôlei', category: 'corpo' },
  { name: 'heartbeat', label: 'Cardio', keywords: 'cardio batimentos', category: 'corpo' },
  { name: 'scales', label: 'Balança', keywords: 'peso balança', category: 'corpo' },
  { name: 'lightning', label: 'Energia', keywords: 'energia disposição', category: 'corpo' },
  { name: 'fire', label: 'Calorias', keywords: 'calorias queimar', category: 'corpo' },
  { name: 'medal', label: 'Conquista', keywords: 'conquista medalha', category: 'corpo' },
  { name: 'trophy', label: 'Troféu', keywords: 'troféu meta', category: 'corpo' },
  { name: 'target', label: 'Alvo', keywords: 'alvo foco meta', category: 'corpo' },
  { name: 'house', label: 'Casa', keywords: 'casa lar', category: 'familia' },
  { name: 'salsicha', label: 'Cachorro', keywords: 'cachorro salsicha dachshund passeio pet', category: 'familia' },
  { name: 'cat', label: 'Gato', keywords: 'gato pet', category: 'familia' },
  { name: 'paw-print', label: 'Pet', keywords: 'pet animal', category: 'familia' },
  { name: 'baby', label: 'Bebê', keywords: 'bebê filho', category: 'familia' },
  { name: 'users-three', label: 'Família', keywords: 'família pessoas', category: 'familia' },
  { name: 'heart', label: 'Amor', keywords: 'amor casal a dois', category: 'familia' },
  { name: 'hand-heart', label: 'Gesto', keywords: 'gesto carinho ajudar', category: 'familia' },
  { name: 'gift', label: 'Presente', keywords: 'presente surpresa', category: 'familia' },
  { name: 'broom', label: 'Limpar', keywords: 'limpar faxina casa', category: 'familia' },
  { name: 'trash', label: 'Lixo', keywords: 'lixo recicláveis', category: 'familia' },
  { name: 'washing-machine', label: 'Lavar roupa', keywords: 'roupa lavar', category: 'familia' },
  { name: 't-shirt', label: 'Roupas', keywords: 'roupas', category: 'familia' },
  { name: 'couch', label: 'Sala', keywords: 'sala descanso', category: 'familia' },
  { name: 'potted-plant', label: 'Plantas', keywords: 'plantas regar', category: 'familia' },
  { name: 'shopping-cart', label: 'Mercado', keywords: 'mercado compras', category: 'familia' },
  { name: 'car', label: 'Carro', keywords: 'carro trajeto', category: 'familia' },
  { name: 'key', label: 'Chaves', keywords: 'chaves organização', category: 'familia' },
  { name: 'pill', label: 'Remédio', keywords: 'remédio vitamina suplemento', category: 'saude' },
  { name: 'first-aid-kit', label: 'Primeiros socorros', keywords: 'primeiros socorros', category: 'saude' },
  { name: 'stethoscope', label: 'Médico', keywords: 'médico consulta', category: 'saude' },
  { name: 'syringe', label: 'Vacina', keywords: 'vacina exame', category: 'saude' },
  { name: 'thermometer', label: 'Febre', keywords: 'febre temperatura', category: 'saude' },
  { name: 'tooth', label: 'Dentes', keywords: 'dentes escovar fio dental', category: 'saude' },
  { name: 'bandaids', label: 'Curativo', keywords: 'curativo', category: 'saude' },
  { name: 'eyeglasses', label: 'Óculos', keywords: 'óculos visão', category: 'saude' },
  { name: 'heart-straight', label: 'Coração', keywords: 'coração saúde', category: 'saude' },
  { name: 'hospital', label: 'Hospital', keywords: 'hospital', category: 'saude' },
  { name: 'virus', label: 'Doença', keywords: 'doença gripe', category: 'saude' },
  { name: 'prescription', label: 'Receita', keywords: 'receita médica', category: 'saude' },
  { name: 'briefcase', label: 'Trabalho', keywords: 'trabalho', category: 'trabalho' },
  { name: 'laptop', label: 'Computador', keywords: 'computador notebook', category: 'trabalho' },
  { name: 'desktop', label: 'PC', keywords: 'pc tela', category: 'trabalho' },
  { name: 'code', label: 'Programar', keywords: 'programar código', category: 'trabalho' },
  { name: 'graduation-cap', label: 'Curso', keywords: 'curso formatura', category: 'trabalho' },
  { name: 'student', label: 'Estudar', keywords: 'estudar aluno', category: 'trabalho' },
  { name: 'chalkboard-teacher', label: 'Aula', keywords: 'aula professor', category: 'trabalho' },
  { name: 'pen-nib', label: 'Escrever', keywords: 'escrever caneta', category: 'trabalho' },
  { name: 'books', label: 'Livros', keywords: 'livros estudo', category: 'trabalho' },
  { name: 'calendar-check', label: 'Agenda', keywords: 'agenda planejar', category: 'trabalho' },
  { name: 'list-checks', label: 'Tarefas', keywords: 'tarefas lista', category: 'trabalho' },
  { name: 'kanban', label: 'Projetos', keywords: 'projetos quadro', category: 'trabalho' },
  { name: 'presentation-chart', label: 'Apresentação', keywords: 'apresentação reunião', category: 'trabalho' },
  { name: 'translate', label: 'Idiomas', keywords: 'idiomas inglês', category: 'trabalho' },
  { name: 'microphone', label: 'Falar', keywords: 'falar podcast', category: 'trabalho' },
  { name: 'envelope', label: 'E-mail', keywords: 'e-mail mensagens', category: 'trabalho' },
  { name: 'wallet', label: 'Carteira', keywords: 'carteira gastos', category: 'dinheiro' },
  { name: 'piggy-bank', label: 'Cofrinho', keywords: 'poupar economizar cofrinho', category: 'dinheiro' },
  { name: 'coins', label: 'Moedas', keywords: 'moedas', category: 'dinheiro' },
  { name: 'money', label: 'Dinheiro', keywords: 'dinheiro', category: 'dinheiro' },
  { name: 'bank', label: 'Banco', keywords: 'banco', category: 'dinheiro' },
  { name: 'credit-card', label: 'Cartão', keywords: 'cartão crédito', category: 'dinheiro' },
  { name: 'receipt', label: 'Contas', keywords: 'recibo contas', category: 'dinheiro' },
  { name: 'hand-coins', label: 'Investir', keywords: 'pagar investir', category: 'dinheiro' },
  { name: 'chart-pie-slice', label: 'Orçamento', keywords: 'orçamento divisão', category: 'dinheiro' },
  { name: 'chart-line-up', label: 'Investimentos', keywords: 'investimentos crescer', category: 'dinheiro' },
  { name: 'shopping-bag', label: 'Compras', keywords: 'compras', category: 'dinheiro' },
  { name: 'tag', label: 'Preço', keywords: 'preço desconto', category: 'dinheiro' },
  { name: 'tree-evergreen', label: 'Árvore', keywords: 'árvore natureza', category: 'lazer' },
  { name: 'park', label: 'Parque', keywords: 'parque', category: 'lazer' },
  { name: 'mountains', label: 'Montanhas', keywords: 'montanhas', category: 'lazer' },
  { name: 'waves', label: 'Mar', keywords: 'mar praia', category: 'lazer' },
  { name: 'tent', label: 'Acampar', keywords: 'acampar', category: 'lazer' },
  { name: 'campfire', label: 'Fogueira', keywords: 'fogueira', category: 'lazer' },
  { name: 'compass', label: 'Explorar', keywords: 'explorar', category: 'lazer' },
  { name: 'airplane', label: 'Viagem', keywords: 'viagem avião', category: 'lazer' },
  { name: 'camera', label: 'Foto', keywords: 'foto fotografia', category: 'lazer' },
  { name: 'guitar', label: 'Violão', keywords: 'violão tocar', category: 'lazer' },
  { name: 'piano-keys', label: 'Piano', keywords: 'piano música', category: 'lazer' },
  { name: 'music-notes', label: 'Música', keywords: 'música cantar', category: 'lazer' },
  { name: 'paint-brush', label: 'Pintar', keywords: 'pintar arte', category: 'lazer' },
  { name: 'palette', label: 'Desenhar', keywords: 'desenhar arte', category: 'lazer' },
  { name: 'game-controller', label: 'Videogame', keywords: 'videogame jogos', category: 'lazer' },
  { name: 'puzzle-piece', label: 'Quebra-cabeça', keywords: 'quebra-cabeça', category: 'lazer' },
  { name: 'film-slate', label: 'Filme', keywords: 'filme cinema', category: 'lazer' },
  { name: 'binoculars', label: 'Observar', keywords: 'observar', category: 'lazer' },
  { name: 'bird', label: 'Pássaros', keywords: 'pássaros', category: 'lazer' },
  { name: 'butterfly', label: 'Borboleta', keywords: 'borboleta', category: 'lazer' },
  { name: 'cloud-sun', label: 'Ar livre', keywords: 'ar livre tempo', category: 'lazer' },
  { name: 'umbrella', label: 'Chuva', keywords: 'chuva', category: 'lazer' },
  { name: 'hands-praying', label: 'Oração', keywords: 'oração fé', category: 'relacoes' },
  { name: 'church', label: 'Igreja', keywords: 'igreja culto missa', category: 'relacoes' },
  { name: 'handshake', label: 'Amizade', keywords: 'amizade parceria', category: 'relacoes' },
  { name: 'hands-clapping', label: 'Celebrar', keywords: 'celebrar', category: 'relacoes' },
  { name: 'chat-teardrop-text', label: 'Conversar', keywords: 'conversar', category: 'relacoes' },
  { name: 'phone', label: 'Ligar', keywords: 'ligar telefonar', category: 'relacoes' },
  { name: 'users', label: 'Amigos', keywords: 'amigos', category: 'relacoes' },
  { name: 'smiley-wink', label: 'Bom humor', keywords: 'bom humor', category: 'relacoes' },
  { name: 'prohibit', label: 'Parar', keywords: 'parar evitar', category: 'parar' },
  { name: 'cigarette-slash', label: 'Parar de fumar', keywords: 'parar de fumar', category: 'parar' },
  { name: 'cigarette', label: 'Cigarro', keywords: 'cigarro', category: 'parar' },
  { name: 'phone-slash', label: 'Sem ligações', keywords: 'sem ligações', category: 'parar' },
  { name: 'bell-slash', label: 'Sem notificações', keywords: 'sem notificações', category: 'parar' },
  { name: 'speaker-slash', label: 'Silêncio', keywords: 'silêncio sem música', category: 'parar' },
  { name: 'eye-slash', label: 'Sem redes sociais', keywords: 'sem redes sociais', category: 'parar' },
  { name: 'grains-slash', label: 'Sem glúten', keywords: 'sem glúten carboidrato', category: 'parar' },
  { name: 'beer-stein', label: 'Cerveja', keywords: 'álcool cerveja', category: 'parar' },
  { name: 'prohibit-inset', label: 'Bloquear', keywords: 'bloquear', category: 'parar' },
];

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Busca sem acento e sem caixa, por começo de palavra no nome e nas palavras-chave:
 * "agua" acha Água, "poupar" acha Cofrinho. A ordem é nome exato, começo do nome e palavra-chave.
 */
export function searchIcons(query: string): IconEntry[] {
  const q = norm(query);
  if (!q) return ICON_CATALOG;
  const scored: { e: IconEntry; s: number }[] = [];
  for (const e of ICON_CATALOG) {
    const label = norm(e.label);
    const words = norm(`${e.label} ${e.keywords}`).split(/\s+/);
    let s = -1;
    if (label === q) s = 0;
    else if (label.startsWith(q)) s = 1;
    else if (words.some((w) => w.startsWith(q))) s = 2;
    if (s >= 0) scored.push({ e, s });
  }
  return scored.sort((a, b) => a.s - b.s).map((x) => x.e);
}

/** Palavras de nome de pilar que apontam para uma categoria. */
const CATEGORY_HINTS: Record<string, string> = {
  financa: 'dinheiro',
  financas: 'dinheiro',
  grana: 'dinheiro',
  economia: 'dinheiro',
  saude: 'saude',
  casa: 'familia',
  lar: 'familia',
  filhos: 'familia',
  estudo: 'trabalho',
  estudos: 'trabalho',
  carreira: 'trabalho',
  fe: 'relacoes',
  espiritualidade: 'relacoes',
  amigos: 'relacoes',
  lazer: 'lazer',
  natureza: 'lazer',
  hobby: 'lazer',
  sono: 'mente',
  mente: 'mente',
  corpo: 'corpo',
  treino: 'corpo',
  comida: 'alim',
  alimentacao: 'alim',
  vicios: 'parar',
};

/** A categoria que combina com um nome ("Finanças" → Dinheiro), para "sugerido pelo nome". */
export function suggestCategory(name: string): string | null {
  const words = norm(name)
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (!words.length) return null;
  for (const w of words) if (CATEGORY_HINTS[w]) return CATEGORY_HINTS[w];
  const count = new Map<string, number>();
  for (const e of ICON_CATALOG) {
    const hay = norm(`${e.label} ${e.keywords}`).split(/\s+/);
    if (words.some((w) => hay.some((h) => h.length >= 3 && (h.startsWith(w) || w.startsWith(h))))) {
      count.set(e.category, (count.get(e.category) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  for (const [k, v] of count) if (!best || v > (count.get(best) ?? 0)) best = k;
  return best;
}

/** O ícone sugerido pelo nome de um hábito ("Leitura" → book-open), ou null. */
export function suggestIcon(name: string): IconName | null {
  for (const w of norm(name).split(/\s+/)) {
    if (w.length < 3) continue;
    const hit = searchIcons(w)[0];
    if (hit) return hit.name;
  }
  return null;
}

/** O nome em português de um ícone ("piggy-bank" → "Cofrinho"). */
export function iconLabel(name: string): string {
  return ICON_CATALOG.find((e) => e.name === name)?.label ?? name;
}
