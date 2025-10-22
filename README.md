# 🚗 Bot de WhatsApp para Corridas de Carro

Bot automático de WhatsApp para agendamento e gerenciamento de corridas de carro, com geocoding, cálculo de rotas e notificações.

## 🌟 Funcionalidades

- ✅ Conexão com WhatsApp via @whiskeysockets/baileys
- 📍 Detecção automática de localização compartilhada ou conversão de endereços
- 🗺️ Integração com OpenCage Geocoding API
- 🛣️ Cálculo de rotas com OpenRouteService Directions API
- 💰 Cálculo automático de preço baseado em distância
- 📅 Sistema de agendamento de corridas
- ⏰ Lembretes automáticos com node-cron
- 🔔 Notificação automática para motorista
- 💾 Armazenamento em memória (leve e rápido)

## 📋 Pré-requisitos

1. **Node.js 20+** instalado
2. **Chaves de API:**
   - OpenCage Geocoding API: https://opencagedata.com/
   - OpenRouteService API: https://openrouteservice.org/

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
8. **Bot:** Confirma e notifica o motorista

## 💰 Configuração de Preços

Edite `src/config/constants.js` para ajustar:

```javascript
PRICING: {
   se
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
│   │   ├── geocoding.js          # Serviço OpenCage
│   │   ├── routing.js            # Serviço OpenRouteService
│   │   └── pricing.js            # Cálculo de preços
│   └── utils/
│       └── storage.js            # Armazenamento em memória
├── package.json
├── .env.example
└── README.md
```

## ⚠️ Avisos Importantes

- Este bot usa uma biblioteca não oficial do WhatsApp (@whiskeysockets/baileys)
- O uso pode violar os termos de serviço do WhatsApp
- Recomendado apenas para uso pessoal/testes
- Para produção, considere usar a API oficial do WhatsApp Business

## 🔧 Suporte

Para problemas ou dúvidas, verifique:
- As chaves de API estão corretas
- O WhatsApp está conectado (QR Code escaneado)
- As mensagens estão chegando no console

## 📝 Licença

MIT
