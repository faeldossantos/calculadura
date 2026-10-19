# Calma · Finanças pessoais

Uma aplicação em português para registrar receitas e despesas, acompanhar o saldo mensal e planejar orçamentos por categoria. Interface responsiva em React, TypeScript e Vite, com ícones Lucide e fonte DM Sans incluída no projeto.

## Executar

Requisitos: Node.js 22.6 ou superior e npm. Ambiente validado com Node.js 24 e npm 11.

```sh
npm ci
npm run dev
```

O servidor de desenvolvimento usa a porta 5173. Para gerar a versão de produção:

```sh
npm test
npm run build
npm run preview
```

`npm run build` verifica os tipos e gera os arquivos estáticos em `dist/`. A publicação pode usar qualquer hospedagem de sites estáticos. Nenhuma variável de ambiente ou chave de API é necessária.

Para o GitHub Pages deste repositório, use `npm run build -- --base=/calculadura/`. As instruções de ativação e atualização estão em [PUBLICACAO.md](PUBLICACAO.md).

## Uso

- A primeira abertura mostra dados de exemplo identificados. **Usar meus dados** remove os exemplos após confirmação.
- **Nova transação** registra receitas ou despesas com valor, categoria, data, conta e observação opcional. Os registros podem ser editados e excluídos.
- O seletor de mês atualiza o painel, os gráficos, a tabela e os orçamentos. A busca, os filtros e a paginação ajudam a encontrar transações.
- **Orçamentos** define limites mensais por categoria. O disponível considera apenas despesas das categorias com orçamento.
- **Seus dados** exporta um backup completo em JSON, restaura backups validados e exporta transações do mês em CSV.

## Dados e limites

Os dados são salvos exclusivamente no `localStorage` do navegador, na chave `calma-financas-v1`. Não há conta de usuário, sincronização, conexão bancária ou servidor de dados. Limpar o armazenamento do navegador remove os dados. Faça backups regulares; importar um backup substitui o conteúdo atual após confirmação. As fontes e os ícones são servidos localmente, sem serviços externos em tempo de execução.

O saldo mensal é a diferença entre todas as receitas e despesas registradas no mês, incluindo datas futuras. A conta é uma classificação do registro; não há cálculo de saldo bancário, parcelamento ou faturas de cartão.

## Verificação

`npm test` verifica conversão monetária em centavos, totais e filtros mensais, mudanças de ano, validação de backups e exportação CSV. Os fluxos de cadastro, edição, exclusão, busca, filtros, orçamentos, persistência e restauração também foram verificados com Chromium em telas de computador e celular.

Para repetir a verificação funcional com o servidor de desenvolvimento em execução, use Python com Playwright e Chromium instalados:

```sh
python3 tests/browser_smoke.py
```

O teste usa um contexto isolado, sem alterar os dados do seu navegador. `APP_URL` permite escolher o endereço do servidor e `CHROMIUM_PATH` o executável do navegador. As larguras verificadas são 360, 390, 768, 1024 e 1440 pixels.
