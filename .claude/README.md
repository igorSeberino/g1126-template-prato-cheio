# Pasta `.claude/` — como o Claude trabalha neste repositório

O Claude Code lê esta pasta sozinho quando alguém abre o repositório. Todo o grupo usa as
mesmas regras e os mesmos procedimentos.

```
CLAUDE.md                      regras do projeto: o QUE vale sempre (arquitetura, testes, ADR, PR)
.claude/
  README.md                    este índice
  skills/                      procedimentos: COMO fazer cada tarefa recorrente
    nova-historia/SKILL.md     história ou bug, do teste Dado/Quando/Então ao PR
    adr/SKILL.md               ADR novo, substituído ou revisado
    adr/modelo.md              modelo completo de ADR (com Critério de validação)
    revisar-pr/SKILL.md        preparar a revisão do PR de um colega
    revisar-pr/checklist.md    checklist de revisão do projeto
    conferir-entrega/SKILL.md  conferir uma entrega contra o enunciado (só leitura)
    preparar-defesa/SKILL.md   folha de cola da defesa individual
```

## Como usar

No Claude Code, dentro da pasta do repositório:
- peça normalmente ("implementa a história do doador cancelar a doação") e o Claude escolhe
  a skill; ou
- chame pelo nome: `/nova-historia`, `/adr`, `/revisar-pr`, `/conferir-entrega`,
  `/preparar-defesa`.

## Como manter

- **Regra** (algo que vale sempre) vai no `CLAUDE.md`. **Procedimento** (passo a passo de
  uma tarefa) vira skill.
- Cada skill fica numa pasta própria com um `SKILL.md`. Material de consulta (modelo,
  checklist) vai em arquivo separado na mesma pasta.
- Mudanças aqui entram por PR, como qualquer outra mudança.
