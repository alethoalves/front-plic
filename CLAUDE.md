# Regras de design do front-plic

Este arquivo documenta o sistema de estilo já existente no projeto
(`styles/partials/*.scss`, `styles/globals.css`, `components/Button.jsx`).
**Leia antes de qualquer mudança de layout.** A maioria dos bugs visuais
neste projeto vem de misturar as convenções abaixo, não de falta de CSS.

## 0. Regra de ouro: reaproveite o padrão que já existe na tela/feature vizinha, não um componente novo de lib

Antes de implementar um elemento de UI (abas, modais, tabelas, filtros,
cards de listagem...), **procure primeiro se esse elemento já existe em
outra página do projeto** (`grep`/`Explore` por nome do elemento, ex.
"aba", "modal", "card") e copie o padrão local (classe CSS Module da
própria página + JSX), em vez de importar um componente pronto de uma lib
(PrimeReact, etc.) que tem sua própria skin. O projeto usa PrimeReact para
tabelas/inputs/overlays complexos, mas para elementos simples (como abas)
já tem um padrão próprio, mais leve e visualmente consistente com o resto
do sistema.

Exemplo real: abas de navegação simples (duas ou mais opções, troca de
conteúdo por clique) **não usam `TabView` do PrimeReact** — usam um par de
classes CSS Module por página, `.abas`/`.aba`/`.abaAtiva`, com estado local
`useState` guardando o id da aba ativa. Referência canônica:
`app/[tenant]/configuracoes/gestor/(itens)/formularios/page.jsx` +
`page.module.scss` (mesma pasta). Padrão:
```scss
// no page.module.scss da própria página
.abas { display: flex; gap: 0; border-bottom: 2px solid rgba(#000, 0.1); margin-top: $gap-3; }
.aba {
  background: none; border: none; border-bottom: 2px solid transparent;
  margin-bottom: -2px; padding: $gap-2 $gap-3; cursor: pointer;
  font-size: 0.9rem; font-weight: 500; color: $gray-500;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: $primary-normal; }
  &.abaAtiva { color: $primary-normal; border-bottom-color: $primary-normal; font-weight: 700; }
}
```
```jsx
const ABAS = [{ id: "a", label: "..." }, { id: "b", label: "..." }];
const [abaAtiva, setAbaAtiva] = useState("a");
// ...
<div className={styles.abas}>
  {ABAS.map((aba) => (
    <button key={aba.id} type="button"
      className={`${styles.aba} ${abaAtiva === aba.id ? styles.abaAtiva : ""}`}
      onClick={() => setAbaAtiva(aba.id)}>
      {aba.label}
    </button>
  ))}
</div>
{abaAtiva === "a" && <>...</>}
{abaAtiva === "b" && <>...</>}
```
Reproduza esse mesmo raciocínio pra qualquer outro elemento de UI antes de
puxar algo novo do PrimeReact.

## 1. Existem DOIS componentes `Button` diferentes — não confunda

- `import Button from "@/components/Button"` — botão **próprio do projeto**.
  Renderiza `<button class="button {className}">`. A cor/variante vem do
  `className` que você passa: `btn-primary`, `btn-secondary`, `btn-error`,
  `btn-error-outline`, `btn-blue`, `btn-green`, `btn-warning`, `btn-yellow`,
  `btn-link` (definidos em `styles/partials/_buttons.scss:65-226`). O texto
  vai sempre dentro de `children` (`<p className="p5">`) — a cor do texto já
  vem certa de cada classe (ex.: `.btn-primary p { color: $white-light }`).
- `import { Button } from "primereact/button"` — botão do **PrimeReact**
  (tema `lara-light-blue`, importado em `styles/globals.css:2`). Variantes
  via `className`: sem classe = azul (primário), `p-button-secondary`,
  `p-button-danger`, `p-button-text`, `p-button-outlined`, etc.

**Nunca misture as duas convenções no mesmo botão** (ex.: `className="btn-primary"`
num `Button` do PrimeReact não faz o que parece — essas classes foram
desenhadas pro componente próprio).

## 2. A armadilha nº 1: `<p>` dentro de `Button` do PrimeReact

`styles/globals.css:1428` define globalmente:
```css
p, a { color: #505C68; /* $gray-600 */ }
```
Isso é uma regra **diretamente aplicada ao elemento `<p>`**, então ela
sempre vence a cor herdada do botão (herança tem prioridade mais baixa que
qualquer regra direta, não importa a especificidade do pai). Ou seja:

- Se você usa a prop `label` do PrimeReact Button (`<Button label="Salvar" />`),
  o texto vira um `<span class="p-button-label">` — **não** é pego pela regra
  `p,a{color:...}`, e herda a cor certa do tema automaticamente. **Prefira
  sempre `label` quando o conteúdo é só texto.**
- Se você precisa de `children` customizados (ex.: badge dentro do texto,
  like `<Button><p>Enviar <span>{count}</span></p></Button>`), o `<p>` **vai
  sair cinza por padrão**, mesmo num botão azul/verde. Corrija com
  `style={{ color: "#fff" }}` (ou a cor certa da variante) direto no `<p>`.
  Veja exemplos existentes: `.btn-primary p { color: $white-light }` em
  `_buttons.scss:69-71` é o mesmo princípio aplicado ao componente próprio.

## 3. A armadilha nº 2: botão `disabled`

`styles/partials/_buttons.scss:227-243` (compilado em `globals.css:1739+`
via o mesmo seletor) define, para **qualquer** `<button disabled>` (nativo
ou de dentro do PrimeReact, que renderiza um `<button>` real):
```scss
button:disabled {
  background-color: $white-light; // quase branco
  color: $gray-600;
  p { color: $gray-600; }
}
```
Se você forçar `style={{color:"#fff"}}` num `<p>` dentro de um botão que
também está `disabled`, o texto branco fica ilegível sobre o fundo quase
branco que essa regra aplica. **Ao desabilitar um botão, não force cor de
texto — deixe a regra de `:disabled` cuidar disso.** Se precisar de um
motivo visível pro usuário, use `title="..."` (tooltip nativo) em vez de
tentar estilizar o estado disabled manualmente.

## 4. Cores — sempre variáveis, nunca hex solto

`styles/partials/_colors.scss` define a paleta. Uso comum:
- Marca/tenant (dinâmica por tenant, injetada via CSS custom properties em
  `--primary-*`): `$primary-darken`, `$primary-dark`, `$primary-normal`,
  `$primary-light`, `$primary-lighten`.
- Semânticas fixas (não mudam por tenant): `$success-normal`/`$success-dark`
  (verde), `$error-normal`/`$error-dark` (vermelho), `$warning-normal`/
  `$warning-dark` (amarelo).
- Neutras: `$white-light` → `$white-darken` (claro→escuro) e
  `$gray-25` → `$gray-800` (claro→escuro).

Nunca escreva `#0069d9`, `#fff` etc. direto num componente novo — use a
variável (ou, se for JSX inline sem acesso a SCSS, use o hex real da
variável, documentado acima, não um valor inventado).

## 5. Espaçamento — sempre a escala de `$gap-*`, nunca px arbitrário

`styles/partials/_spacing.scss` define `$gap-1` a `$gap-9` (8, 16, 24, 32,
48, 64, 72, 96, 128px) e gera classes utilitárias prontas:
`.m-*`, `.mt-*`, `.mb-*`, `.ml-*`, `.mr-*`, `.mx-*`, `.my-*`, `.p-*`, `.pt-*`,
`.pb-*`, `.pl-*`, `.pr-*`, `.px-*`, `.py-*` (todas com `!important`, `1..9`
mapeando pra `$gap-1..9`), mais `.gap-1/2/3` para `gap` em flex/grid.

Regra prática: qualquer elemento novo colado direto ao lado de outro
(botões numa lista, título acima de tabela, campos de formulário) deve ter
uma dessas classes — não deixe o espaçamento "de graça" do navegador.
`.flex-space` (`_layout.scss:214`) é o padrão do projeto pra "duas coisas,
uma de cada lado, alinhadas ao centro" (ex.: título + botão de ação).

## 6. Tipografia

`styles/partials/_typography.scss`: `.h0`–`.h7` para títulos (mixin
`typeface-1`, fonte Kanit), `.p1`–`.p5` para texto (mixin `typeface-2`,
fonte Lato). O `<p>` puro (sem classe) já cai em `p3` + `$gray-600` por
padrão (ver item 2). O componente próprio `Button.jsx` já aplica `.p5` no
texto automaticamente — não precisa reaplicar.

## 7. Checklist antes de dar por pronta uma mudança de layout

0. Esse elemento (aba, modal, card, filtro...) já existe em outra tela do
   projeto? Se sim, copiou o padrão local em vez de puxar um componente
   novo de lib?
1. Todo `Button` do PrimeReact com texto simples usa a prop `label` (não `<p>` filho)?
2. Todo `<p>`/`children` dentro de um botão colorido (PrimeReact ou próprio)
   tem a cor de texto explícita batendo com o fundo?
3. Nenhum botão `disabled` está com cor de texto forçada via `style`?
4. Todo espaçamento entre elementos novos usa `$gap-*`/classes utilitárias,
   não valores soltos?
5. Cores vêm de `$primary-*`/`$success-*`/`$error-*`/`$warning-*`/`$gray-*`,
   não de hex inventado?
