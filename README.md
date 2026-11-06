# ⚑ Treasure Hunt

App acadêmico simples em **React Native + Expo**, escrito em JavaScript. Balance o celular para abrir um baú pirata, receber uma arma e tentar encontrar o token pirata. Interface em português, inspirada nas imagens fornecidas.

## Executar

Use Node.js 22.13 ou superior (testado com Node 24) e Expo Go compatível com SDK 58.

```bash
git clone https://github.com/paywin/treasurehunt.git
cd treasurehunt
npm install
npm start
```

No celular, abra o QR code com o Expo Go, na mesma rede Wi-Fi do computador. Se a rede bloquear a conexão, tente `npx expo start --tunnel`. Toque em **Ativar abertura por movimento**, permita o sensor e balance o aparelho levemente. O botão **Abrir baú** funciona como alternativa.

No computador: `npm run web`. O navegador usa o botão de abertura; o movimento é destinado ao aplicativo nativo. Android e iOS usam o mesmo código. Não é necessário configurar chave de API, servidor ou conta Epic.

## O que o app faz

- Anima o baú antes de revelar o resultado.
- Garante exatamente uma arma em toda abertura, escolhida entre quatro opções.
- Sorteia o token com chance de **1 em 100.000 (0,001%) por abertura**.
- Tem 35% de chance de entregar também um bônus, escolhido entre oito opções.
- Guarda contagem de baús e quantidade de cada item no aparelho com AsyncStorage.
- Consulta uma API real e mostra nome, descrição e imagem do cosmético Coração Negro.
- Exibe carregamento, erro e botão para tentar novamente quando a API falha. O sorteio continua funcionando offline.

Os bônus são adaptações simplificadas da referência: acelerador, extrator, fogos, localizadores, navio, mapa e traje dourado. As raridades são etiquetas visuais; os oito bônus têm chances iguais entre si quando há bônus. O token pode sair junto com uma arma e um bônus.

## Como explicar no curso

| Arquivo | Responsabilidade |
| --- | --- |
| `App.js` | Tela, abas, animação, modal e salvamento da coleção |
| `src/styles.js` | Cores, tamanhos e organização visual |
| `src/loot.js` | Listas de itens, sorteio e atualização da coleção |
| `src/api.js` | Requisição HTTP com `fetch`, validação e tempo limite |
| `src/useShake.js` | Permissão, acelerômetro e remoção do listener |
| `tests/loot.test.mjs` | Testes das regras e tratamento da API |

`useState` guarda os dados da tela; `useEffect` executa carregamento e salvamento; `useRef` bloqueia aberturas duplicadas. O sensor calcula a intensidade com `Math.sqrt(x*x + y*y + z*z)`. Ao passar de 1,8 g, chama a abertura. Existe intervalo mínimo de 1,5 segundo; o sensor fica suspenso na coleção, durante a abertura, com o resultado aberto e em segundo plano.

O sorteio usa `Math.floor(Math.random() * 100000) === 0`. Os números vão de 0 a 99.999 e somente zero ganha. Cada tentativa é independente: abrir 100.000 baús **não garante** ganhar. `Math.random` é suficiente para esta simulação acadêmica, não para prêmios reais ou sistemas que precisem impedir manipulação. O sorteio ocorre localmente; a API fornece apenas o cosmético exibido em seção identificada.

## API e referências

- [Fortnite-API](https://fortnite-api.com/) — API pública de terceiros.
- Endpoint utilizado: `https://fortnite-api.com/v2/cosmetics/br/search?name=Blackheart&language=pt-BR`.
- [Documentação do acelerômetro Expo](https://docs.expo.dev/versions/latest/sdk/accelerometer/).

Exemplo simplificado da resposta consumida:

```json
{"data":{"name":"Coração Negro","description":"O temido capitão...","images":{"icon":"https://.../icon.png"}}}
```

Não há integração com inventário ou prêmios reais do Fortnite. Token é apenas um item virtual da simulação, não criptomoeda. Projeto independente, sem vínculo com Epic Games. A imagem do baú foi fornecida pelo solicitante; Fortnite e suas artes pertencem aos respectivos titulares. A licença do template Expo não transfere direitos sobre essas artes.

## Verificação

```bash
npm test
npx expo install --check
npx expo export --platform all
```

Roteiro no celular: ativar o sensor, abrir um baú balançando, conferir a arma no resultado, fechar o resultado, consultar a coleção e reiniciar o app para verificar persistência. Testar também permissão negada e modo avião. Não é preciso esperar ganhar um token: os testes verificam deterministicamente o resultado vencedor e os 100.000 intervalos, sem alterar a chance no app.

Para mudar os itens, edite `src/loot.js`; para mudar o visual, edite `src/styles.js`. Não há backend, login, pagamentos ou bibliotecas de navegação: duas abas são controladas por um estado simples.

