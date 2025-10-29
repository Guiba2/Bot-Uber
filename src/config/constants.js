export const KEYWORDS = {
  START: [
    'chamar carro',
    'chamar um carro',
    'pedir carro',
    'quero um carro',
    'preciso de carro',
    'uber',
    'corrida',
    'nova corrida',
    'solicitar',
    'oi',
    'olá',
    'ola',
    'começar',
    'iniciar'
  ],
  CANCEL: [
    "cancelar",
    "cancela",
    "desistir",
    "desisto",
    "parar",
    "para",
    "sair",
    "voltar",
    "não quero mais",
    "nao quero mais",
    "esquece",
    "esquecer"

  ]
};

export const CONVERSATION_STATES = {
  IDLE: 'idle',
  WAITING_ORIGIN: 'waiting_origin',
  CONFIRMING_ORIGIN: 'confirming_origin',
  WAITING_DESTINATION: 'waiting_destination',
  CONFIRMING_DESTINATION: 'confirming_destination',
  WAITING_CONFIRMATION: 'waiting_confirmation',
  WAITING_SCHEDULE: 'waiting_schedule',
};

export const RIDE_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PRICING = {
  BASE_FARE: 5.0,
  PRICE_PER_KM: 3.5,
  MINIMUM_FARE: 10.0,
};

export const MESSAGES = {
  WELCOME: 'Olá! 👋\n\nQual é o seu ponto de partida?\n\nVocê pode enviar sua localização 📍 ou digitar o endereço.',
  ASK_DESTINATION: 'Ótimo! Agora me informe o destino.\n\nVocê pode enviar a localização 📍 ou digitar o endereço.',
  PROCESSING: '⏳ Aguarde um momento, estou processando sua solicitação...',
  ERROR_GEOCODING: '😕 Desculpe, não consegui localizar esse endereço.\n\nPor favor, tente novamente com mais detalhes (ex: "Rua X, número Y" ou "próximo ao shopping Z").',
  ERROR_ROUTING: '😕 Desculpe, não consegui calcular a rota.\n\nPor favor, tente novamente.',
  ASK_SCHEDULE: 'Deseja confirmar a corrida agora ou agendar?\n\nDigite "confirmar" ou "agendar".',
  RIDE_CONFIRMED: '✅ *Corrida confirmada!*\n\nO motorista foi notificado e em breve estará a caminho! 🚗',
  RIDE_SCHEDULED: '✅ *Corrida agendada com sucesso!* 📅\n\nVocê receberá um lembrete 1 hora antes.',
  INVALID_OPTION: '❌ Opção inválida.\n\nPor favor, digite "confirmar", "agendar" ou "cancelar".',
  CANCELLED: '❌ Sua solicitação de corrida foi cancelada.\n\nSe precisar de algo, é só chamar! 😊',
};