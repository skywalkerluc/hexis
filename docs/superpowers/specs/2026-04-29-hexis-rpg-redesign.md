# Hexis RPG Redesign — Design Spec
_Data: 2026-04-29_

## Visão geral

O Hexis passa a ser um RPG de vida real, não uma ferramenta de produtividade. O modelo de atributos já existe e é correto — o problema é como o app apresenta esse modelo para o usuário. Esta spec cobre o redesenho completo de experiência, linguagem e estética.

### Três pilares

1. **Estética sombria e atmosférica** — fundo escuro, tipografia com caráter, destaques em dourado/âmbar. Referência visual: Skyrim, Shadows of Mordor.
2. **Linguagem em português, vocabulário de jogo** — sem "evidência", "cultivação", "calibração". O usuário entende "registrar ação", "habilidades", "missão sugerida", "subiu de nível".
3. **Cada ação tem peso visual** — o sistema de feedback é o coração da experiência. Logar uma ação de esforço alto precisa parecer que algo aconteceu.

---

## Onboarding — Criação de personagem

O onboarding passa de "formulário de configuração" para "criação de personagem". Em ~2 minutos a pessoa sente que tem um personagem, não que configurou um app.

### Tela 1 — Boas-vindas
- Fundo escuro, título grande: *"Sua jornada começa aqui."*
- Subtítulo: *"Escolha seus focos, registre suas ações, veja seu personagem evoluir."*
- CTA único: **Criar personagem**

### Tela 2 — Escolha de objetivos
- Título: *"O que você quer desenvolver?"*
- Grid de checkboxes com ícone + nome + descrição curta
- Máximo 4 selecionados
- As descrições ficam visíveis aqui e também na ficha de personagem — o usuário sempre sabe o escopo de cada habilidade

**Os 10 objetivos:**

| Ícone | Nome | Descrição |
|-------|------|-----------|
| 🧠 | Concentração | Foco profundo, resistência à distração |
| ⚡ | Energia | Disposição física e mental no dia a dia |
| 🔥 | Disciplina | Consistência mesmo sem motivação |
| 💪 | Força | Capacidade física e saúde |
| 🎨 | Criatividade | Pensamento original, expressão e solução de problemas |
| 😌 | Equilíbrio | Gestão de estresse e bem-estar emocional |
| 📚 | Aprendizado | Aquisição de conhecimento e habilidades novas |
| 🗣️ | Comunicação | Expressão, escuta e relações interpessoais |
| 💰 | Finanças | Gestão financeira, poupança e consciência econômica |
| ⚔️ | Coragem | Tomar iniciativa, superar o medo, sair da zona de conforto |

Sem objetivos custom em v1 — o sistema precisa saber quais atributos ativar e como pesar ações de cada objetivo.

### Tela 3 — A ficha aparece (momento "aha")
- Os atributos correspondentes aos objetivos escolhidos surgem um a um com animação de entrada
- Cada um com barra de progresso no nível inicial e label **"Nível 1"**
- Texto: *"Estes são seus atributos iniciais. Cada ação que você registrar vai movê-los."*
- CTA: **Entrar no painel**

---

## Painel principal

Abrir o app deve parecer abrir a tela de personagem de um RPG.

### Topo — identidade do personagem
- Nome do usuário + nível geral calculado a partir do composite score
- Ex: *"Lucas · Nível 12"*
- Barra de XP horizontal mostrando progresso para o próximo nível
- Remove o "7.3 / 20" — a barra comunica visualmente

### Ficha de habilidades
- Atributos escolhidos no onboarding em destaque
- Cada um: ícone + nome + descrição curta + barra de progresso + badge de status
- Badges de status em português: **Em alta · Estável · Em declínio** (substitui IMPROVING, STABLE, AT_RISK, DECAYING)
- Tap abre detalhe do atributo

### Chamada pra ação — sempre visível
- Botão fixo e proeminente: **"Registrar ação"**
- É a ação principal do app — não pode estar escondida

### Missão sugerida *(substitui "recommendations")*
- Card com a sugestão mais relevante do momento
- Copy direto: *"Você não treina Concentração há 2 dias. Que tal uma sessão de leitura?"*
- Ações: **Registrar isso** / **Ignorar**

### Atividade recente
- Últimas 3 ações registradas, compactas
- Mostra que o histórico existe sem dominar a tela

---

## Logging — Registrar ação

O fluxo substitui o formulário atual por uma conversa sequencial em 4 passos:

1. **"O que você fez?"** — texto livre, curto. Ex: *"Treinei por 45 minutos"*, *"Li 30 páginas"*
2. **"Qual foi o esforço?"** — 3 botões visuais: **Leve · Moderado · Intenso**
3. **"Qual objetivo isso treina?"** — chips selecionáveis com os objetivos do usuário (apenas os escolhidos no onboarding)
4. Botão **Registrar** — grande, sem ambiguidade

### Feedback visual pós-registro

O momento mais importante do app. Varia por nível de esforço:

**Leve**
- Barra do atributo sobe suavemente com brilho sutil (ease-out 300ms)
- Texto: *"+XP em Concentração"*

**Moderado**
- Barra sobe com animação mais pronunciada, partícula dourada saindo da barra (500ms)
- Texto: *"Bom progresso. +XP em Disciplina"*

**Intenso**
- Flash âmbar na tela inteira (200ms) + partículas + barra com glow
- Texto em destaque: *"Ação de alto impacto. +XP em Força"*
- Se o atributo cruzar um threshold: *"Nível X alcançado"* com animação de celebração

---

## Estética visual

### Paleta
| Papel | Valor |
|-------|-------|
| Fundo | `#0d0d0d` |
| Superfície | `#1a1a1a` |
| Destaque primário (XP, progresso) | Dourado/âmbar — `--color-gold` já existe |
| Destaque secundário (ação positiva) | Verde-azulado — `--color-teal` já existe |
| Texto principal | `#e8e8e0` |
| Texto secundário | `#888888` |
| Alerta/declínio | Laranja apagado |

### Tipografia
- Títulos: serifada ou display com caráter — remete a inscrições, gravuras
- Corpo: sans-serif legível, médio peso
- Labels de status: caixa alta com tracking largo (padrão `hexis-eyebrow` já existe)

### Barras de progresso
- Fundo escuro com borda sutil
- Preenchimento em gradiente dourado → âmbar
- Glow suave na ponta da barra preenchida
- Animam ao entrar na tela

### Cards / superfícies
- Borda `1px solid` em tom levemente mais claro que o fundo
- Sem sombras brancas — sombras escuras ou nenhuma
- Cantos levemente arredondados

---

## Mapeamento de linguagem (inglês → português)

| Atual (EN) | Novo (PT) |
|-----------|-----------|
| Log evidence | Registrar ação |
| Evidence | Ação / Registro |
| Attributes | Habilidades / Atributos |
| Cultivation goal | Objetivo |
| Recommendations | Missões sugeridas |
| Decay / Decaying | Declínio / Em declínio |
| Improving | Em alta |
| At risk | Em risco |
| Stable | Estável |
| Dashboard | Painel |
| Weekly review | Revisão semanal |
| Loop / Template | Rotina |
| Base / Current / Potential | Base / Atual / Potencial |
| Calibration | Calibração inicial |
| Composite score | Nível geral |

---

## Fases de implementação

### Fase 1 — Core (MVP do redesign)
1. Tradução de todo o copy para português
2. Redesenho do onboarding como criação de personagem (3 telas + 10 objetivos)
3. Feedback visual pós-log (animações por nível de esforço)
4. Painel com barra de XP e badges de status em português

### Fase 2 — Estética
5. Tema visual dark completo (paleta, tipografia, barras de progresso com glow)
6. Animações de entrada nas telas de atributos

### Fora de escopo (v1)
- Objetivos customizados
- Som/haptic feedback
- Sistema de conquistas/achievements
- Modo multiplayer ou comparação social
