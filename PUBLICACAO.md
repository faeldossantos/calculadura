# Publicação no GitHub Pages

O código-fonte fica na branch `main`. A branch `gh-pages` contém a versão estática compilada, pronta para servir pelo GitHub Pages. Não há servidor de aplicação ou credenciais de banco de dados.

## Ativar o site

Nas configurações do repositório `faeldossantos/calculadura`, abra **Pages**:

1. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
2. Selecione **gh-pages**, pasta **/ (root)**, e clique em **Save**.
3. Aguarde a publicação terminar. A própria página de configurações informa o endereço e o estado do site.

O endereço padrão esperado após a ativação é `https://faeldossantos.github.io/calculadura/`. Salvar o ambiente do Codex é uma operação separada da publicação deste site.

## Atualizar a versão publicada

Antes de enviar uma atualização para `gh-pages`, execute no checkout do projeto:

```sh
npm ci
npm test
npm run build -- --base=/calculadura/
```

Publique o conteúdo de `dist/` na raiz da branch `gh-pages`, incluindo um arquivo vazio `.nojekyll`. Preserve o histórico da branch e qualquer configuração de domínio personalizada. Atualizar apenas a branch `main` não altera a versão estática publicada.

Os testes funcionais podem ser executados contra o build antes do envio:

```sh
npm run preview -- --base=/calculadura/ --port 4173
APP_URL=http://127.0.0.1:4173/calculadura/ python3 tests/browser_smoke.py
```

## Dados pessoais

O site contém o aplicativo e exemplos demonstrativos. As transações pessoais são salvas no navegador de quem o utiliza, sem serem enviadas ao GitHub. O armazenamento é específico do endereço do site e do navegador. Para transferir dados de outra versão da aplicação, use o backup JSON em **Seus dados**.
