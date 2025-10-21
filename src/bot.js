const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const storage = require('./utils/storage');
const geocodingService = require('./services/geocoding');
const routingService = require('./services/routing');
const pricingService = require('./services/pricing');
const { KEYWORDS, CONVERSATION_STATES, RIDE_STATUS, MESSAGES } = require('./config/constants');

let sock;
let driverLocation = null;

async function initializeDriverLocation() {
  const driverIp = process.env.DRIVER_IP || 'auto';
  
  if (driverIp === 'auto') {
    try {
      const axios = require('axios');
      const response = await axios.get('https://api.ipify.org?format=json');
      const publicIp = response.data.ip;
      driverLocation = await geocodingService.getLocationFromIP(publicIp);
      console.log('📍 Localização do motorista obtida via IP:', driverLocation);
    } catch (error) {
      console.log('⚠️  Não foi possível obter localização automática do motorista');
      driverLocation = { latitude: -23.5505, longitude: -46.6333 };
    }
  } else {
    driverLocation = await geocodingService.getLocationFromIP(driverIp);
  }
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexão fechada. Reconectando:', shouldReconnect);
      
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!');
      console.log('🚗 Bot de corridas está ativo e aguardando mensagens...\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', handleMessage);
}

async function handleMessage({ messages, type }) {
  if (type !== 'notify') return;
  
  for (const msg of messages) {
    if (!msg.message || msg.key.fromMe) continue;
    
    const from = msg.key.remoteJid;
    const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const hasLocation = msg.message.locationMessage;
    
    console.log(`📩 Mensagem de ${from}: ${messageText || '[Localização]'}`);
    
    const conversationState = storage.getConversationState(from);
    
    if (conversationState.state === CONVERSATION_STATES.IDLE) {
      if (containsKeyword(messageText.toLowerCase(), KEYWORDS.START)) {
        await sendMessage(from, MESSAGES.WELCOME);
        storage.setConversationState(from, CONVERSATION_STATES.WAITING_ORIGIN);
      }
    } else if (conversationState.state === CONVERSATION_STATES.WAITING_ORIGIN) {
      await handleOrigin(from, messageText, hasLocation, msg);
    } else if (conversationState.state === CONVERSATION_STATES.WAITING_DESTINATION) {
      await handleDestination(from, messageText, hasLocation, msg);
    } else if (conversationState.state === CONVERSATION_STATES.WAITING_CONFIRMATION) {
      await handleConfirmation(from, messageText);
    } else if (conversationState.state === CONVERSATION_STATES.WAITING_SCHEDULE) {
      await handleSchedule(from, messageText);
    }
  }
}

function containsKeyword(text, keywords) {
  return keywords.some(keyword => text.includes(keyword));
}

async function handleOrigin(from, messageText, hasLocation, msg) {
  try {
    let originCoords;
    let originAddress;
    
    if (hasLocation) {
      const location = msg.message.locationMessage;
      originCoords = {
        latitude: location.degreesLatitude,
        longitude: location.degreesLongitude,
      };
      originAddress = 'Localização compartilhada';
    } else {
      await sendMessage(from, MESSAGES.PROCESSING);
      const geocoded = await geocodingService.geocodeAddress(messageText);
      
      if (!geocoded) {
        await sendMessage(from, MESSAGES.ERROR_GEOCODING);
        return;
      }
      
      originCoords = {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
      };
      originAddress = geocoded.formattedAddress;
    }
    
    storage.setConversationState(from, CONVERSATION_STATES.WAITING_DESTINATION, {
      origin: { coords: originCoords, address: originAddress },
    });
    
    await sendMessage(from, MESSAGES.ASK_DESTINATION);
  } catch (error) {
    console.error('Erro ao processar origem:', error);
    await sendMessage(from, MESSAGES.ERROR_GEOCODING);
  }
}

async function handleDestination(from, messageText, hasLocation, msg) {
  try {
    let destinationCoords;
    let destinationAddress;
    
    if (hasLocation) {
      const location = msg.message.locationMessage;
      destinationCoords = {
        latitude: location.degreesLatitude,
        longitude: location.degreesLongitude,
      };
      destinationAddress = 'Localização compartilhada';
    } else {
      await sendMessage(from, MESSAGES.PROCESSING);
      const geocoded = await geocodingService.geocodeAddress(messageText);
      
      if (!geocoded) {
        await sendMessage(from, MESSAGES.ERROR_GEOCODING);
        return;
      }
      
      destinationCoords = {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
      };
      destinationAddress = geocoded.formattedAddress;
    }
    
    const conversationState = storage.getConversationState(from);
    const originCoords = conversationState.data.origin.coords;
    
    const routeInfo = await routingService.calculateMultipleRoutes(
      driverLocation,
      originCoords,
      destinationCoords
    );
    
    const priceInfo = pricingService.getPriceBreakdown(routeInfo.clientToDestination.distance);
    
    storage.setConversationState(from, CONVERSATION_STATES.WAITING_CONFIRMATION, {
      ...conversationState.data,
      destination: { coords: destinationCoords, address: destinationAddress },
      route: routeInfo,
      price: priceInfo,
    });
    
    const summary = `
📊 *Resumo da Corrida*

📍 *Origem:* ${conversationState.data.origin.address}
📍 *Destino:* ${destinationAddress}

📏 *Distância:* ${routeInfo.clientToDestination.distance} km
⏱️ *Tempo estimado:* ${routeInfo.clientToDestination.duration} minutos
💰 *Valor:* ${priceInfo.formatted}

${MESSAGES.ASK_SCHEDULE}
    `.trim();
    
    await sendMessage(from, summary);
  } catch (error) {
    console.error('Erro ao processar destino:', error);
    await sendMessage(from, MESSAGES.ERROR_ROUTING);
  }
}

async function handleConfirmation(from, messageText) {
  const text = messageText.toLowerCase().trim();
  const conversationState = storage.getConversationState(from);
  
  if (text === 'confirmar') {
    const ride = storage.addRide({
      clientPhone: from,
      origin: conversationState.data.origin,
      destination: conversationState.data.destination,
      route: conversationState.data.route,
      price: conversationState.data.price,
      status: RIDE_STATUS.CONFIRMED,
    });
    
    await sendMessage(from, MESSAGES.RIDE_CONFIRMED);
    await notifyDriver(ride);
    
    storage.clearConversation(from);
  } else if (text === 'agendar') {
    storage.setConversationState(from, CONVERSATION_STATES.WAITING_SCHEDULE);
    await sendMessage(from, '📅 Para quando deseja agendar? (exemplo: "amanhã 14:00" ou "hoje 18:30")');
  } else {
    await sendMessage(from, MESSAGES.INVALID_OPTION);
  }
}

async function handleSchedule(from, messageText) {
  const conversationState = storage.getConversationState(from);
  
  const ride = storage.addRide({
    clientPhone: from,
    origin: conversationState.data.origin,
    destination: conversationState.data.destination,
    route: conversationState.data.route,
    price: conversationState.data.price,
    status: RIDE_STATUS.SCHEDULED,
    scheduledFor: messageText,
  });
  
  await sendMessage(from, `${MESSAGES.RIDE_SCHEDULED}\n\n📅 Data/Hora: ${messageText}`);
  
  storage.clearConversation(from);
}

async function notifyDriver(ride) {
  const driverPhone = process.env.DRIVER_PHONE;
  
  if (!driverPhone) {
    console.log('⚠️  Número do motorista não configurado');
    return;
  }
  
  const notification = `
🚗 *Nova Corrida Confirmada!*

👤 *Cliente:* ${ride.clientPhone}

📍 *Origem:* ${ride.origin.address}
📍 *Destino:* ${ride.destination.address}

📏 *Distância até cliente:* ${ride.route.driverToClient.distance} km (${ride.route.driverToClient.duration} min)
📏 *Distância da corrida:* ${ride.route.clientToDestination.distance} km
💰 *Valor:* ${ride.price.formatted}

🆔 Corrida #${ride.id}
  `.trim();
  
  try {
    await sendMessage(`${driverPhone}@s.whatsapp.net`, notification);
    console.log('✅ Motorista notificado!');
  } catch (error) {
    console.error('❌ Erro ao notificar motorista:', error);
  }
}

async function sendMessage(to, text) {
  try {
    await sock.sendMessage(to, { text });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
}

function setupScheduledReminders() {
  cron.schedule('*/5 * * * *', () => {
    const scheduledRides = storage.getScheduledRides();
    const now = new Date();
    
    scheduledRides.forEach(([phoneNumber, rideInfo]) => {
      console.log(`⏰ Verificando lembretes agendados... (${scheduledRides.length} corridas)`);
    });
  });
  
  console.log('⏰ Sistema de lembretes ativado (verifica a cada 5 minutos)');
}

async function startBot() {
  console.log('🚗 Iniciando bot de corridas de WhatsApp...\n');
  
  await initializeDriverLocation();
  await connectToWhatsApp();
  setupScheduledReminders();
}

startBot().catch(err => {
  console.error('❌ Erro ao iniciar bot:', err);
  process.exit(1);
});
