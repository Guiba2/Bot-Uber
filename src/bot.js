import makeWASocket from '@whiskeysockets/baileys';
import { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import axios from 'axios';

import storage from './utils/storage.js';
import geocodingService from './services/geocoding.js';
import routingService from './services/routing.js';
import pricingService from './services/pricing.js';
import { KEYWORDS, CONVERSATION_STATES, RIDE_STATUS, MESSAGES, VEHICLE_TYPES } from './config/constants.js';

import dotenv from 'dotenv';
dotenv.config();

let sock;
let driverLocation = null;

async function initializeDriverLocation() {
  const driverIp = process.env.DRIVER_IP || 'auto';
  
  if (driverIp === 'auto') {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      const publicIp = response.data.ip;
      const location = await geocodingService.getLocationFromIP(publicIp);
      
      if (location && location.latitude && location.longitude) {
        driverLocation = location;
        console.log('📍 Localização do motorista obtida via IP:', driverLocation);
      } else {
        throw new Error('Localização inválida retornada');
      }
    } catch (error) {
      console.log('⚠️  Não foi possível obter localização automática do motorista');
      console.log('📍 Usando localização padrão (São Paulo, Brasil)');
      driverLocation = { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo', region: 'SP' };
    }
  } else {
    try {
      const location = await geocodingService.getLocationFromIP(driverIp);
      if (location && location.latitude && location.longitude) {
        driverLocation = location;
        console.log('📍 Localização do motorista obtida via IP:', driverLocation);
      } else {
        throw new Error('Localização inválida retornada');
      }
    } catch (error) {
      console.log('⚠️  Erro ao obter localização do IP fornecido');
      console.log('📍 Usando localização padrão (São Paulo, Brasil)');
      driverLocation = { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo', region: 'SP' };
    }
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
    if (!msg.message) continue;
    
    const from = msg.key.remoteJid;
    const messageContent = msg.message;
    
    const messageText = (
      messageContent.conversation ||
      messageContent.extendedTextMessage?.text ||
      messageContent.buttonsResponseMessage?.selectedDisplayText ||
      messageContent.listResponseMessage?.title ||
      ''
    ).trim();

    const hasLocation = Boolean(messageContent.locationMessage);
    
    if (!messageText && !hasLocation) continue;
    if (msg.key.fromMe) continue;
    
    console.log(`📩 Mensagem de ${from}: ${messageText || '[Localização]'}`);
    
    const conversationState = storage.getConversationState(from);
    
    try {
      switch (conversationState.state) {
        case CONVERSATION_STATES.IDLE:
          if (containsKeyword(messageText.toLowerCase(), KEYWORDS.START)) {
            await sendMessage(from, MESSAGES.WELCOME);
            storage.setConversationState(from, CONVERSATION_STATES.WAITING_ORIGIN);
          }
          break;
          
        case CONVERSATION_STATES.WAITING_ORIGIN:
          await handleOrigin(from, messageText, hasLocation, msg);
          break;
          
        case CONVERSATION_STATES.WAITING_DESTINATION:
          await handleDestination(from, messageText, hasLocation, msg);
          break;
          
        case CONVERSATION_STATES.WAITING_VEHICLE_TYPE:
          await handleVehicleType(from, messageText);
          break;
          
        case CONVERSATION_STATES.WAITING_CONFIRMATION:
          await handleConfirmation(from, messageText);
          break;
          
        case CONVERSATION_STATES.WAITING_SCHEDULE:
          await handleSchedule(from, messageText);
          break;
      }
    } catch (error) {
      console.error(`Erro ao processar mensagem: ${error.message}`);
      
      if (error.message.includes('geocod')) {
        await sendMessage(from, MESSAGES.ERROR_GEOCODING);
      } else if (error.message.includes('rota') || error.message.includes('routing')) {
        await sendMessage(from, MESSAGES.ERROR_ROUTING);
      } else {
        await sendMessage(from, MESSAGES.ERROR_GENERAL);
      }
      
      storage.clearConversation(from);
    }
  }
}

function containsKeyword(text, keywords) {
  if (!text) return false;
  return keywords.some(keyword => 
    text.includes(keyword) || 
    text.replace(/\s+/g, '').includes(keyword.replace(/\s+/g, ''))
  );
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
    
    storage.setConversationState(from, CONVERSATION_STATES.WAITING_VEHICLE_TYPE, {
      ...conversationState.data,
      destination: { coords: destinationCoords, address: destinationAddress },
    });
    
    await sendMessage(from, MESSAGES.ASK_VEHICLE_TYPE);
  } catch (error) {
    console.error('Erro ao processar destino:', error);
    await sendMessage(from, MESSAGES.ERROR_GEOCODING);
  }
}

async function handleVehicleType(from, messageText) {
  try {
    const text = messageText.toLowerCase().trim();
    const conversationState = storage.getConversationState(from);
    const originCoords = conversationState.data.origin.coords;
    const destinationCoords = conversationState.data.destination.coords;
    
    let vehicleType = null;
    let routingOptions = {};
    
    if (text.includes('normal') || text.includes('1')) {
      vehicleType = VEHICLE_TYPES.NORMAL;
      routingOptions.profile = 'driving-car';
    } else if (text.includes('grande') || text.includes('2') || text.includes('pesado')) {
      vehicleType = VEHICLE_TYPES.HEAVY;
      routingOptions.profile = 'driving-hgv';
    } else if (text.includes('emergência') || text.includes('emergencia') || text.includes('3')) {
      vehicleType = VEHICLE_TYPES.EMERGENCY;
      routingOptions.profile = 'driving-car';
    } else {
      vehicleType = VEHICLE_TYPES.NORMAL;
      routingOptions.profile = 'driving-car';
    }
    
    await sendMessage(from, MESSAGES.CALCULATING_ROUTE);
    
    const routeInfo = await routingService.calculateMultipleRoutes(
      driverLocation,
      originCoords,
      destinationCoords,
      routingOptions
    );
    
    const priceInfo = pricingService.getPriceBreakdown(
      routeInfo.clientToDestination.distance,
      vehicleType
    );
    
    storage.setConversationState(from, CONVERSATION_STATES.WAITING_CONFIRMATION, {
      ...conversationState.data,
      route: routeInfo,
      price: priceInfo,
      vehicleType: vehicleType,
    });
    
    const vehicleEmoji = vehicleType === VEHICLE_TYPES.HEAVY ? '🚛' : 
                         vehicleType === VEHICLE_TYPES.EMERGENCY ? '🚑' : '🚗';
    
    const summary = `📊 *Resumo da Corrida*

📍 *Origem:* ${conversationState.data.origin.address}
📍 *Destino:* ${conversationState.data.destination.address}

${vehicleEmoji} *Tipo de veículo:* ${vehicleType}
📏 *Distância:* ${routeInfo.clientToDestination.distance} km
⏱️ *Tempo estimado:* ${routeInfo.clientToDestination.duration} minutos
💰 *Valor:* ${priceInfo.formatted}

Digite uma das opções:
1️⃣ "confirmar" - Confirmar corrida agora
2️⃣ "agendar" - Agendar para depois
3️⃣ "cancelar" - Cancelar solicitação`;
    
    await sendMessage(from, summary);
  } catch (error) {
    console.error('Erro ao processar tipo de veículo:', error);
    await sendMessage(from, MESSAGES.ERROR_ROUTING);
    storage.clearConversation(from);
  }
}

async function handleConfirmation(from, messageText) {
  const text = messageText.toLowerCase().trim();
  const conversationState = storage.getConversationState(from);
  
  if (text === 'confirmar' || text === '1' || text === 'confirmar agora') {
    const ride = storage.addRide({
      clientPhone: from,
      origin: conversationState.data.origin,
      destination: conversationState.data.destination,
      route: conversationState.data.route,
      price: conversationState.data.price,
      vehicleType: conversationState.data.vehicleType,
      status: RIDE_STATUS.CONFIRMED,
    });
    
    await sendMessage(from, MESSAGES.RIDE_CONFIRMED);
    await notifyDriver(ride);
    
    storage.clearConversation(from);
  } else if (text === 'agendar' || text === '2' || text === 'agendar corrida') {
    storage.setConversationState(from, CONVERSATION_STATES.WAITING_SCHEDULE);
    await sendMessage(from, MESSAGES.ASK_SCHEDULE_TIME);
  } else if (text === 'cancelar' || text === '3') {
    await sendMessage(from, MESSAGES.RIDE_CANCELLED);
    storage.clearConversation(from);
  } else {
    await sendMessage(from, MESSAGES.INVALID_OPTION);
  }
}

async function handleSchedule(from, messageText) {
  const conversationState = storage.getConversationState(from);
  
  const scheduledTime = parseScheduleTime(messageText);
  
  if (!scheduledTime || scheduledTime <= new Date()) {
    await sendMessage(from, '⚠️ Horário inválido ou no passado. Tente novamente (exemplo: "hoje 18:00" ou "amanhã 14:30")');
    return;
  }
  
  const ride = storage.addRide({
    clientPhone: from,
    origin: conversationState.data.origin,
    destination: conversationState.data.destination,
    route: conversationState.data.route,
    price: conversationState.data.price,
    vehicleType: conversationState.data.vehicleType,
    status: RIDE_STATUS.SCHEDULED,
    scheduledFor: messageText,
    scheduledTime: scheduledTime,
  });
  
  storage.addScheduledRide(from, {
    ride,
    origin: conversationState.data.origin,
    destination: conversationState.data.destination,
    route: conversationState.data.route,
    price: conversationState.data.price,
  }, scheduledTime);
  
  const formattedTime = scheduledTime.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  await sendMessage(from, `${MESSAGES.RIDE_SCHEDULED}\n\n📅 Data/Hora: ${formattedTime}`);
  
  storage.clearConversation(from);
}

function parseScheduleTime(text) {
  const now = new Date();
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('amanhã') || lowerText.includes('amanha')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
      }
      
      tomorrow.setHours(hour, minute, 0, 0);
      return tomorrow;
    }
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }
  
  if (lowerText.includes('hoje')) {
    const today = new Date(now);
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
      }
      
      today.setHours(hour, minute, 0, 0);
      
      if (today <= now) {
        return null;
      }
      
      return today;
    }
  }
  
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const scheduled = new Date(now);
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    
    scheduled.setHours(hour, minute, 0, 0);
    
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    return scheduled;
  }
  
  return null;
}

async function notifyDriver(ride) {
  const driverPhone = process.env.DRIVER_PHONE;
  
  if (!driverPhone) {
    console.log('⚠️  Número do motorista não configurado');
    return;
  }
  
  const vehicleEmoji = ride.vehicleType === VEHICLE_TYPES.HEAVY ? '🚛' : 
                       ride.vehicleType === VEHICLE_TYPES.EMERGENCY ? '🚑' : '🚗';
  
  const notification = `
🚗 *Nova Corrida Confirmada!*

👤 *Cliente:* ${ride.clientPhone}

📍 *Origem:* ${ride.origin.address}
📍 *Destino:* ${ride.destination.address}

${vehicleEmoji} *Tipo de veículo:* ${ride.vehicleType}
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
  cron.schedule('*/5 * * * *', async () => {
    const scheduledRides = storage.getScheduledRides();
    const now = new Date();
    
    if (scheduledRides.length > 0) {
      console.log(`⏰ Verificando ${scheduledRides.length} corrida(s) agendada(s)...`);
    }
    
    for (const [phoneNumber, rideInfo] of scheduledRides) {
      const scheduledTime = new Date(rideInfo.scheduledTime);
      const timeDiff = scheduledTime - now;
      const oneHour = 60 * 60 * 1000;
      
      if (timeDiff <= 0) {
        console.log(`🚗 Hora da corrida chegou para ${phoneNumber}`);
        await sendMessage(phoneNumber, '🚗 Sua corrida agendada está chegando! O motorista foi notificado.');
        await notifyDriver(rideInfo.rideData.ride);
        storage.removeScheduledRide(phoneNumber);
      } else if (timeDiff <= oneHour && timeDiff > (oneHour - 5 * 60 * 1000)) {
        console.log(`⏰ Enviando lembrete de 1 hora para ${phoneNumber}`);
        const reminderMsg = `⏰ *Lembrete de Corrida*\n\nSua corrida está agendada para daqui a ${Math.round(timeDiff / 60000)} minutos.\n\n📍 Origem: ${rideInfo.rideData.origin.address}\n📍 Destino: ${rideInfo.rideData.destination.address}\n💰 Valor: ${rideInfo.rideData.price.formatted}`;
        await sendMessage(phoneNumber, reminderMsg);
      }
    }
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
