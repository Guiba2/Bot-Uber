# 🚗 Bot de WhatsApp para Corridas de Carro

Bot automático de WhatsApp para agendamento e gerenciamento de corridas de carro, com geocoding, cálculo de rotas e notificações.

## 🌟 Funcionalidades

- ✅ Conexão com WhatsApp via @whiskeysockets/baileys
- 📍 Detecção automática de localização compartilhada ou conversão de endereços
- 🗺️ Geocoding com **OpenCage API** (via SDK oficial `opencage-api-client`)
- 🛣️ Cálculo de rotas com **OpenRouteService API** (via SDK oficial `openrouteservice-js`)
- 💰 Cálculo automático de preço baseado em distância
- 📅 Sistema de agendamento de corridas com linguagem natural ("hoje 14h", "amanhã 18:30")
- ⏰ Lembretes automáticos com node-cron (1 hora antes da corrida)
- 🔔 Notificação automática para motorista
- 💾 Armazenamento em memória (leve e rápido)

## 📋 Pré-requisitos

1. **Node.js 20+** instalado
2. **Chaves de API:**
   - OpenCage Geocoding API: https://opencagedata.com/ (2.500 req/dia grátis)
   - OpenRouteService API: https://openrouteservice.org/ (2.000 req/dia grátis)

## 🚀 Instalação

1. Clone o repositório ou baixe os arquivos

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas chaves de API:
```env
OPENCAGE_API_KEY=sua_chave_opencage
OPENROUTESERVICE_API_KEY=sua_chave_openrouteservice
DRIVER_PHONE=5511999999999
DRIVER_IP=auto
```

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `OPENCAGE_API_KEY` | Chave de API do OpenCage para geocoding | ✅ Sim |
| `OPENROUTESERVICE_API_KEY` | Chave de API do OpenRouteService para rotas | ✅ Sim |
| `DRIVER_PHONE` | Número do motorista no formato internacional (ex: 5511999999999) | ✅ Sim |
| `DRIVER_IP` | IP do motorista ou "auto" para detecção automática | ⚠️ Recomendado |

## ▶️ Como Usar

1. Inicie o bot:
```bash
npm start
```

2. Escaneie o QR Code que aparecerá no terminal com seu WhatsApp

3. Aguarde a mensagem "✅ Conectado ao WhatsApp!"

4. O bot está pronto! Clientes podem enviar mensagens como:
   - "Quero chamar um carro"
   - "Chamar carro"
   - "Preciso de carro"

## 💬 Fluxo de Conversa

1. **Cliente:** "Quero chamar um carro"
2. **Bot:** "Olá! Qual é o ponto de partida?"
3. **Cliente:** Envia endereço ou localização
4. **Bot:** "Ótimo! Agora me informe o destino."
5. **Cliente:** Envia destino
6. **Bot:** Mostra resumo com distância, tempo e valor
7. **Cliente:** "confirmar" ou "agendar"
8. **Bot:** Se agendar, pergunta horário ("hoje 14:00" ou "amanhã 18:30")
9. **Bot:** Confirma e notifica o motorista

## 💰 Configuração de Preços

Edite `src/config/constants.js` para ajustar:

```javascript
PRICING: {
  BASE_FARE: 5.00,         // Tarifa base
  PRICE_PER_KM: 2.50,      // Preço por km
  MINIMUM_FARE: 10.00,     // Valor mínimo
}
```

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── bot.js                    # Arquivo principal do bot
│   ├── config/
│   │   └── constants.js          # Configurações e constantes
│   ├── services/
│   │   ├── geocoding.js          # Serviço OpenCage (SDK oficial)
│   │   ├── routing.js            # Serviço OpenRouteService (SDK oficial)
│   │   └── pricing.js            # Cálculo de preços
│   └── utils/
│       └── storage.js            # Armazenamento em memória
├── package.json
├── .env.example
└── README.md
```

## 🔧 SDKs Utilizados

Este projeto utiliza os **SDKs oficiais** das APIs para maior confiabilidade:

- **`opencage-api-client`** (v2.0.1+): Cliente oficial do OpenCage para geocoding
  - Lê a chave de API de `process.env.OPENCAGE_API_KEY`
  - Tratamento automático de erros e rate limiting (código 402)
  - Documentação: https://www.npmjs.com/package/opencage-api-client

- **`openrouteservice-js`** (v0.4.1+): Cliente oficial do OpenRouteService para rotas
  - Suporte completo para directions, isochrones, geocoding, etc.
  - Tratamento de erros com códigos HTTP e internos
  - Documentação: https://www.npmjs.com/package/openrouteservice-js

## ⚠️ Avisos Importantes

- Este bot usa uma biblioteca não oficial do WhatsApp (@whiskeysockets/baileys)
- O uso pode violar os termos de serviço do WhatsApp
- Recomendado apenas para uso pessoal/testes
- Para produção, considere usar a API oficial do WhatsApp Business
- Os dados são armazenados em memória e serão perdidos ao reiniciar o bot

## 🔧 Suporte

Para problemas ou dúvidas, verifique:
- As chaves de API estão corretas no arquivo `.env`
- O WhatsApp está conectado (QR Code escaneado)
- As mensagens estão chegando no console
- Limites diários das APIs não foram excedidos:
  - OpenCage: 2.500 requisições/dia (plano gratuito)
  - OpenRouteService: 2.000 requisições/dia (plano gratuito)

## 📝 Licença

MIT
