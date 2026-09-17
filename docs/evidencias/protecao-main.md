# Evidência — proteção da branch `main`

- **Repositório:** https://github.com/igorSeberino/g1126-template-prato-cheio
- **Branch protegida:** `main` (branch padrão)
- **Data em que a proteção foi ligada:** 17/09/2026
- **Quem ligou:** Igor Thiago Seberino (@igorSeberino)

## Quem do grupo tem permissão de administrador

Conferido antes de ligar a proteção, via
`gh api repos/igorSeberino/g1126-template-prato-cheio/collaborators`:

| Integrante | Usuário GitHub | Permissão | Admin? |
|---|---|---|:--:|
| Igor Thiago Seberino | @igorSeberino | admin (dono do repositório) | **sim** |
| Adrian Cesar Gonçalves | @adrian-cesar | write | não |
| Diego Nessler | @Diegonessler | write | não |
| Gabriel Carvalho | @gabrielcarvallho | write | não |
| Renato Colin Neto | @rcolinneto | write | não |

O grupo tem **um** administrador. Isso não trava a entrega de hoje, mas é um ponto único
de falha: se o Igor faltar, ninguém mais consegue alterar a configuração de proteção. Se
o grupo quiser eliminar esse risco, o próprio Igor pode promover um segundo integrante a
`admin` em *Settings → Collaborators*.

> Observação: no `README.md` o Renato está listado como `@RenatoColin`, mas o usuário
> efetivamente com acesso ao repositório é **@rcolinneto**. Vale corrigir o README.

## O que foi ligado

Regras aplicadas em `main`:

| Regra | Valor | Por quê |
|---|---|---|
| Require a pull request before merging | **ligado** | "Nada entra na `main` sem Pull Request" |
| Required approvals | **1** | O PR precisa da revisão de **outro integrante** (o autor não aprova o próprio PR) |
| Dismiss stale pull request approvals when new commits are pushed | **ligado** | Se o autor empurrar commit novo depois da aprovação, a revisão cai e precisa ser refeita — senão o "revisado" vale para um código que não é o que vai entrar |
| Require status checks to pass before merging | **ligado**, check `build-e-testes` | É o job do `.github/workflows/ci.yml`. É isso que significa "CI verde" |
| Require branches to be up to date before merging (`strict`) | **desligado** | Não é exigido pela regra da disciplina e obrigaria o grupo a rebasear a cada merge de colega. Se a `main` começar a quebrar por merges concorrentes, ligamos |
| Do not allow bypassing the above settings (`enforce_admins`) | **ligado** | Sem isso, o único admin do grupo continuaria podendo empurrar direto na `main` — a regra valeria para quatro dos cinco |
| Allow force pushes | **desligado** | Force push reescreve a `main` e contorna todo o resto |
| Allow deletions | **desligado** | Impede apagar a `main` por acidente |

## Evidência

Leitura do estado **depois** de ligar, com
`gh api repos/igorSeberino/g1126-template-prato-cheio/branches/main`:

```json
{ "name": "main", "protected": true }
```

E `gh api repos/igorSeberino/g1126-template-prato-cheio/branches/main/protection`:

```json
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["build-e-testes"]
  },
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "enforce_admins": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

Antes de ligar, a mesma chamada devolvia `404 Branch not protected`, e
`gh api .../rulesets` devolvia `[]` — ou seja, não havia nenhuma proteção anterior.

**Prova funcional:** este próprio Pull Request. Ele fica com o botão de merge bloqueado
("Review required" + check `build-e-testes` pendente) até que outro integrante aprove e o
CI feche verde. Nenhum integrante — incluindo o admin — consegue merge antes disso.

Resultado observado no PR #2, com o CI **já verde**:

```json
{
  "mergeStateStatus": "BLOCKED",
  "reviewDecision": "REVIEW_REQUIRED",
  "checks": [{ "name": "build-e-testes", "status": "COMPLETED", "conclusion": "SUCCESS" }]
}
```

Ou seja: CI verde **não basta**. Enquanto nenhum outro integrante aprovar, o merge
continua bloqueado — inclusive para o admin, porque `enforce_admins` está ligado.

## Como qualquer integrante confere

Pela interface: *Settings → Branches → Branch protection rules → `main`*.
Pelo terminal, sem precisar ser admin:

```bash
gh api repos/igorSeberino/g1126-template-prato-cheio/branches/main --jq '.protected'
```

## O que muda no dia a dia, a partir de hoje

1. Ninguém trabalha na `main`. Sempre `git checkout -b <tipo>/<historia>`.
2. Abre o PR, preenche o template (`.github/pull_request_template.md`), espera o
   `build-e-testes` ficar verde.
3. Pede revisão de **outro** integrante — quem escreveu não aprova o próprio PR.
4. Só então faz o merge.

Vale até o fim do semestre e é critério de aceite do Trabalho 2.

**Se a proteção precisar ser afrouxada em emergência:** só o @igorSeberino consegue, em
*Settings → Branches*, e o grupo registra na retrospectiva da iteração o que aconteceu e
quando a regra voltou — para a exceção não virar o novo normal.
