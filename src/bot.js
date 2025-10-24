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
import { KEYWORDS, CONVERSATION_STATES, RIDE_STATUS, MESSAGES } from './config/constants.js';

import dotenv from 'dotenv';
dotenv.config();

/*const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const storage = require('./utils/storage');
const geocodingService = require('./services/geocoding');
const routingService = require('./services/routing');
const pricingService = require('./services/pricing');
const { KEYWORDS, CONVERSATION_STATES, RIDE_STATUS, MESSAGES } = require('./config/constants');
*/
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
    
    // Extrair texto da mensagem considerando diferentes tipos
    const messageText = (
      messageContent.conversation ||
      messageContent.extendedTextMessage?.text ||
      messageContent.buttonsResponseMessage?.selectedDisplayText ||
      messageContent.listResponseMessage?.title ||
      ''
    ).trim();

    // Verificar se é mensagem de localização
    const hasLocation = Boolean(messageContent.locationMessage);
    
    // Ignorar mensagens vazias e do próprio bot
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
          
        case CONVERSATION_STATES.WAITING_CONFIRMATION:
          await handleConfirmation(from, messageText);
          break;
          
        case CONVERSATION_STATES.WAITING_SCHEDULE:
          await handleSchedule(from, messageText);
          break;
      }
    } catch (error) {
      console.error(`Erro ao processar mensagem: ${error.message}`);
      await sendMessage(from, MESSAGES.ERROR_GEOCODING);
      storage.clearConversation(from);
    }
  }
}

// Melhorar a detecção de palavras-chave
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
    
    const summary = `📊 *Resumo da Corrida*

📍 *Origem:* ${conversationState.data.origin.address}
📍 *Destino:* ${destinationAddress}

📏 *Distância:* ${routeInfo.clientToDestination.distance} km
⏱️ *Tempo estimado:* ${routeInfo.clientToDestination.duration} minutos
💰 *Valor:* ${priceInfo.formatted}

Escolha uma opção:`.trim();
    
    const buttons = [
      { buttonId: 'confirmar', buttonText: { displayText: 'Confirmar Agora' }, type: 1 },
      { buttonId: 'agendar', buttonText: { displayText: 'Agendar Corrida' }, type: 1 },
      { buttonId: 'cancelar', buttonText: { displayText: 'Cancelar' }, type: 1 }
    ];

    const buttonMessage = {
      text: summary,
      footer: buttons,
      headerType: 1
    };

    await sock.sendMessage(from, buttonMessage);
  } catch (error) {
    console.error('Erro ao processar destino:', error);
    await sendMessage(from, MESSAGES.ERROR_ROUTING);
  }
}

async function handleConfirmation(from, messageText) {
  const text = messageText.toLowerCase().trim();
  const conversationState = storage.getConversationState(from);
  
  if (text === 'confirmar' || text === 'confirmar agora') {
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
  } else if (text === 'agendar' || text === 'agendar corrida') {
    storage.setConversationState(from, CONVERSATION_STATES.WAITING_SCHEDULE);
    await sendMessage(from, '📅 Para quando deseja agendar? (exemplo: "amanhã 14:00" ou "hoje 18:30")');
  } else if (text === 'cancelar') {
    await sendMessage(from, 'Corrida cancelada. Digite "uber" quando quiser solicitar uma nova corrida.');
    storage.clearConversation(from);
  } else {
    await sendMessage(from, MESSAGES.INVALID_OPTION);
  }
}

async function handleSchedule(from, messageText) {
  const conversationState = storage.getConversationState(from);
  
  const scheduledTime = parseScheduleTime(messageText);
  
  const ride = storage.addRide({
    clientPhone: from,
    origin: conversationState.data.origin,
    destination: conversationState.data.destination,
    route: conversationState.data.route,
    price: conversationState.data.price,
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
  
  await sendMessage(from, `${MESSAGES.RIDE_SCHEDULED}\n\n📅 Data/Hora: ${messageText}`);
  
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
      tomorrow.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      return tomorrow;
    }
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }
  
  if (lowerText.includes('hoje')) {
    const today = new Date(now);
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      today.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      return today;
    }
  }
  
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const scheduled = new Date(now);
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    scheduled.setHours(hour, minute, 0, 0);
    
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    return scheduled;
  }
  
  const futureTime = new Date(now);
  futureTime.setHours(now.getHours() + 2);
  return futureTime;
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
