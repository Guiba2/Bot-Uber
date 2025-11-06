# 🚗 Bot de WhatsApp para Corridas com GPS em Tempo Real (v3.0)

Bot automático de WhatsApp com **localização GPS de alta precisão** do motorista em tempo real via navegador.

## 🆕 Novidades v3.0 - Sistema GPS

- 📍 **Localização GPS de alta precisão** via navegador (`enableHighAccuracy: true`)
- 🌐 **Interface web** para o motorista compartilhar localização
- 🎯 **Precisão de até 5-20 metros** (vs 1-5 km do IP)
- 🔄 **Atualização em tempo real** da posição do motorista
- 📊 **Indicador de precisão** (Excelente/Média/Baixa)
- 💾 **Armazenamento em arquivo** para persistência
- 🚀 **Dois modos**: GPS (padrão) ou IP (fallback)

## 🎯 Comparação: GPS vs IP

| Característica | GPS (Novo) | IP (Antigo) |
|---------------|------------|-------------|
| **Precisão** | 5-20 metros | 1-5 km |
| **Atualização** | Tempo real | Estática |
| **Mobilidade** | Sim | Não |
| **Configuração** | Interface web | Automática |
| **Ideal para** | Motoristas | Testes |

## 📋 Pré-requisitos

1. **Node.js 20+** instalado
2. **Chaves de API:**
   - OpenCage Geocoding API: https://opencagedata.com/
   - OpenRouteService API: https://openrouteservice.org/
3. **Navegador moderno** com suporte a Geolocation API

## 🚀 Instalação

1. Clone o repositório

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (`.env`):
```env
# APIs
OPENCAGE_API_KEY=sua_chave_opencage
OPENROUTESERVICE_API_KEY=sua_chave_openrouteservice

# Motorista
DRIVER_PHONE=5511999999999
DRIVER_LOCATION_MODE=gps
# Opções: 'gps' (padrão, via navegador) ou 'ip' (detecção por IP)
```

## 🎮 Como Usar

### **Opção 1: Modo Completo (Recomendado)**

Execute ambos os serviços simultaneamente:

```bash
npm run dev
```

Isso inicia:
- 🌐 Servidor de localização em `http://localhost:3000`
- 🤖 Bot do WhatsApp

### **Opção 2: Serviços Separados**

Terminal 1 - Servidor de Localização:
```bash
npm run server
```

Terminal 2 - Bot do WhatsApp:
```bash
npm start
```

## 📱 Compartilhando Localização do Motorista

### **Passo 1: Abrir Interface Web**

Acesse no navegador (celular ou computador do motorista):
```
http://localhost:3000
```

Ou, se estiver em outro dispositivo na mesma rede:
```
http://[IP-DO-SERVIDOR]:3000
```

### **Passo 2: Permitir Localização**

1. Clique em **"📍 Iniciar Rastreamento"**
2. Navegador pedirá permissão de localização
3. Clique em **"Permitir"**
4. Aguarde a localização ser obtida

### **Passo 3: Verificar Status**

A interface mostrará:
```
✅ Localização ativa e sendo atualizada

📍 Latitude: -23.550520
📍 Longitude: -46.633308
🏙️ Cidade: São Paulo, São Paulo
📊 Precisão: 12m
🕐 Última atualização: 14:30:25

✅ Excelente precisão (GPS ativo)
```

### **Passo 4: Manter Navegador Aberto**

- ⚠️ **Importante**: Mantenha o navegador aberto durante o expediente
- 💡 Use um tablet ou celular dedicado
- 🔋 Conecte na tomada para não gastar bateria
- 📱 Pode usar em segundo plano (navegador minimizado)

## 🔧 Configuração Avançada

### **Modo GPS (Padrão)**

```env
DRIVER_LOCATION_MODE=gps
```

- ✅ Alta precisão (5-20m)
- ✅ Atualização em tempo real
- ⚠️ Requer interface web aberta
- ⚠️ Consome mais bateria

### **Modo IP (Fallback)**

```env
DRIVER_LOCATION_MODE=ip
DRIVER_IP=auto
```

- ✅ Configuração zero
- ✅ Não precisa interface web
- ⚠️ Baixa precisão (1-5km)
- ⚠️ Localização estática

### **Alterar Porta do Servidor**

Edite `src/server.js`:
```javascript
const PORT = 3000; // Altere para 8080, 5000, etc.
```

## 💬 Fluxo de Conversa

1. **Cliente:** "Chamar carro"
2. **Bot:** Solicita origem
3. **Cliente:** Envia localização ou endereço
4. **Bot:** Mostra 5 opções de origem
5. **Cliente:** Escolhe opção ou refina busca
6. **Bot:** Solicita destino
7. **Cliente:** Envia destino
8. **Bot:** Atualiza localização GPS do motorista 🔄
9. **Bot:** Mostra resumo com:
   ```
   🚗 Localização do Motorista:
      São Paulo, São Paulo
      (atualizado agora)
      Precisão: 15m
   
   📏 Distância do motorista até você: 3.5 km
   ⏱️ Tempo do motorista até você: 12 minutos
   
   📏 Distância da corrida: 5.2 km
   📏 Distância total: 8.7 km
   💰 Valor total: R$ 26,75
   
   💡 O valor inclui o deslocamento do motorista até você.
   ```

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── bot.js                    # Bot WhatsApp com suporte GPS
│   ├── server.js                 # ⭐ Servidor web de localização (NOVO)
│   ├── config/
│   │   └── constants.js          # Configurações
│   ├── services/
│   │   ├── geocoding.js          # Geocoding
│   │   ├── routing.js            # Rotas
│   │   └── pricing.js            # Preços (distância total)
│   └── utils/
│       └── storage.js            # Armazenamento
├── public/
│   └── driver-location.html      # ⭐ Interface web GPS (NOVO)
├── driver-location.json          # ⭐ Arquivo de localização (GERADO)
├── package.json
├── .env
└── README.md
```

## 🎨 Interface Web

### **Recursos:**
- 📍 Coordenadas em tempo real
- 🏙️ Cidade/região automática
- 📊 Indicador de precisão
- 🕐 Timestamp de atualização
- ✅ Feedback visual (cores)
- ⏸️ Pausar/retomar rastreamento

### **Indicadores de Precisão:**
- ✅ **Verde** (< 20m): Excelente - GPS ativo
- ⚠️ **Amarelo** (20-100m): Média
- ❌ **Vermelho** (> 100m): Baixa - vá ao ar livre

## 🔒 Segurança

### **Dados Armazenados:**
```json
{
  "latitude": -23.550520,
  "longitude": -46.633308,
  "accuracy": 15.2,
  "city": "São Paulo",
  "region": "São Paulo",
  "country": "Brazil",
  "timestamp": "2025-11-06T14:30:25.123Z",
  "source": "gps"
}
```

### **Privacidade:**
- ✅ Dados armazenados localmente
- ✅ Não compartilhados com terceiros
- ✅ Pode ser pausado a qualquer momento
- ⚠️ Cliente não vê coordenadas exatas, apenas distância

## 🐛 Troubleshooting

### **Problema: "Permissão negada"**
**Solução:**
1. Verifique configurações de localização do navegador
2. Use HTTPS (em produção)
3. Tente outro navegador (Chrome recomendado)

### **Problema: "Precisão baixa" (> 100m)**
**Solução:**
1. Vá para área aberta (janela/varanda)
2. Aguarde alguns segundos
3. Verifique se GPS do dispositivo está ativo
4. Reinicie o navegador

### **Problema: "Arquivo de localização não encontrado"**
**Solução:**
1. Inicie o servidor: `npm run server`
2. Abra a interface em `http://localhost:3000`
3. Inicie o rastreamento
4. Aguarde primeira atualização

### **Problema: Bot usa localização padrão**
**Solução:**
1. Verifique se `DRIVER_LOCATION_MODE=gps` no `.env`
2. Confirme que `driver-location.json` existe
3. Verifique se servidor de localização está rodando

## 📊 Logs do Sistema

### **Inicialização:**
```
🚗 Iniciando bot de corridas de WhatsApp...

📍 Localização do motorista obtida via GPS (arquivo):
   Latitude: -23.5505, Longitude: -46.6333
   Cidade: São Paulo, São Paulo
   Precisão: 15m

✅ Conectado ao WhatsApp!
🚗 Bot de corridas está ativo e aguardando mensagens...
```

### **Atualização de Localização:**
```
🔄 Atualizando localização do motorista...
🔄 Localização do motorista atualizada (GPS):
   Latitude: -23.5510, Longitude: -46.6335
   Precisão: 12m
```

## 💰 Sistema de Preços

### **Cálculo: Distância Total**

```
Tarifa Base:                    R$ 5,00
Distância Motorista→Cliente:    3 km × R$ 2,50 = R$ 7,50
Distância Cliente→Destino:      5 km × R$ 2,50 = R$ 12,50
────────────────────────────────────────────────
Valor Total:                    R$ 25,00
```

## 🔗 APIs Utilizadas

1. **OpenCage** (Geocoding): 2.500 req/dia grátis
2. **OpenRouteService** (Rotas): 2.000 req/dia grátis
3. **ip-api.com** (Cidade por coordenadas): 45 req/min grátis
4. **Geolocation API** (Navegador): Ilimitado e gratuito

## ⚠️ Avisos Importantes

- Bot usa biblioteca não oficial do WhatsApp
- Pode violar termos de serviço do WhatsApp
- Recomendado apenas para uso pessoal/testes
- GPS consome bateria - mantenha dispositivo carregando
- Localização é atualizada a cada movimento (ou ~5 segundos)

## 📝 Licença

MIT

---

## 🎉 Pronto para Usar!

1. ✅ `npm install`
2. ✅ Configure `.env`
3. ✅ `npm run dev`
4. ✅ Abra `http://localhost:3000` no celular do motorista
5. ✅ Permita localização
6. ✅ Escaneie QR Code do WhatsApp
7. ✅ Comece a receber corridas! 🚗💨