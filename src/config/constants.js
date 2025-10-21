module.exports = {
  KEYWORDS: {
    START: ['chamar carro', 'chamar um carro', 'pedir carro', 'quero um carro', 'preciso de carro'],
  },
  
  CONVERSATION_STATES: {
    IDLE: 'idle',
    WAITING_ORIGIN: 'waiting_origin',
    WAITING_DESTINATION: 'waiting_destination',
    WAITING_CONFIRMATION: 'waiting_confirmation',
    WAITING_SCHEDULE: 'waiting_schedule',
  },
  
  RIDE_STATUS: {
    PENDING: 'pending',
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  
  PRICING: {
    BASE_FARE: 5.00,
    PRICE_PER_KM: 2.50,
    MINIMUM_FARE: 10.00,
  },
  
  MESSAGES: {
    WELCOME: 'Olá! Qual é o ponto de partida?',
    ASK_DESTINATION: 'Ótimo! Agora me informe o destino.',
    PROCESSING: 'Aguarde um momento, estou processando sua solicitação...',
    ERROR_GEOCODING: 'Desculpe, não consegui localizar esse endereço. Pode tentar novamente?',
    ERROR_ROUTING: 'Desculpe, não consegui calcular a rota. Tente novamente.',
    ASK_SCHEDULE: 'Deseja confirmar a corrida agora ou agendar? Digite "confirmar" ou "agendar".',
    RIDE_CONFIRMED: '✅ Corrida confirmada! O motorista foi notificado.',
    RIDE_SCHEDULED: '📅 Corrida agendada com sucesso!',
    INVALID_OPTION: 'Opção inválida. Digite "confirmar" ou "agendar".',
  },
};
